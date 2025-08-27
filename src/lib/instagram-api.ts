// Instagram Graph API Service
// Handles all interactions with Instagram Graph API

import { logger } from './logger';

export interface InstagramMessage {
  text: string;
}

export interface InstagramSendMessagePayload {
  recipient: {
    id: string;
  };
  message: InstagramMessage;
}

export interface InstagramAPIResponse {
  message_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export class InstagramAPI {
  private readonly accessToken: string;
  private readonly accountId: string;
  private readonly baseUrl: string = 'https://graph.instagram.com/v19.0';

  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    this.accountId = process.env.INSTAGRAM_ACCOUNT_ID || '';
    
    if (!this.accessToken || !this.accountId) {
      const error = new Error('Instagram API credentials not configured. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in your environment variables.');
      logger.error('Instagram API initialization failed', 'INSTAGRAM_API_INIT', {
        hasAccessToken: !!this.accessToken,
        hasAccountId: !!this.accountId,
        accountIdValue: this.accountId
      }, error);
      throw error;
    }
    
    // Check if accountId looks like a username instead of numeric ID
    if (this.accountId && isNaN(Number(this.accountId))) {
      logger.warn('Instagram Account ID appears to be a username, not a numeric ID', 'INSTAGRAM_API_INIT', {
        accountId: this.accountId,
        suggestion: 'Use the numeric Instagram Business Account ID, not the username'
      });
    }
    
    logger.info('Instagram API initialized successfully', 'INSTAGRAM_API_INIT', {
      accountId: this.accountId.substring(0, 8) + '...'
    });
  }

  private async getValidAccessToken(): Promise<string> {
    // First try the configured token
    try {
      const testUrl = `${this.baseUrl}/${this.accountId}?fields=id&access_token=${this.accessToken}`;
      const testResponse = await fetch(testUrl);
      const testResult = await testResponse.json();
      
      if (!testResult.error) {
        return this.accessToken;
      }
      
      // If user token fails, get page token
      if (testResult.error && testResult.error.code === 190) {
        logger.info('Getting page access token for Instagram API', 'INSTAGRAM_API');
        
        const pageResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${this.accessToken}`);
        const pageData = await pageResponse.json();
        
        if (pageData.data && pageData.data.length > 0) {
          return pageData.data[0].access_token;
        }
      }
    } catch (error) {
      logger.warn('Error getting valid access token', 'INSTAGRAM_API', {}, error as Error);
    }
    
    return this.accessToken; // fallback
  }

  /**
   * Send a message to a specific recipient
   */
  async sendMessage(recipientId: string, messageText: string): Promise<InstagramAPIResponse> {
    const url = `${this.baseUrl}/${this.accountId}/messages`;
    
    const payload: InstagramSendMessagePayload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    };

    try {
      logger.debug('Sending Instagram message', 'INSTAGRAM_API', {
        recipientId,
        messageLength: messageText.length,
        url
      });
      
      const validToken = await this.getValidAccessToken();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        logger.info('Instagram message sent successfully', 'INSTAGRAM_API', {
          recipientId,
          messageId: result.message_id
        });
        return result;
      } else {
        logger.error('Instagram API error - send message', 'INSTAGRAM_API', {
          recipientId,
          status: response.status,
          error: result
        });
        return { error: result.error || { message: 'Unknown error', type: 'api_error', code: response.status } };
      }
    } catch (error) {
      logger.error('Network error sending Instagram message', 'INSTAGRAM_API', {
        recipientId,
        url
      }, error as Error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Network error', 
          type: 'network_error', 
          code: 0 
        } 
      };
    }
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    // First try with the current token
    let url = `${this.baseUrl}/${this.accountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${this.accessToken}`;
    
    try {
      logger.debug('Fetching Instagram account info', 'INSTAGRAM_API', { accountId: this.accountId });
      
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let result = await response.json();

      // If we get an OAuth error, try to get the correct page token
      if (result.error && result.error.code === 190) {
        logger.warn('User token failed, trying to get page access token', 'INSTAGRAM_API');
        
        // Try to get page access token
        const pageTokenResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${this.accessToken}`);
        const pageTokenData = await pageTokenResponse.json();
        
        if (pageTokenData.data && pageTokenData.data.length > 0) {
          const pageToken = pageTokenData.data[0].access_token;
          logger.info('Found page access token, retrying with page token', 'INSTAGRAM_API');
          
          // Retry with page token
          url = `${this.baseUrl}/${this.accountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${pageToken}`;
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          result = await response.json();
        }
      }

      if (response.ok && !result.error) {
        logger.info('Instagram account info retrieved successfully', 'INSTAGRAM_API', {
          username: result.username,
          name: result.name
        });
        return result;
      } else {
        logger.error('Failed to get Instagram account info', 'INSTAGRAM_API', {
          status: response.status,
          error: result
        });
        return { error: result.error || { message: 'Unknown error', type: 'api_error', code: response.status } };
      }
    } catch (error) {
      logger.error('Network error getting Instagram account info', 'INSTAGRAM_API', {}, error as Error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Network error', 
          type: 'network_error', 
          code: 0 
        } 
      };
    }
  }

  /**
   * Validate the access token
   */
  async validateToken(): Promise<boolean> {
    try {
      logger.debug('Validating Instagram access token', 'INSTAGRAM_API');
      const accountInfo = await this.getAccountInfo();
      const isValid = !accountInfo.error;
      
      if (isValid) {
        logger.info('Instagram access token is valid', 'INSTAGRAM_API');
      } else {
        logger.warn('Instagram access token is invalid', 'INSTAGRAM_API', accountInfo.error);
      }
      
      return isValid;
    } catch (error) {
      logger.error('Instagram token validation failed', 'INSTAGRAM_API', {}, error as Error);
      return false;
    }
  }

  /**
   * Get conversations (if available)
   */
  async getConversations(): Promise<any> {
    const url = `${this.baseUrl}/${this.accountId}/conversations?platform=instagram&access_token=${this.accessToken}`;
    
    try {
      logger.debug('Fetching Instagram conversations', 'INSTAGRAM_API');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        logger.info('Instagram conversations retrieved successfully', 'INSTAGRAM_API');
        return result;
      } else {
        logger.error('Failed to get Instagram conversations', 'INSTAGRAM_API', {
          status: response.status,
          error: result
        });
        return { error: result.error || { message: 'Unknown error', type: 'api_error', code: response.status } };
      }
    } catch (error) {
      logger.error('Network error getting Instagram conversations', 'INSTAGRAM_API', {}, error as Error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Network error', 
          type: 'network_error', 
          code: 0 
        } 
      };
    }
  }
}

// Create a singleton instance
export const instagramAPI = new InstagramAPI();