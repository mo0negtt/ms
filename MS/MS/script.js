/**
 * CloudCast Real-time Room-based Messaging Application
 * Neo-brutalist design with WhatsApp-inspired interface
 */

class CloudCast {
    constructor() {
        this.socket = null;
        this.username = this.generateUsername();
        this.currentRoomId = null;
        this.currentRoomName = null;
        this.rooms = new Map();
        this.isConnected = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.connect();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Sidebar elements
        this.newRoomBtn = document.getElementById('newRoomBtn');
        this.newRoomForm = document.getElementById('newRoomForm');
        this.roomNameInput = document.getElementById('roomNameInput');
        this.createRoomBtn = document.getElementById('createRoomBtn');
        this.cancelRoomBtn = document.getElementById('cancelRoomBtn');
        this.roomList = document.getElementById('roomList');
        
        // Status elements
        this.statusDot = document.getElementById('statusDot');
        this.connectionText = document.getElementById('connectionText');
        this.currentUsername = document.getElementById('currentUsername');
        
        // Chat elements
        this.currentRoomName = document.getElementById('currentRoomName');
        this.roomDescription = document.getElementById('roomDescription');
        this.participantsCount = document.getElementById('participantsCount');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.messageInputArea = document.getElementById('messageInputArea');
        
        // Modal elements
        this.roomSelectorModal = document.getElementById('roomSelectorModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.modalRoomList = document.getElementById('modalRoomList');
        
        // Connection overlay
        this.connectionOverlay = document.getElementById('connectionOverlay');
        
        // Set initial username
        this.currentUsername.textContent = this.username;
    }

    /**
     * Generate a random username for the user
     */
    generateUsername() {
        const adjectives = ['CYBER', 'DIGITAL', 'QUANTUM', 'MATRIX', 'NEURAL', 'BINARY', 'PIXEL', 'CODE', 'NEON', 'GHOST'];
        const nouns = ['WARRIOR', 'HACKER', 'GHOST', 'RIDER', 'HUNTER', 'WIZARD', 'NINJA', 'MASTER', 'PHANTOM', 'SHADOW'];
        const number = Math.floor(Math.random() * 999) + 1;
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        return `${adjective}_${noun}_${number}`;
    }

    /**
     * Attach event listeners to interactive elements
     */
    attachEventListeners() {
        // Room creation
        this.newRoomBtn.addEventListener('click', () => this.toggleNewRoomForm());
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.cancelRoomBtn.addEventListener('click', () => this.hideNewRoomForm());
        
        // Room name input
        this.roomNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.createRoom();
            }
        });

        // Message input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.messageInput.value = '';
            }
        });

        // Send button
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Modal
        this.closeModalBtn?.addEventListener('click', () => this.hideRoomModal());
        this.roomSelectorModal?.addEventListener('click', (e) => {
            if (e.target === this.roomSelectorModal) {
                this.hideRoomModal();
            }
        });
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            console.log('Connecting to WebSocket:', wsUrl);
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.addEventListener('open', () => this.onConnect());
            this.socket.addEventListener('message', (event) => this.handleMessage(event.data));
            this.socket.addEventListener('close', () => this.onDisconnect());
            this.socket.addEventListener('error', (error) => this.onError(error));
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.onError();
        }
    }

    /**
     * Handle successful connection
     */
    onConnect() {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.hideConnectionOverlay();
        this.updateConnectionStatus('CONNECTED', true);
        this.showSystemMessage('CONNECTED TO CLOUDCAST');
    }

    /**
     * Handle disconnection
     */
    onDisconnect() {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.showConnectionOverlay();
        this.updateConnectionStatus('DISCONNECTED', false);
        
        // Disable inputs
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
            if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                console.log('Attempting to reconnect...');
                this.connect();
            }
        }, 3000);
    }

    /**
     * Handle connection error
     */
    onError(error) {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.showConnectionOverlay();
        this.updateConnectionStatus('ERROR', false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
            this.connect();
        }, 5000);
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'rooms_list':
                    this.loadRooms(message.rooms);
                    break;
                    
                case 'room_history':
                    this.loadRoomHistory(message.roomId, message.messages);
                    break;
                    
                case 'new_message':
                    this.displayMessage(message.message, true);
                    break;
                    
                case 'new_room':
                    this.addRoom(message.room);
                    break;
                    
                case 'error':
                    this.showSystemMessage(`ERROR: ${message.message}`);
                    break;
                    
                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Load rooms list
     */
    loadRooms(rooms) {
        this.rooms.clear();
        rooms.forEach(room => {
            this.rooms.set(room.id, room);
        });
        this.renderRoomsList();
        
        // Auto-join first room if available
        if (rooms.length > 0 && !this.currentRoomId) {
            this.joinRoom(rooms[0].id, rooms[0].name);
        }
    }

    /**
     * Load room message history
     */
    loadRoomHistory(roomId, messages) {
        if (roomId !== this.currentRoomId) return;
        
        // Clear current messages except welcome message
        this.messagesContainer.innerHTML = '';
        
        if (messages && messages.length > 0) {
            messages.forEach(message => {
                this.displayMessage(message, false);
            });
        }
        
        this.scrollToBottom();
    }

    /**
     * Add a new room to the list
     */
    addRoom(room) {
        this.rooms.set(room.id, room);
        this.renderRoomsList();
    }

    /**
     * Render the rooms list in the sidebar
     */
    renderRoomsList() {
        this.roomList.innerHTML = '';
        
        Array.from(this.rooms.values())
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .forEach(room => {
                const roomEl = document.createElement('div');
                roomEl.className = `room-item ${room.id === this.currentRoomId ? 'active' : ''}`;
                roomEl.innerHTML = `
                    <span class="room-name">${this.escapeHtml(room.name.toUpperCase())}</span>
                    <div class="room-indicator"></div>
                `;
                
                roomEl.addEventListener('click', () => {
                    this.joinRoom(room.id, room.name);
                });
                
                this.roomList.appendChild(roomEl);
            });
    }

    /**
     * Join a chat room
     */
    joinRoom(roomId, roomName) {
        if (!this.isConnected) {
            this.showSystemMessage('NOT CONNECTED - CANNOT JOIN ROOM');
            return;
        }
        
        this.currentRoomId = roomId;
        this.currentRoomName = roomName;
        
        // Update UI
        this.updateRoomHeader(roomName);
        this.enableMessageInput();
        this.renderRoomsList();
        
        // Send join room message to server
        this.socket.send(JSON.stringify({
            type: 'join_room',
            roomId: roomId,
            username: this.username
        }));
        
        this.showSystemMessage(`JOINED ROOM: ${roomName.toUpperCase()}`);
    }

    /**
     * Create a new room
     */
    createRoom() {
        const roomName = this.roomNameInput.value.trim();
        
        if (!roomName) {
            this.roomNameInput.focus();
            return;
        }
        
        if (!this.isConnected) {
            this.showSystemMessage('NOT CONNECTED - CANNOT CREATE ROOM');
            return;
        }
        
        // Send create room message to server
        this.socket.send(JSON.stringify({
            type: 'create_room',
            name: roomName
        }));
        
        this.hideNewRoomForm();
        this.roomNameInput.value = '';
    }

    /**
     * Send a message to the current room
     */
    sendMessage() {
        const content = this.messageInput.value.trim();
        
        if (!content) {
            this.messageInput.focus();
            return;
        }
        
        if (!this.isConnected) {
            this.showSystemMessage('NOT CONNECTED - MESSAGE NOT SENT');
            return;
        }
        
        if (!this.currentRoomId) {
            this.showSystemMessage('NO ROOM SELECTED - SELECT A ROOM FIRST');
            return;
        }
        
        if (content.length > 500) {
            this.showSystemMessage('MESSAGE TOO LONG - MAX 500 CHARACTERS');
            return;
        }
        
        // Send message via WebSocket
        const message = {
            type: 'message',
            roomId: this.currentRoomId,
            username: this.username,
            content: content
        };
        
        this.socket.send(JSON.stringify(message));
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.focus();
    }

    /**
     * Display a message in the chat
     */
    displayMessage(message, animate = true) {
        const messageEl = document.createElement('div');
        
        // Determine message type
        if (message.username === 'SYSTEM') {
            messageEl.className = 'message system';
        } else if (message.username === this.username) {
            messageEl.className = 'message own';
        } else {
            messageEl.className = 'message other';
        }
        
        if (animate) {
            messageEl.style.animation = 'slideInMessage 0.3s ease-out';
        }
        
        // Format timestamp
        const timestamp = new Date(message.timestamp);
        const timeStr = timestamp.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Build message HTML
        if (message.username === 'SYSTEM') {
            messageEl.innerHTML = `
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="message-header">
                    <span class="message-username">${this.escapeHtml(message.username)}</span>
                    <span class="message-timestamp">${timeStr}</span>
                </div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            `;
        }
        
        this.messagesContainer.appendChild(messageEl);
        
        if (animate) {
            this.scrollToBottom();
        }
    }

    /**
     * Show a system message
     */
    showSystemMessage(content) {
        const systemMessage = {
            username: 'SYSTEM',
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.displayMessage(systemMessage, true);
    }

    /**
     * Update room header information
     */
    updateRoomHeader(roomName) {
        const headerEl = document.getElementById('currentRoomName');
        const descEl = document.getElementById('roomDescription');
        
        headerEl.textContent = roomName.toUpperCase();
        descEl.textContent = 'REAL-TIME MESSAGING ACTIVE';
    }

    /**
     * Enable message input
     */
    enableMessageInput() {
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus(status, isOnline) {
        this.connectionText.textContent = status;
        this.statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
    }

    /**
     * Show/hide new room form
     */
    toggleNewRoomForm() {
        const isVisible = !this.newRoomForm.classList.contains('hidden');
        if (isVisible) {
            this.hideNewRoomForm();
        } else {
            this.showNewRoomForm();
        }
    }

    showNewRoomForm() {
        this.newRoomForm.classList.remove('hidden');
        this.roomNameInput.focus();
    }

    hideNewRoomForm() {
        this.newRoomForm.classList.add('hidden');
        this.roomNameInput.value = '';
    }

    /**
     * Show/hide room selector modal (for mobile)
     */
    showRoomModal() {
        this.roomSelectorModal.classList.remove('hidden');
    }

    hideRoomModal() {
        this.roomSelectorModal.classList.add('hidden');
    }

    /**
     * Show/hide connection overlay
     */
    showConnectionOverlay() {
        this.connectionOverlay.classList.remove('hidden');
    }

    hideConnectionOverlay() {
        this.connectionOverlay.classList.add('hidden');
    }

    /**
     * Scroll messages container to bottom
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize CloudCast when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('CloudCast initializing...');
    window.cloudcast = new CloudCast();
});