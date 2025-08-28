import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import {
  ICommentMonitorRepository,
  CreateCommentMonitorDto,
  UpdateCommentMonitorDto,
  MonitoringStats,
} from '../types/repository';
import { CommentMonitor } from '@prisma/client';

export class CommentMonitorRepository implements ICommentMonitorRepository {
  async create(data: CreateCommentMonitorDto): Promise<CommentMonitor> {
    try {
      const monitor = await prisma.commentMonitor.create({
        data: {
          postUrl: data.postUrl,
          postId: data.postId,
          mediaId: data.mediaId,
          keyword: data.keyword,
          autoReplyMessage: data.autoReplyMessage,
          isActive: data.isActive ?? true,
        },
      });
      
      logger.info('Comment monitor created', 'DATABASE', {
        id: monitor.id,
        postId: monitor.postId,
        keyword: monitor.keyword,
      });
      
      return monitor;
    } catch (error) {
      logger.error('Failed to create comment monitor', 'DATABASE', { data }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findAll(): Promise<CommentMonitor[]> {
    try {
      return await prisma.commentMonitor.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find all monitors', 'DATABASE', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findById(id: string): Promise<CommentMonitor | null> {
    try {
      return await prisma.commentMonitor.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find monitor by ID', 'DATABASE', { id }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findByPostId(postId: string): Promise<CommentMonitor[]> {
    try {
      return await prisma.commentMonitor.findMany({
        where: { postId },
      });
    } catch (error) {
      logger.error('Failed to find monitors by post ID', 'DATABASE', { postId }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findByMediaId(mediaId: string): Promise<CommentMonitor[]> {
    try {
      return await prisma.commentMonitor.findMany({
        where: { mediaId },
      });
    } catch (error) {
      logger.error('Failed to find monitors by media ID', 'DATABASE', { mediaId }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findActiveMonitors(): Promise<CommentMonitor[]> {
    try {
      return await prisma.commentMonitor.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find active monitors', 'DATABASE', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async update(id: string, data: UpdateCommentMonitorDto): Promise<CommentMonitor> {
    try {
      const monitor = await prisma.commentMonitor.update({
        where: { id },
        data,
      });
      
      logger.info('Comment monitor updated', 'DATABASE', {
        id,
        changes: Object.keys(data),
      });
      
      return monitor;
    } catch (error) {
      logger.error('Failed to update monitor', 'DATABASE', { id, data }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.commentMonitor.delete({
        where: { id },
      });
      
      logger.info('Comment monitor deleted', 'DATABASE', { id });
      return true;
    } catch (error) {
      logger.error('Failed to delete monitor', 'DATABASE', { id }, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  async checkDuplicate(postId: string, keyword: string, excludeId?: string): Promise<boolean> {
    try {
      const monitor = await prisma.commentMonitor.findFirst({
        where: {
          postId,
          keyword: {
            mode: 'insensitive',
            equals: keyword,
          },
          id: excludeId ? { not: excludeId } : undefined,
        },
      });
      
      return monitor !== null;
    } catch (error) {
      logger.error('Failed to check duplicate monitor', 'DATABASE', { postId, keyword }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async incrementDetectionCount(id: string): Promise<CommentMonitor> {
    try {
      const monitor = await prisma.commentMonitor.update({
        where: { id },
        data: {
          detectionCount: { increment: 1 },
          lastDetection: new Date(),
        },
      });
      
      logger.debug('Detection count incremented', 'DATABASE', {
        id,
        newCount: monitor.detectionCount,
      });
      
      return monitor;
    } catch (error) {
      logger.error('Failed to increment detection count', 'DATABASE', { id }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getStats(): Promise<MonitoringStats> {
    try {
      const [totalMonitors, activeMonitors, detectionLogs] = await Promise.all([
        prisma.commentMonitor.count(),
        prisma.commentMonitor.count({ where: { isActive: true } }),
        prisma.detectionLog.findMany({
          include: { monitor: { select: { keyword: true, postId: true } } },
          orderBy: { detectedAt: 'desc' },
          take: 10,
        }),
      ]);

      const totalDetections = await prisma.commentMonitor.aggregate({
        _sum: { detectionCount: true },
      });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayDetections = await prisma.detectionLog.count({
        where: { detectedAt: { gte: todayStart } },
      });

      const recentActivity = detectionLogs.map((log:any)=> ({
        monitorId: log.monitorId,
        keyword: log.monitor.keyword,
        postId: log.monitor.postId,
        detectionTime: log.detectedAt.toISOString(),
      }));

      return {
        totalMonitors,
        activeMonitors,
        totalDetections: totalDetections._sum.detectionCount || 0,
        todayDetections,
        recentActivity,
      };
    } catch (error) {
      logger.error('Failed to get monitoring stats', 'DATABASE', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async clearAll(): Promise<number> {
    try {
      const result = await prisma.commentMonitor.deleteMany();
      logger.info('All monitors cleared', 'DATABASE', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to clear all monitors', 'DATABASE', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}