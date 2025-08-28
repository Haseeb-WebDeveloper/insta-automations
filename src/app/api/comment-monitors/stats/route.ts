import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { databaseService } from '@/lib/database/services/database.service';

// GET - Get monitoring statistics
export async function GET() {
  try {
    const stats = await databaseService.getCommentMonitorRepository().getStats();

    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Failed to generate statistics", 'API', {}, error instanceof Error ? error : new Error(String(error)));

    // Return default stats on error
    const defaultStats = {
      totalMonitors: 0,
      activeMonitors: 0,
      totalDetections: 0,
      todayDetections: 0,
      recentActivity: [],
    };

    return NextResponse.json(defaultStats);
  }
}

// POST - Update statistics (for webhook usage)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monitorId, action, detectionTime } = body;

    // This endpoint can be used by the webhook to update statistics
    if (action === "detection") {
      try {
        await databaseService.getCommentMonitorRepository().incrementDetectionCount(monitorId);
        logger.info('Statistics updated via webhook', 'API', { monitorId, action });
      } catch (error) {
        logger.error('Monitor not found for stats update', 'API', { monitorId });
        return NextResponse.json(
          { error: "Monitor not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to update statistics", 'API', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Failed to update statistics" },
      { status: 500 }
    );
  }
}
