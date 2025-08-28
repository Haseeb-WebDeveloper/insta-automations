import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { databaseService } from '@/lib/database/services/database.service';
import { parseInstagramPostId, validateInstagramPost } from '@/lib/comment-monitor-storage';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// GET - List all monitors
export async function GET() {
  try {
    const monitors = await databaseService.getCommentMonitorRepository().findAll();
    logger.info(`Fetching ${monitors.length} comment monitors`, 'API');
    
    return NextResponse.json({
      success: true,
      monitors,
      total: monitors.length
    });
  } catch (error) {
    logger.error('Failed to fetch monitors', 'API', {}, error instanceof Error ? error : new Error(String(error)));
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
    const hasDuplicate = await databaseService.getCommentMonitorRepository().checkDuplicate(postId, cleanKeyword);
    if (hasDuplicate) {
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

    // Create new monitor in database
    const newMonitor = await databaseService.getCommentMonitorRepository().create({
      postUrl: postUrl.trim(),
      postId,
      keyword: cleanKeyword,
      autoReplyMessage: autoReplyMessage?.trim() || `Hi! You commented "${cleanKeyword}" on my post. Thanks for engaging with my content!`,
      isActive: true,
    });

    logger.info('Monitor created successfully', 'API', {
      id: newMonitor.id,
      postId: newMonitor.postId,
      keyword: newMonitor.keyword,
    });

    return NextResponse.json({
      success: true,
      monitor: newMonitor
    }, { status: 201 });

  } catch (error) {
    // Handle Prisma unique constraint errors
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A monitor with this post and keyword already exists' },
        { status: 409 }
      );
    }
    
    logger.error('Failed to create monitor', 'API', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create monitor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete all monitors (for cleanup)
export async function DELETE() {
  try {
    const deletedCount = await databaseService.getCommentMonitorRepository().clearAll();
    
    logger.info(`Deleted all ${deletedCount} monitors`, 'API');
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} monitors`
    });
  } catch (error) {
    logger.error('Failed to delete all monitors', 'API', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to delete monitors' },
      { status: 500 }
    );
  }
}

// Export functions for other modules
export async function getActiveMonitors() {
  return await databaseService.getCommentMonitorRepository().findActiveMonitors();
}

export async function updateMonitorStats(monitorId: string, detectionTime?: string): Promise<boolean> {
  try {
    await databaseService.getCommentMonitorRepository().incrementDetectionCount(monitorId);
    return true;
  } catch (error) {
    logger.error('Failed to update monitor stats', 'API', { monitorId }, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}