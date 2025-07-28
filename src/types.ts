export interface BungieConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  membership_id: string;
}

export interface DestinyProfile {
  Response: {
    profile: {
      data: {
        userInfo: {
          membershipType: number;
          membershipId: string;
          displayName: string;
        };
        dateLastPlayed: string;
        versionsOwned: number;
        characterIds: string[];
      };
    };
    characters: {
      data: Record<string, any>;
    };
  };
}

export interface DestinyCharacter {
  membershipType: number;
  membershipId: string;
  characterId: string;
  dateLastPlayed: string;
  minutesPlayedThisSession: string;
  minutesPlayedTotal: string;
  light: number;
  stats: Record<string, number>;
  raceType: number;
  genderType: number;
  classType: number;
  emblemPath: string;
  emblemBackgroundPath: string;
}

export interface DestinyItem {
  itemHash: number;
  itemInstanceId: string;
  quantity: number;
  bindStatus: number;
  location: number;
  bucketHash: number;
  transferStatus: number;
  lockable: boolean;
  state: number;
}