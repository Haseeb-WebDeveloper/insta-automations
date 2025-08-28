import { DetectionLog } from '@prisma/client';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { IDetectionLogRepository, CreateDetectionLogDto } from '../types/repository';

export class DetectionLogRepository implements IDetectionLogRepository {
  async create(data: CreateDetectionLogDto): Promise<DetectionLog> {
    try {
      const log = await prisma.detectionLog.create({
        data: {
          monitorId: data.monitorId,
          commentId: data.commentId,
          commenterId: data.commenterId,
          commenterUsername: data.commenterUsername,
          detectedText: data.detectedText,
          replyStatus: data.replyStatus || 'pending',
          replyId: data.replyId,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
        },
      });
      
      logger.info('Detection log created', 'DATABASE', {
        id: log.id,
        monitorId: log.monitorId,
        commenterId: log.commenterId,
      });
      
      return log;
    } catch (error) {
      logger.error('Failed to create detection log', 'DATABASE', { data }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findByMonitorId(monitorId: string): Promise<DetectionLog[]> {
    try {
      return await prisma.detectionLog.findMany({
        where: { monitorId },
        orderBy: { detectedAt: 'desc' },
        include: {
          monitor: {
            select: { keyword: true, postId: true },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to find detection logs by monitor ID', 'DATABASE', { monitorId }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findByCommenterId(commenterId: string): Promise<DetectionLog[]> {
    try {
      return await prisma.detectionLog.findMany({
        where: { commenterId },
        orderBy: { detectedAt: 'desc' },
        include: {
          monitor: {
            select: { keyword: true, postId: true },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to find detection logs by commenter ID', 'DATABASE', { commenterId }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateReplyStatus(
    id: string,
    status: string,
    replyId?: string,
    errorMessage?: string
  ): Promise<DetectionLog> {
    try {
      const log = await prisma.detectionLog.update({
        where: { id },
        data: {
          replyStatus: status,
          replyId,
          errorMessage,
        },
      });
      
      logger.info('Detection log reply status updated', 'DATABASE', {
        id,
        status,
        replyId,
      });
      
      return log;
    } catch (error) {
      logger.error('Failed to update reply status', 'DATABASE', { id, status }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}