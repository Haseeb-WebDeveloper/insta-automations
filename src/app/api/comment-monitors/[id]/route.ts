import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import storage, { CommentMonitor } from '@/lib/comment-monitor-storage';

// PUT - Update specific monitor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Find monitor
    const existingMonitor = storage.getMonitorById(id);
    if (!existingMonitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates = ['keyword', 'autoReplyMessage', 'isActive'];
    const updates: Partial<CommentMonitor> = {};
    
    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key as keyof CommentMonitor] = body[key];
      }
    }

    // Apply updates
    const success = storage.updateMonitor(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update monitor' },
        { status: 500 }
      );
    }

    const updatedMonitor = storage.getMonitorById(id);

    return NextResponse.json({
      success: true,
      monitor: updatedMonitor
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update monitor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific monitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  try {
    const { id } = await params;
    
    // Delete monitor
    const deleted = storage.deleteMonitor(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }

    logger.info('Deleted monitor:', id);

    return NextResponse.json({
      success: true,
      message: 'Monitor deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete monitor:', error as string);
    return NextResponse.json(
      { error: 'Failed to delete monitor' },
      { status: 500 }
    );
  }
}

// GET - Get specific monitor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const monitor = storage.getMonitorById(id);
    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      monitor
    });

  } catch (error) {
    logger.error('Failed to fetch monitor:', error as string);
    return NextResponse.json(
      { error: 'Failed to fetch monitor' },
      { status: 500 }
    );
  }
}