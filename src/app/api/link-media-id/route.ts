import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/comment-monitor-storage';
import { logger } from '@/lib/logger';

// Manual endpoint to link media IDs to existing monitors
export async function POST(request: NextRequest) {
  try {
    const { monitorId, mediaId, postId } = await request.json();
    
    if (!monitorId && !postId) {
      return NextResponse.json(
        { error: 'Either monitorId or postId is required' },
        { status: 400 }
      );
    }
    
    if (!mediaId) {
      return NextResponse.json(
        { error: 'mediaId is required' },
        { status: 400 }
      );
    }
    
    // Find monitor by ID or postId
    let monitor;
    if (monitorId) {
      monitor = storage.getMonitorById(monitorId);
    } else {
      const monitors = storage.getMonitorsByPostId(postId);
      monitor = monitors[0]; // Take the first match
    }
    
    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }
    
    // Update the monitor with the media ID
    const updated = storage.updateMonitorMediaId(monitor.id, mediaId);
    
    if (updated) {
      logger.info('Manually linked media ID to monitor', 'MEDIA_LINKING', {
        monitorId: monitor.id,
        postId: monitor.postId,
        mediaId,
        keyword: monitor.keyword
      });
      
      return NextResponse.json({
        success: true,
        message: 'Media ID linked successfully',
        monitor: {
          id: monitor.id,
          postId: monitor.postId,
          mediaId: monitor.mediaId,
          keyword: monitor.keyword
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update monitor' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    logger.error('Error linking media ID', 'MEDIA_LINKING', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get current monitor-media ID mappings
export async function GET() {
  try {
    const monitors = storage.getAllMonitors();
    const mappings = monitors.map(monitor => ({
      id: monitor.id,
      postId: monitor.postId,
      mediaId: monitor.mediaId,
      keyword: monitor.keyword,
      isActive: monitor.isActive,
      hasMediaId: !!monitor.mediaId
    }));
    
    return NextResponse.json({
      success: true,
      mappings,
      totalMonitors: monitors.length,
      monitorsWithMediaId: mappings.filter(m => m.hasMediaId).length
    });
    
  } catch (error) {
    logger.error('Error getting monitor mappings', 'MEDIA_LINKING', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}