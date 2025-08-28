import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import storage, { CommentMonitor, parseInstagramPostId, validateInstagramPost } from '@/lib/comment-monitor-storage';

// GET - List all monitors
export async function GET() {
  try {
    const monitors = storage.getAllMonitors();
    logger.info(`Fetching ${monitors.length} comment monitors`);
    
    return NextResponse.json({
      success: true,
      monitors,
      total: monitors.length
    });
  } catch (error) {
    logger.error('Failed to fetch monitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitors' },
      { status: 500 }
    );
  }
}

// POST - Create new monitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postUrl, keyword, autoReplyMessage } = body;

    // Validate required fields
    if (!postUrl || !keyword) {
      return NextResponse.json(
        { error: 'Post URL and keyword are required' },
        { status: 400 }
      );
    }

    // Parse and validate post URL
    const urlValidation = parseInstagramPostId(postUrl.trim());
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    const postId = urlValidation.postId!;
    const cleanKeyword = keyword.trim();

    // Check for duplicate monitor (same post + keyword)
    if (storage.hasDuplicateMonitor(postId, cleanKeyword)) {
      return NextResponse.json(
        { error: 'A monitor with this post and keyword already exists' },
        { status: 409 }
      );
    }

    // Validate post with Instagram API
    const postValidation = await validateInstagramPost(postId);
    if (!postValidation.isValid) {
      return NextResponse.json(
        { error: postValidation.error },
        { status: 400 }
      );
    }

    // Create new monitor
    const newMonitor: CommentMonitor = {
      id: `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postUrl: postUrl.trim(),
      postId,
      keyword: cleanKeyword,
      autoReplyMessage: autoReplyMessage?.trim() || `Hi! You commented "${cleanKeyword}" on my post. Thanks for engaging with my content!`,
      isActive: true,
      createdAt: new Date().toISOString(),
      detectionCount: 0,
    };

    storage.addMonitor(newMonitor);

    logger.info('Created new comment monitor:', {
      id: newMonitor.id,
      postId: newMonitor.postId,
      keyword: newMonitor.keyword
    });

    return NextResponse.json({
      success: true,
      monitor: newMonitor
    }, { status: 201 });

  } catch (error) {
    logger.error('Failed to create monitor:', error);
    return NextResponse.json(
      { error: 'Failed to create monitor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete all monitors (for cleanup)
export async function DELETE() {
  try {
    const deletedCount = storage.clearAll();
    
    logger.info(`Deleted all ${deletedCount} monitors`);
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} monitors`
    });
  } catch (error) {
    logger.error('Failed to delete all monitors:', error);
    return NextResponse.json(
      { error: 'Failed to delete monitors' },
      { status: 500 }
    );
  }
}

// Export functions for other modules
export function getActiveMonitors(): CommentMonitor[] {
  return storage.getActiveMonitors();
}

export function updateMonitorStats(monitorId: string, detectionTime?: string): boolean {
  return storage.updateDetectionStats(monitorId, detectionTime);
}