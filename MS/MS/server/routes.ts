import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMessageSchema, insertRoomSchema } from "@shared/schema";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public directory
  app.use(express.static(path.resolve(import.meta.dirname, "../public")));

  // API route to get all rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // API route to create a new room
  app.post("/api/rooms", express.json(), async (req, res) => {
    try {
      const validatedRoom = insertRoomSchema.parse(req.body);
      const existingRoom = await storage.getRoomByName(validatedRoom.name);
      
      if (existingRoom) {
        return res.status(400).json({ error: "Room already exists" });
      }
      
      const room = await storage.createRoom(validatedRoom);
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // API route to get messages for a specific room
  app.get("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const { roomId } = req.params;
      const messages = await storage.getRoomMessages(roomId, 50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // API route to get recent messages (backwards compatibility)
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getRecentMessages(50);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server on /ws path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Track connected clients and their rooms
  const clients = new Map<WebSocket, { roomId?: string; username?: string }>();

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    clients.set(ws, {});

    // Send rooms list to new client
    Promise.all([
      storage.getRooms(),
      storage.getRecentMessages(50)
    ]).then(([rooms]) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'rooms_list',
          rooms: rooms
        }));
      }
    });

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const clientInfo = clients.get(ws);
        
        if (payload.type === 'join_room') {
          // Client wants to join a room
          if (clientInfo) {
            clientInfo.roomId = payload.roomId;
            clientInfo.username = payload.username;
            clients.set(ws, clientInfo);
          }
          
          // Send room message history
          const messages = await storage.getRoomMessages(payload.roomId, 50);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'room_history',
              roomId: payload.roomId,
              messages: messages
            }));
          }
        } else if (payload.type === 'message') {
          // Validate message data
          const validatedMessage = insertMessageSchema.parse({
            roomId: payload.roomId || (clientInfo ? clientInfo.roomId : undefined),
            username: payload.username,
            content: payload.content
          });

          // Store message
          const message = await storage.createMessage(validatedMessage);

          // Broadcast to clients in the same room
          const broadcastData = JSON.stringify({
            type: 'new_message',
            message: message
          });

          clients.forEach((info, client) => {
            if (info.roomId === message.roomId && client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        } else if (payload.type === 'create_room') {
          // Create new room
          try {
            const validatedRoom = insertRoomSchema.parse({
              name: payload.name
            });
            
            const existingRoom = await storage.getRoomByName(validatedRoom.name);
            if (existingRoom) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Room already exists'
                }));
              }
              return;
            }
            
            const room = await storage.createRoom(validatedRoom);
            
            // Broadcast new room to all clients
            const roomData = JSON.stringify({
              type: 'new_room',
              room: room
            });
            
            clients.forEach((info, client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(roomData);
              }
            });
          } catch (error) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to create room'
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return httpServer;
}
