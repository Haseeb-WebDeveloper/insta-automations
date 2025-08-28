import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import storage from "@/lib/comment-monitor-storage";

// GET - Get monitoring statistics
export async function GET() {
  try {
    const stats = storage.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Failed to generate statistics:", error as string);

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
      const success = storage.updateDetectionStats(monitorId, detectionTime);

      if (!success) {
        return NextResponse.json(
          { error: "Monitor not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to update statistics:", error as string);
    return NextResponse.json(
      { error: "Failed to update statistics" },
      { status: 500 }
    );
  }
}
