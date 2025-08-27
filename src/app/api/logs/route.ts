import { NextRequest, NextResponse } from 'next/server';
import { logger, LogLevel } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || '50');
    const level = searchParams.get('level');

    let logs;
    if (level && Object.values(LogLevel).includes(parseInt(level))) {
      logs = logger.getLogsByLevel(parseInt(level), count);
    } else {
      logs = logger.getRecentLogs(count);
    }

    return NextResponse.json({
      logs,
      total: logs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    logger.clearLogs();
    
    return NextResponse.json({
      message: 'Logs cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json({
      error: 'Failed to clear logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}