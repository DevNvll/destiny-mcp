import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class WebSocketServerTransport extends EventEmitter implements Transport {
  private ws: WebSocket;
  private closed = false;

  constructor(ws: WebSocket) {
    super();
    this.ws = ws;
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as JSONRPCMessage;
        this.emit('message', message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    this.ws.on('close', () => {
      this.closed = true;
      this.emit('close');
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async start(): Promise<void> {
    // WebSocket is already connected when passed to constructor
    return Promise.resolve();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.closed || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection is closed');
    }

    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify(message), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true;
      this.ws.close();
    }
  }
}