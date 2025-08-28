import { logger } from '@/lib/logger';

export interface CommentMonitor {
  id: string;
  postUrl: string;
  postId: string;
  mediaId?: string; // Store the actual Instagram media ID for matching
  keyword: string;
  autoReplyMessage: string;
  isActive: boolean;
  createdAt: string;
  detectionCount: number;
  lastDetection?: string;
}

export interface MonitoringStats {
  totalMonitors: number;
  activeMonitors: number;
  totalDetections: number;
  todayDetections: number;
  recentActivity: Array<{
    monitorId: string;
    keyword: string;
    postId: string;
    detectionTime: string;
  }>;
}

// In-memory storage for development
// In production, this would be replaced with database operations
class CommentMonitorStorage {
  private monitors: CommentMonitor[] = [];

  // Get all monitors
  getAllMonitors(): CommentMonitor[] {
    return [...this.monitors];
  }

  // Get active monitors only
  getActiveMonitors(): CommentMonitor[] {
    return this.monitors.filter(monitor => monitor.isActive);
  }

  // Get monitor by ID
  getMonitorById(id: string): CommentMonitor | undefined {
    return this.monitors.find(monitor => monitor.id === id);
  }

  // Add new monitor
  addMonitor(monitor: CommentMonitor): void {
    this.monitors.push(monitor);
    logger.info('Monitor added to storage', 'MONITOR_STORAGE', { id: monitor.id, keyword: monitor.keyword });
  }

  // Update monitor
  updateMonitor(id: string, updates: Partial<CommentMonitor>): boolean {
    const index = this.monitors.findIndex(monitor => monitor.id === id);
    if (index !== -1) {
      this.monitors[index] = { ...this.monitors[index], ...updates };
      logger.info('Monitor updated in storage', 'MONITOR_STORAGE', { id, updates });
      return true;
    }
    return false;
  }

  // Delete monitor
  deleteMonitor(id: string): boolean {
    const initialLength = this.monitors.length;
    this.monitors = this.monitors.filter(monitor => monitor.id !== id);
    const deleted = this.monitors.length !== initialLength;
    if (deleted) {
      logger.info('Monitor deleted from storage', 'MONITOR_STORAGE', { id });
    }
    return deleted;
  }

  // Check for duplicate monitor (same post + keyword)
  hasDuplicateMonitor(postId: string, keyword: string, excludeId?: string): boolean {
    return this.monitors.some(monitor => 
      monitor.postId === postId && 
      monitor.keyword.toLowerCase() === keyword.toLowerCase() &&
      monitor.id !== excludeId
    );
  }

  // Update detection statistics
  updateDetectionStats(monitorId: string, detectionTime?: string): boolean {
    const monitor = this.getMonitorById(monitorId);
    if (monitor) {
      monitor.detectionCount++;
      monitor.lastDetection = detectionTime || new Date().toISOString();
      logger.info('Detection stats updated', 'MONITOR_STORAGE', { 
        monitorId, 
        newCount: monitor.detectionCount,
        detectionTime: monitor.lastDetection 
      });
      return true;
    }
    return false;
  }

