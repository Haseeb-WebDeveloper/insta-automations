import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { databaseService } from '@/lib/database/services/database.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// PUT - Update specific monitor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Find monitor
    const existingMonitor = await databaseService.getCommentMonitorRepository().findById(id);
    if (!existingMonitor) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates = ['keyword', 'autoReplyMessage', 'isActive'];
    const updates: any = {};
    
    for (const key of allowedUpdates) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    // Apply updates
    const updatedMonitor = await databaseService.getCommentMonitorRepository().update(id, updates);

    logger.info('Monitor updated successfully', 'API', {
      id,
      changes: Object.keys(updates),
    });

    return NextResponse.json({
      success: true,
      monitor: updatedMonitor
    });

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }
    
    logger.error('Failed to update monitor', 'API', {}, error instanceof Error ? error : new Error(String(error)));
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
    const deleted = await databaseService.getCommentMonitorRepository().delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Monitor not found' },
        { status: 404 }
      );
    }

    logger.info('Monitor deleted successfully', 'API', { id });

    return NextResponse.json({
      success: true,
      message: 'Monitor deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete monitor', 'API', {}, error instanceof Error ? error : new Error(String(error)));
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
    
    const monitor = await databaseService.getCommentMonitorRepository().findById(id);
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
    logger.error('Failed to fetch monitor', 'API', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch monitor' },
      { status: 500 }
    );
  }
}