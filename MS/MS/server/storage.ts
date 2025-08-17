import { type User, type InsertUser, type Room, type InsertRoom, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRooms(): Promise<Room[]>;
  getRoomByName(name: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRoomMessages(roomId: string, limit?: number): Promise<Message[]>;
  getRecentMessages(limit?: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rooms: Map<string, Room>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.messages = new Map();
    
    // Create default general room synchronously
    const defaultRoomId = randomUUID();
    const defaultRoom: Room = {
      id: defaultRoomId,
      name: 'general',
      createdAt: new Date()
    };
    this.rooms.set(defaultRoomId, defaultRoom);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.name === name);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = { 
      ...insertRoom, 
      id, 
      createdAt: new Date() 
    };
    this.rooms.set(id, room);
    return room;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async getRoomMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => message.roomId === roomId);
    return messages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    const messages = Array.from(this.messages.values());
    return messages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }
}

export const storage = new MemStorage();
