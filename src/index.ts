#!/usr/bin/env node

import { Command } from 'commander';
import { runStdioServer, runWebSocketServer } from './server.js';

const program = new Command();

program
  .name('bungie-destiny-mcp-server')
  .description('Bungie Destiny MCP Server - provides AI access to Destiny 2 API')
  .version('1.0.0');

program
  .command('stdio')
  .description('Run server in stdio mode (default)')
  .action(async () => {
    try {
      await runStdioServer();
    } catch (error) {
      console.error('Server error:', error);
      process.exit(1);
    }
  });

program
  .command('websocket')
  .description('Run server as WebSocket server for remote connections')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action(async (options) => {
    try {
      const port = parseInt(options.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error('Invalid port number. Must be between 1 and 65535.');
        process.exit(1);
      }
      await runWebSocketServer(port);
    } catch (error) {
      console.error('Server error:', error);
      process.exit(1);
    }
  });

// Default to stdio if no command specified
if (process.argv.length === 2) {
  runStdioServer().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
} else {
  program.parse();
}