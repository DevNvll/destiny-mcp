import axios from 'axios';
import { BungieConfig, OAuthTokens } from './types.js';

export class BungieAuth {
  private config: BungieConfig;
  private tokens: OAuthTokens | null = null;

  constructor(config: BungieConfig) {
    this.config = config;
  }

  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      state: state || 'random_state_string'
    });
    
    return `https://www.bungie.net/en/OAuth/Authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(authCode: string): Promise<OAuthTokens> {
    try {
      const response = await axios.post(
        'https://www.bungie.net/Platform/App/OAuth/token/',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-API-Key': this.config.apiKey
          }
        }
      );

      this.tokens = response.data;
      return this.tokens!;
    } catch (error) {
      throw new Error(`OAuth token exchange failed: ${error}`);
    }
  }

  async refreshToken(): Promise<OAuthTokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        'https://www.bungie.net/Platform/App/OAuth/token/',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-API-Key': this.config.apiKey
          }
        }
      );

      this.tokens = response.data;
      return this.tokens!;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  getAccessToken(): string | null {
    return this.tokens?.access_token || null;
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true;
    
    const now = Date.now() / 1000;
    const tokenExpiry = this.tokens.expires_in;
    
    return now >= tokenExpiry;
  }

  setTokens(tokens: OAuthTokens): void {
    this.tokens = tokens;
  }
}