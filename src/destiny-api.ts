import axios, { AxiosInstance } from 'axios';
import { BungieAuth } from './auth.js';
import { BungieConfig, DestinyProfile, DestinyCharacter, DestinyItem } from './types.js';
import { RateLimiter } from './rate-limiter.js';

export class DestinyAPI {
  private auth: BungieAuth;
  private client: AxiosInstance;
  private config: BungieConfig;
  private rateLimiter: RateLimiter;

  constructor(config: BungieConfig) {
    this.config = config;
    this.auth = new BungieAuth(config);
    this.rateLimiter = new RateLimiter(25, 10000);
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://www.bungie.net/Platform',
      headers: {
        'X-API-Key': config.apiKey
      }
    });
  }

  private async makeRequest(url: string, params?: any, requireAuth: boolean = false) {
    await this.rateLimiter.checkLimit();
    
    const headers: Record<string, string> = {};
    
    if (requireAuth) {
      const accessToken = this.auth.getAccessToken();
      
      if (!accessToken || this.auth.isTokenExpired()) {
        throw new Error('No valid access token available. Please authenticate first.');
      }
      
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await this.client.get(url, {
        params,
        headers
      });

      if (response.data.ErrorCode !== 1) {
        throw new Error(`Bungie API Error: ${response.data.Message}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401) {
          throw new Error('Authentication failed. Token may be expired or invalid.');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        } else if (status && status >= 500) {
          throw new Error('Bungie API server error. Please try again later.');
        }
      }
      throw error;
    }
  }

  private async makeAuthenticatedRequest(url: string, params?: any) {
    return this.makeRequest(url, params, true);
  }

  private async makePublicRequest(url: string, params?: any) {
    return this.makeRequest(url, params, false);
  }

  async getProfile(
    membershipType: number, 
    membershipId: string, 
    components: number[] = [100, 200]
  ): Promise<DestinyProfile> {
    const componentsString = components.join(',');
    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/`,
      { components: componentsString }
    );
  }

  async getCharacter(
    membershipType: number,
    membershipId: string,
    characterId: string,
    components: number[] = [200]
  ): Promise<any> {
    const componentsString = components.join(',');
    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/`,
      { components: componentsString }
    );
  }

  async getItem(
    membershipType: number,
    membershipId: string,
    itemInstanceId: string,
    components: number[] = [300]
  ): Promise<any> {
    const componentsString = components.join(',');
    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/Item/${itemInstanceId}/`,
      { components: componentsString }
    );
  }

  async searchDestinyPlayer(membershipType: number, displayName: string): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/SearchDestinyPlayer/${membershipType}/${encodeURIComponent(displayName)}/`
    );
  }

  async getLinkedProfiles(membershipType: number, membershipId: string): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Profile/${membershipId}/LinkedProfiles/`
    );
  }

  async getActivityHistory(
    membershipType: number,
    membershipId: string,
    characterId: string,
    count: number = 25,
    mode?: number,
    page?: number
  ): Promise<any> {
    const params: any = { count };
    if (mode !== undefined) params.mode = mode;
    if (page !== undefined) params.page = page;

    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/`,
      params
    );
  }

  async getManifest(): Promise<any> {
    return this.makePublicRequest('/Destiny2/Manifest/');
  }

  async getDestinyEntityDefinition(
    entityType: string,
    hashIdentifier: number
  ): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/Manifest/${entityType}/${hashIdentifier}/`
    );
  }

  async getPublicMilestones(): Promise<any> {
    return this.makePublicRequest('/Destiny2/Milestones/');
  }

  async getPublicMilestoneContent(milestoneHash: number): Promise<any> {
    return this.makePublicRequest(`/Destiny2/Milestones/${milestoneHash}/Content/`);
  }

  async getPublicVendors(components: number[] = [400, 401, 402]): Promise<any> {
    const componentsString = components.join(',');
    return this.makePublicRequest('/Destiny2/Vendors/', { components: componentsString });
  }

  async getHistoricalStats(
    membershipType: number,
    membershipId: string,
    characterId: string,
    periodType?: number,
    modes?: number[],
    groups?: number[]
  ): Promise<any> {
    const params: any = {};
    if (periodType !== undefined) params.periodType = periodType;
    if (modes?.length) params.modes = modes.join(',');
    if (groups?.length) params.groups = groups.join(',');

    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/`,
      params
    );
  }

  async getLeaderboards(
    membershipType: number,
    membershipId: string,
    maxtop?: number,
    modes?: string,
    statid?: string
  ): Promise<any> {
    const params: any = {};
    if (maxtop !== undefined) params.maxtop = maxtop;
    if (modes) params.modes = modes;
    if (statid) params.statid = statid;

    return this.makePublicRequest(
      `/Destiny2/Stats/Leaderboards/${membershipType}/${membershipId}/`,
      params
    );
  }

  async searchDestinyPlayerByBungieName(
    membershipType: number,
    displayName: string,
    displayNameCode: number
  ): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/SearchDestinyPlayerByBungieName/${membershipType}/`,
      {
        displayName,
        displayNameCode
      }
    );
  }

  async getClanWeeklyRewardState(groupId: string): Promise<any> {
    return this.makePublicRequest(`/Destiny2/Clan/${groupId}/WeeklyRewardState/`);
  }

  async getClanBannerSource(): Promise<any> {
    return this.makePublicRequest('/Destiny2/Clan/ClanBannerDictionary/');
  }

  async getDestinyAggregateActivityStats(
    membershipType: number,
    membershipId: string,
    characterId: string
  ): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/AggregateActivityStats/`
    );
  }

  async getUniqueWeaponHistory(
    membershipType: number,
    membershipId: string,
    characterId: string
  ): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/UniqueWeapons/`
    );
  }

  async getPostGameCarnageReport(activityId: string): Promise<any> {
    return this.makePublicRequest(
      `/Destiny2/Stats/PostGameCarnageReport/${activityId}/`
    );
  }

  getAuth(): BungieAuth {
    return this.auth;
  }
}