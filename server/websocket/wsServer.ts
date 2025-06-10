import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { extractUser } from '../middleware/auth';
import { storage } from '../storage';
import { z } from 'zod';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  orangeId?: string;
  isAlive?: boolean;
}

interface WSMessage {
  type: string;
  payload: any;
}

// Message schemas
const authMessageSchema = z.object({
  type: z.literal('auth'),
  payload: z.object({
    orangeId: z.string()
  })
});

const subscribeMessageSchema = z.object({
  type: z.literal('subscribe'),
  payload: z.object({
    discussionId: z.number().optional(),
    channel: z.enum(['all-discussions', 'my-discussions'])
  })
});

const unsubscribeMessageSchema = z.object({
  type: z.literal('unsubscribe'),
  payload: z.object({
    discussionId: z.number().optional(),
    channel: z.enum(['all-discussions', 'my-discussions']).optional()
  })
});

export class DiscussionWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map(); // userId -> Set of connections
  private discussionSubscribers: Map<number, Set<AuthenticatedWebSocket>> = new Map(); // discussionId -> Set of connections
  private pingInterval: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/discussions'
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      console.log('New WebSocket connection');
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(ws);
      });

      // Send initial connection success
      this.sendMessage(ws, {
        type: 'connection',
        payload: { status: 'connected' }
      });
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WSMessage) {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(ws, message);
        break;
      
      case 'subscribe':
        await this.handleSubscribe(ws, message);
        break;
      
      case 'unsubscribe':
        await this.handleUnsubscribe(ws, message);
        break;
      
      case 'ping':
        this.sendMessage(ws, { type: 'pong', payload: {} });
        break;
      
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleAuth(ws: AuthenticatedWebSocket, message: any) {
    try {
      const validated = authMessageSchema.parse(message);
      const { orangeId } = validated.payload;

      // Verify user exists
      const user = await storage.getUserByOrangeId(orangeId);
      if (!user) {
        this.sendError(ws, 'Authentication failed');
        ws.close();
        return;
      }

      // Store user info on the WebSocket
      ws.userId = user.id;
      ws.orangeId = orangeId;

      // Add to clients map
      if (!this.clients.has(user.id)) {
        this.clients.set(user.id, new Set());
      }
      this.clients.get(user.id)!.add(ws);

      this.sendMessage(ws, {
        type: 'auth',
        payload: { status: 'authenticated', userId: user.id }
      });

      console.log(`WebSocket authenticated for user ${user.id}`);
    } catch (error) {
      this.sendError(ws, 'Invalid auth message');
    }
  }

  private async handleSubscribe(ws: AuthenticatedWebSocket, message: any) {
    if (!ws.userId) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    try {
      const validated = subscribeMessageSchema.parse(message);
      const { discussionId, channel } = validated.payload;

      if (discussionId) {
        // Subscribe to specific discussion
        if (!this.discussionSubscribers.has(discussionId)) {
          this.discussionSubscribers.set(discussionId, new Set());
        }
        this.discussionSubscribers.get(discussionId)!.add(ws);

        this.sendMessage(ws, {
          type: 'subscribed',
          payload: { discussionId }
        });
      } else if (channel === 'my-discussions') {
        // User is already in clients map from auth
        this.sendMessage(ws, {
          type: 'subscribed',
          payload: { channel: 'my-discussions' }
        });
      }
    } catch (error) {
      this.sendError(ws, 'Invalid subscribe message');
    }
  }

  private async handleUnsubscribe(ws: AuthenticatedWebSocket, message: any) {
    try {
      const validated = unsubscribeMessageSchema.parse(message);
      const { discussionId } = validated.payload;

      if (discussionId && this.discussionSubscribers.has(discussionId)) {
        this.discussionSubscribers.get(discussionId)!.delete(ws);
        
        // Clean up empty sets
        if (this.discussionSubscribers.get(discussionId)!.size === 0) {
          this.discussionSubscribers.delete(discussionId);
        }

        this.sendMessage(ws, {
          type: 'unsubscribed',
          payload: { discussionId }
        });
      }
    } catch (error) {
      this.sendError(ws, 'Invalid unsubscribe message');
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      // Remove from clients map
      const userConnections = this.clients.get(ws.userId);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          this.clients.delete(ws.userId);
        }
      }

      // Remove from all discussion subscriptions
      for (const [discussionId, subscribers] of this.discussionSubscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.discussionSubscribers.delete(discussionId);
        }
      }

      console.log(`WebSocket disconnected for user ${ws.userId}`);
    }
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      payload: { error }
    });
  }

  // Public methods for broadcasting updates
  public broadcastDiscussionUpdate(discussionId: number, discussion: any, action: 'created' | 'updated' | 'deleted') {
    const message: WSMessage = {
      type: 'discussion-update',
      payload: {
        action,
        discussionId,
        discussion: action !== 'deleted' ? discussion : null
      }
    };

    // Send to discussion subscribers
    const subscribers = this.discussionSubscribers.get(discussionId);
    if (subscribers) {
      for (const ws of subscribers) {
        this.sendMessage(ws, message);
      }
    }

    // Send to the discussion owner
    if (discussion && discussion.userId) {
      const ownerConnections = this.clients.get(discussion.userId);
      if (ownerConnections) {
        for (const ws of ownerConnections) {
          this.sendMessage(ws, message);
        }
      }
    }
  }

  public broadcastUserDiscussionsUpdate(userId: number, discussion: any, action: 'created' | 'updated' | 'deleted') {
    const message: WSMessage = {
      type: 'user-discussions-update',
      payload: {
        action,
        discussion: action !== 'deleted' ? discussion : { id: discussion.id }
      }
    };

    const userConnections = this.clients.get(userId);
    if (userConnections) {
      for (const ws of userConnections) {
        this.sendMessage(ws, message);
      }
    }
  }

  // Heartbeat to detect disconnected clients
  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          ws.terminate();
          this.handleDisconnect(ws);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  public close() {
    clearInterval(this.pingInterval);
    this.wss.close();
  }
}