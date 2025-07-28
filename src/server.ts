import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DestinyAPI } from './destiny-api.js';
import { BungieConfig } from './types.js';
import { WebSocketServerTransport } from './websocket-transport.js';
import * as dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

dotenv.config();

export function createMCPServer() {
  const server = new Server(
    {
      name: 'bungie-destiny-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const config: BungieConfig = {
    apiKey: process.env.BUNGIE_API_KEY || '',
    baseUrl: 'https://www.bungie.net/Platform'
  };

  const destinyAPI = new DestinyAPI(config);

  const tools: Tool[] = [
    {
      name: 'get_destiny_profile',
      description: 'Get Destiny 2 profile information for a player',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: {
            type: 'number',
            description: 'Platform membership type (1=Xbox, 2=PSN, 3=Steam, 4=Blizzard, 5=Stadia, 6=Epic, 254=BungieNext)'
          },
          membershipId: {
            type: 'string',
            description: 'Platform-specific membership ID'
          },
          components: {
            type: 'array',
            items: { type: 'number' },
            description: 'Component types to include (100=Profiles, 200=Characters, 201=CharacterInventories, etc.)',
            default: [100, 200]
          }
        },
        required: ['membershipType', 'membershipId']
      }
    },
    {
      name: 'get_destiny_character',
      description: 'Get detailed information about a specific Destiny 2 character',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          characterId: { type: 'string', description: 'Character ID' },
          components: {
            type: 'array',
            items: { type: 'number' },
            description: 'Component types to include',
            default: [200]
          }
        },
        required: ['membershipType', 'membershipId', 'characterId']
      }
    },
    {
      name: 'get_destiny_item',
      description: 'Get detailed information about a specific Destiny 2 item',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          itemInstanceId: { type: 'string', description: 'Item instance ID' },
          components: {
            type: 'array',
            items: { type: 'number' },
            description: 'Component types to include',
            default: [300]
          }
        },
        required: ['membershipType', 'membershipId', 'itemInstanceId']
      }
    },
    {
      name: 'search_destiny_player',
      description: 'Search for a Destiny 2 player by display name',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type to search on' },
          displayName: { type: 'string', description: 'Player display name to search for' }
        },
        required: ['membershipType', 'displayName']
      }
    },
    {
      name: 'get_activity_history',
      description: 'Get activity history for a Destiny 2 character',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          characterId: { type: 'string', description: 'Character ID' },
          count: { type: 'number', description: 'Number of activities to return', default: 25 },
          mode: { type: 'number', description: 'Activity mode filter (optional)' },
          page: { type: 'number', description: 'Page number for pagination (optional)' }
        },
        required: ['membershipType', 'membershipId', 'characterId']
      }
    },
    {
      name: 'get_destiny_manifest',
      description: 'Get the Destiny 2 manifest containing game definitions and metadata',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_linked_profiles',
      description: 'Get linked profiles for a Destiny 2 player across platforms',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' }
        },
        required: ['membershipType', 'membershipId']
      }
    },
    {
      name: 'get_destiny_entity_definition',
      description: 'Get definition data for a specific Destiny 2 entity (weapons, armor, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          entityType: { type: 'string', description: 'Entity type (DestinyInventoryItemDefinition, DestinyActivityDefinition, etc.)' },
          hashIdentifier: { type: 'number', description: 'Hash identifier for the entity' }
        },
        required: ['entityType', 'hashIdentifier']
      }
    },
    {
      name: 'get_public_milestones',
      description: 'Get current public milestones available to all players',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_public_milestone_content',
      description: 'Get detailed content for a specific milestone',
      inputSchema: {
        type: 'object',
        properties: {
          milestoneHash: { type: 'number', description: 'Milestone hash identifier' }
        },
        required: ['milestoneHash']
      }
    },
    {
      name: 'get_public_vendors',
      description: 'Get public vendor information and their current inventories',
      inputSchema: {
        type: 'object',
        properties: {
          components: {
            type: 'array',
            items: { type: 'number' },
            description: 'Vendor component types (400=Vendors, 401=VendorCategories, 402=VendorSales)',
            default: [400, 401, 402]
          }
        },
        required: []
      }
    },
    {
      name: 'get_historical_stats',
      description: 'Get historical game statistics for a character',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          characterId: { type: 'string', description: 'Character ID' },
          periodType: { type: 'number', description: 'Period type (0=None, 1=Daily, 2=Weekly, 3=Monthly)' },
          modes: { type: 'array', items: { type: 'number' }, description: 'Game mode filters' },
          groups: { type: 'array', items: { type: 'number' }, description: 'Stat group filters' }
        },
        required: ['membershipType', 'membershipId', 'characterId']
      }
    },
    {
      name: 'get_leaderboards',
      description: 'Get leaderboard data for a player',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          maxtop: { type: 'number', description: 'Maximum number of top entries to return' },
          modes: { type: 'string', description: 'Game modes to include' },
          statid: { type: 'string', description: 'Stat ID to query' }
        },
        required: ['membershipType', 'membershipId']
      }
    },
    {
      name: 'search_destiny_player_by_bungie_name',
      description: 'Search for a Destiny player using their Bungie Name and discriminator',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          displayName: { type: 'string', description: 'Bungie display name' },
          displayNameCode: { type: 'number', description: 'Bungie name code (discriminator)' }
        },
        required: ['membershipType', 'displayName', 'displayNameCode']
      }
    },
    {
      name: 'get_clan_weekly_reward_state',
      description: 'Get weekly reward state for a clan',
      inputSchema: {
        type: 'object',
        properties: {
          groupId: { type: 'string', description: 'Clan group ID' }
        },
        required: ['groupId']
      }
    },
    {
      name: 'get_clan_banner_source',
      description: 'Get the dictionary of available clan banner options',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_aggregate_activity_stats',
      description: 'Get aggregate activity statistics for a character',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          characterId: { type: 'string', description: 'Character ID' }
        },
        required: ['membershipType', 'membershipId', 'characterId']
      }
    },
    {
      name: 'get_unique_weapon_history',
      description: 'Get unique weapon usage history for a character',
      inputSchema: {
        type: 'object',
        properties: {
          membershipType: { type: 'number', description: 'Platform membership type' },
          membershipId: { type: 'string', description: 'Platform-specific membership ID' },
          characterId: { type: 'string', description: 'Character ID' }
        },
        required: ['membershipType', 'membershipId', 'characterId']
      }
    },
    {
      name: 'get_post_game_carnage_report',
      description: 'Get detailed Post-Game Carnage Report (PGCR) for a specific activity instance, including all participants, their stats, loadouts, and performance data',
      inputSchema: {
        type: 'object',
        properties: {
          activityId: { 
            type: 'string', 
            description: 'The unique activity instance ID (obtained from activity history instanceId field)'
          }
        },
        required: ['activityId']
      }
    }
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new Error('Missing arguments for tool call');
    }

    try {
      switch (name) {
        case 'get_destiny_profile':
          const profileResult = await destinyAPI.getProfile(
            args.membershipType as number,
            args.membershipId as string,
            (args.components as number[]) || [100, 200]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(profileResult, null, 2)
              }
            ]
          };

        case 'get_destiny_character':
          const characterResult = await destinyAPI.getCharacter(
            args.membershipType as number,
            args.membershipId as string,
            args.characterId as string,
            (args.components as number[]) || [200]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(characterResult, null, 2)
              }
            ]
          };

        case 'get_destiny_item':
          const itemResult = await destinyAPI.getItem(
            args.membershipType as number,
            args.membershipId as string,
            args.itemInstanceId as string,
            (args.components as number[]) || [300]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(itemResult, null, 2)
              }
            ]
          };

        case 'search_destiny_player':
          const searchResult = await destinyAPI.searchDestinyPlayer(
            args.membershipType as number,
            args.displayName as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(searchResult, null, 2)
              }
            ]
          };

        case 'get_activity_history':
          const historyResult = await destinyAPI.getActivityHistory(
            args.membershipType as number,
            args.membershipId as string,
            args.characterId as string,
            args.count as number,
            args.mode as number,
            args.page as number
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(historyResult, null, 2)
              }
            ]
          };

        case 'get_destiny_manifest':
          const manifestResult = await destinyAPI.getManifest();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(manifestResult, null, 2)
              }
            ]
          };

        case 'get_linked_profiles':
          const linkedResult = await destinyAPI.getLinkedProfiles(
            args.membershipType as number,
            args.membershipId as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(linkedResult, null, 2)
              }
            ]
          };

        case 'get_destiny_entity_definition':
          const entityResult = await destinyAPI.getDestinyEntityDefinition(
            args.entityType as string,
            args.hashIdentifier as number
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(entityResult, null, 2)
              }
            ]
          };

        case 'get_public_milestones':
          const milestonesResult = await destinyAPI.getPublicMilestones();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(milestonesResult, null, 2)
              }
            ]
          };

        case 'get_public_milestone_content':
          const milestoneContentResult = await destinyAPI.getPublicMilestoneContent(
            args.milestoneHash as number
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(milestoneContentResult, null, 2)
              }
            ]
          };

        case 'get_public_vendors':
          const vendorsResult = await destinyAPI.getPublicVendors(
            (args.components as number[]) || [400, 401, 402]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(vendorsResult, null, 2)
              }
            ]
          };

        case 'get_historical_stats':
          const historicalStatsResult = await destinyAPI.getHistoricalStats(
            args.membershipType as number,
            args.membershipId as string,
            args.characterId as string,
            args.periodType as number,
            args.modes as number[],
            args.groups as number[]
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(historicalStatsResult, null, 2)
              }
            ]
          };

        case 'get_leaderboards':
          const leaderboardsResult = await destinyAPI.getLeaderboards(
            args.membershipType as number,
            args.membershipId as string,
            args.maxtop as number,
            args.modes as string,
            args.statid as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(leaderboardsResult, null, 2)
              }
            ]
          };

        case 'search_destiny_player_by_bungie_name':
          const bungieNameSearchResult = await destinyAPI.searchDestinyPlayerByBungieName(
            args.membershipType as number,
            args.displayName as string,
            args.displayNameCode as number
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(bungieNameSearchResult, null, 2)
              }
            ]
          };

        case 'get_clan_weekly_reward_state':
          const clanRewardResult = await destinyAPI.getClanWeeklyRewardState(
            args.groupId as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(clanRewardResult, null, 2)
              }
            ]
          };

        case 'get_clan_banner_source':
          const clanBannerResult = await destinyAPI.getClanBannerSource();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(clanBannerResult, null, 2)
              }
            ]
          };

        case 'get_aggregate_activity_stats':
          const aggregateStatsResult = await destinyAPI.getDestinyAggregateActivityStats(
            args.membershipType as number,
            args.membershipId as string,
            args.characterId as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(aggregateStatsResult, null, 2)
              }
            ]
          };

        case 'get_unique_weapon_history':
          const weaponHistoryResult = await destinyAPI.getUniqueWeaponHistory(
            args.membershipType as number,
            args.membershipId as string,
            args.characterId as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(weaponHistoryResult, null, 2)
              }
            ]
          };

        case 'get_post_game_carnage_report':
          const pgcrResult = await destinyAPI.getPostGameCarnageReport(
            args.activityId as string
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pgcrResult, null, 2)
              }
            ]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  });

  return server;
}

export async function runStdioServer() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bungie Destiny MCP Server running on stdio');
}

export async function runWebSocketServer(port: number = 3000) {
  const server = createMCPServer();
  
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    console.error('New WebSocket connection established');
    
    const transport = new WebSocketServerTransport(ws);
    server.connect(transport).catch((error) => {
      console.error('Server connection error:', error);
    });

    ws.on('close', () => {
      console.error('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  httpServer.listen(port, () => {
    console.error(`Bungie Destiny MCP Server running on WebSocket port ${port}`);
    console.error('Connect using: ws://localhost:' + port);
  });

  return { server, httpServer, wss };
}