# Bungie Destiny MCP Server

A Model Context Protocol (MCP) server that provides AI access to the Bungie.net Destiny 2 API. This server enables AI assistants to retrieve Destiny 2 game data including player profiles, character information, item details, and activity history.

## Features

- **OAuth Authentication** - Secure authentication flow with Bungie.net
- **Comprehensive API Coverage** - Access to key Destiny 2 endpoints
- **Rate Limiting** - Built-in rate limiting to respect API limits
- **Error Handling** - Robust error handling for API responses
- **MCP Protocol** - Full compliance with Model Context Protocol

## Available Tools

### Core Player Data
- `get_destiny_profile` - Get player profile information
- `get_destiny_character` - Get detailed character information
- `get_destiny_item` - Get item details and stats
- `search_destiny_player` - Search for players by display name
- `search_destiny_player_by_bungie_name` - Search using Bungie Name + discriminator
- `get_linked_profiles` - Get linked profiles across platforms

### Activity & Statistics
- `get_activity_history` - Get character activity history
- `get_post_game_carnage_report` - **Get detailed PGCR with all participants and their stats**
- `get_historical_stats` - Historical game statistics
- `get_aggregate_activity_stats` - Aggregate activity statistics
- `get_unique_weapon_history` - Unique weapon usage history
- `get_leaderboards` - Player leaderboard data

### Game Data & Definitions
- `get_destiny_manifest` - Get game manifest and definitions
- `get_destiny_entity_definition` - Get specific entity definitions (weapons, armor, etc.)
- `get_public_milestones` - Current weekly/daily milestones
- `get_public_milestone_content` - Detailed milestone content
- `get_public_vendors` - Public vendor inventories (Xur, etc.)

### Clan Information
- `get_clan_weekly_reward_state` - Clan weekly reward status
- `get_clan_banner_source` - Available clan banner options

**Note:** This server uses public API endpoints that only require an API key - no user authentication needed!

## Setup

1. **Register Application**
   - Go to https://www.bungie.net/en/Application
   - Create a new application (OAuth settings not required for public API)
   - Note your API Key

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API key (only BUNGIE_API_KEY is required)
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build**
   ```bash
   npm run build
   ```

## Running the Server

The server supports two modes:

### Stdio Mode (Default)
For use with Claude Desktop and other MCP clients that communicate via stdin/stdout:
```bash
npm start
# or explicitly:
npm run start:stdio
```

### WebSocket Mode (Remote Server)
For remote connections over WebSocket:
```bash
npm run start:websocket
# or with custom port:
npm run start:websocket -- --port 3001
```

The WebSocket server will be available at `ws://localhost:3000` (or your specified port).

## MCP Client Configuration

### Claude Desktop (Stdio Mode)
Add to your Claude Desktop configuration:
```json
{
  "mcpServers": {
    "bungie-destiny": {
      "command": "node",
      "args": ["/path/to/bungie-mcp/dist/index.js", "stdio"],
      "env": {
        "BUNGIE_API_KEY": "your_api_key"
      }
    }
  }
}
```

### Remote WebSocket Connection
For remote MCP clients, connect to:
```
ws://localhost:3000
```

The server will handle multiple concurrent WebSocket connections.

## Development

Run in development mode with auto-reload:
```bash
npm run dev           # stdio mode
npm run dev:websocket # websocket mode
```

## Usage

The server provides access to public Destiny 2 data without requiring user authentication. Simply provide player membership information to retrieve:

- Player profiles and statistics
- Character details and equipment
- Activity history and achievements
- **Detailed activity reports with all participants** (Post-Game Carnage Reports)
- Item information and perks
- Cross-platform linked accounts
- Real-time game data (milestones, vendors)

## Getting Activity Participants

To get detailed information about other players in activities:

1. Use `get_activity_history` to get recent activities for a player
2. Extract the `instanceId` from activity entries
3. Use `get_post_game_carnage_report` with the `instanceId` to get:
   - All participants' gamertags/display names
   - Individual player performance stats
   - Loadouts and weapon usage
   - Team assignments and scores
   - Detailed match statistics

**Note:** Player visibility depends on their privacy settings in Destiny 2.

## Component Types

Common component types for API calls:
- `100` - Profiles
- `200` - Characters
- `201` - Character Inventories
- `300` - Item Instances
- `301` - Item Objectives
- `302` - Item Perks

## Platform Types

- `1` - Xbox
- `2` - PlayStation
- `3` - Steam
- `4` - Blizzard
- `5` - Stadia
- `6` - Epic Games
- `254` - BungieNext

## Rate Limits

The server implements rate limiting (25 requests per 10 seconds) to comply with Bungie.net API limits.

## Error Handling

The server provides detailed error messages for:
- Authentication failures
- Rate limit exceeded
- API server errors
- Invalid parameters

## License

MIT