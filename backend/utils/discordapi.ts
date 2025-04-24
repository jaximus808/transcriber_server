// DiscordAPI.ts
export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  }
  
  export interface DiscordGuild {
    id: string;
    name: string;
    icon?: string;
  }
  
  export class DiscordAPI {
    private baseUrl = 'https://discord.com/api';
    private accessToken: string;
  
    constructor(accessToken: string) {
      this.accessToken = accessToken;
    }
  
    private async request<T>(endpoint: string, method = 'GET'): Promise<T> {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Discord API error: ${res.status} ${res.statusText} - ${text}`);
      }
  
      return res.json() as Promise<T>;
    }
  
    // Get current user info
    async getUser(): Promise<DiscordUser> {
      return this.request<DiscordUser>('/users/@me');
    }
  
    // Get guilds the user is in
    async getUserGuilds(): Promise<DiscordGuild[]> {
      return this.request<DiscordGuild[]>('/users/@me/guilds');
    }
  
    // Optional: get a user's voice state (requires bot token instead)
    // This is here just for completeness — not accessible via user token
    async getUserVoiceState(guildId: string, userId: string): Promise<any> {
      return this.request<any>(`/guilds/${guildId}/voice-states/${userId}`);
    }
  }
  