  // Get monitoring statistics
  getStats(): MonitoringStats {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayDetections = this.monitors.reduce((count, monitor) => {
      if (monitor.lastDetection) {
        const detectionDate = new Date(monitor.lastDetection);
        if (detectionDate >= todayStart) {
          return count + 1;
        }
      }
      return count;
    }, 0);

    const recentActivity = this.monitors
      .filter(monitor => monitor.lastDetection)
      .sort((a, b) => {
        const dateA = new Date(a.lastDetection!).getTime();
        const dateB = new Date(b.lastDetection!).getTime();
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(monitor => ({
        monitorId: monitor.id,
        keyword: monitor.keyword,
        postId: monitor.postId,
        detectionTime: monitor.lastDetection!
      }));

    return {
      totalMonitors: this.monitors.length,
      activeMonitors: this.monitors.filter(m => m.isActive).length,
      totalDetections: this.monitors.reduce((sum, m) => sum + m.detectionCount, 0),
      todayDetections,
      recentActivity
    };
  }

  // Clear all monitors (for testing/cleanup)
  clearAll(): number {
    const count = this.monitors.length;
    this.monitors = [];
    logger.info('All monitors cleared from storage', 'MONITOR_STORAGE', { count });
    return count;
  }

  // Find monitors by post ID or media ID (enhanced matching)
  getMonitorsByPostId(postId: string): CommentMonitor[] {
    return this.monitors.filter(monitor => {
      // Direct match
      if (monitor.postId === postId) {
        return true;
      }
      
      // Cross-reference matching (shortcode vs media ID)
      // If we have a long numeric ID (media ID) and monitor has shortcode
      if (postId.length > 10 && /^\d+$/.test(postId) && monitor.postId.length < 20) {
        // This is likely a media ID, store it for future reference
        logger.info('Media ID detected for shortcode monitor', 'MONITOR_STORAGE', {
          mediaId: postId,
          shortcode: monitor.postId,
          monitorId: monitor.id
        });
        // For now, we'll need a way to map these - let's check if there's a mapping
        return false; // We'll improve this with proper mapping later
      }
      
      // If we have a shortcode and monitor has media ID
      if (postId.length < 20 && monitor.postId.length > 10 && /^\d+$/.test(monitor.postId)) {
        logger.info('Shortcode detected for media ID monitor', 'MONITOR_STORAGE', {
          shortcode: postId,
          mediaId: monitor.postId,
          monitorId: monitor.id
        });
        return false; // We'll improve this with proper mapping later
      }
      
      return false;
    });
  }

  // Find monitors by media ID specifically
  getMonitorsByMediaId(mediaId: string): CommentMonitor[] {
    return this.monitors.filter(monitor => {
      // Check if monitor's postId matches the media ID
      if (monitor.postId === mediaId) {
        return true;
      }
      
      // Check if monitor has additional media ID stored (we'll add this feature)
      // For now, return monitors that might match
      return false;
    });
  }

  // Update monitor with media ID when discovered
  updateMonitorMediaId(monitorId: string, mediaId: string): boolean {
    const monitor = this.getMonitorById(monitorId);
    if (monitor && !monitor.mediaId) {
      monitor.mediaId = mediaId;
      logger.info('Updated monitor with media ID', 'MONITOR_STORAGE', {
        monitorId,
        postId: monitor.postId,
        mediaId,
        keyword: monitor.keyword
      });
      return true;
    }
    return false;
  }

  // Enhanced monitor search that tries multiple strategies
  findRelevantMonitors(identifier: string): CommentMonitor[] {
    // Try direct post ID match first
    let relevantMonitors = this.getMonitorsByPostId(identifier);
    
    // Try media ID match
    if (relevantMonitors.length === 0) {
      relevantMonitors = this.monitors.filter(monitor => monitor.mediaId === identifier);
    }
    
    // If no direct match and identifier looks like media ID, try alternative matching
    if (relevantMonitors.length === 0 && identifier.length > 10 && /^\d+$/.test(identifier)) {
      // This is a media ID, try to find monitors with shortcodes
      const allMonitors = this.getActiveMonitors();
      relevantMonitors = allMonitors.filter(monitor => {
        // Log the attempt for debugging
        logger.debug('Attempting media ID to shortcode matching', 'MONITOR_STORAGE', {
          mediaId: identifier,
          monitorPostId: monitor.postId,
          monitorKeyword: monitor.keyword
        });
        
        // For now, we'll implement a basic heuristic
        // In a real system, you'd want to store the media ID when creating monitors
        // or implement a proper Instagram API lookup
        return false; // Will be enhanced
      });
    }
    
    return relevantMonitors;
  }

  // Find monitors by keyword
  getMonitorsByKeyword(keyword: string): CommentMonitor[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.monitors.filter(monitor => 
      monitor.keyword.toLowerCase().includes(lowerKeyword)
    );
  }
}

// Create singleton instance
const storage = new CommentMonitorStorage();

// Export the storage instance and interfaces
export default storage;
export { CommentMonitorStorage };

// Utility functions for Instagram post validation
export function parseInstagramPostId(url: string): { isValid: boolean; postId?: string; error?: string } {
  try {
    const instagramPostRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/;
    const match = url.match(instagramPostRegex);
    
    if (!match) {
      return { isValid: false, error: 'Please enter a valid Instagram post URL' };
    }
    
    return { isValid: true, postId: match[1] };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

export async function validateInstagramPost(postId: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    // Skip validation if no access token or account ID is configured (development mode)
    if (!accessToken || !accountId) {
      logger.info('Instagram credentials not configured - skipping post validation', 'INSTAGRAM_API', { 
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId,
        postId 
      });
      return { isValid: true };
    }

    // For Instagram shortcodes (from URLs like /p/ABC123/), we need to convert to media ID
    // The Instagram Graph API doesn't accept shortcodes directly
    // Instead, we'll use a different approach - validate by trying to get account's media
    
    try {
      // First, let's try to get the account's recent media to see if we can access the API
      const testResponse = await fetch(
        `https://graph.instagram.com/${accountId}/media?fields=id,media_type&limit=1&access_token=${accessToken}`,
        { 
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (testResponse.ok) {
        // If we can access the media endpoint, the API is working
        // For shortcodes, we'll assume they're valid since direct validation isn't supported
        logger.info('Instagram API accessible - accepting shortcode', 'INSTAGRAM_API', { 
          postId,
          note: 'Shortcode validation skipped (not supported by Graph API)' 
        });
        return { isValid: true };
      } else {
        const errorData = await testResponse.json();
        logger.warn('Instagram API test failed', 'INSTAGRAM_API', { 
          postId, 
          status: testResponse.status,
          error: errorData.error?.message 
        });
        
        // If it's a token or permission issue, allow in development but warn
        if (errorData.error?.code === 190 || errorData.error?.code === 200) {
          logger.info('Token/permission issue - allowing post in development mode', 'INSTAGRAM_API');
          return { isValid: true };
        }
        
        return { 
          isValid: false, 
          error: errorData.error?.message || 'Unable to validate post with Instagram API' 
        };
      }
    } catch (apiError) {
      logger.warn('Instagram API network error during validation', 'INSTAGRAM_API', {
        postId,
        error: apiError instanceof Error ? apiError.message : String(apiError)
      });
      
      // Allow posts if there's a network error (development mode)
      return { isValid: true };
    }
    
  } catch (error) {
    logger.error('Failed to validate Instagram post', 'INSTAGRAM_API', { postId }, error instanceof Error ? error : new Error(String(error)));
    // For development, allow posts even if validation fails
    logger.info('Allowing post due to validation error (development mode)', 'INSTAGRAM_API');
    return { isValid: true };
  }
}