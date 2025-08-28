import { WebhookEvent, SystemLog } from '@prisma/client';
import { prisma } from '@/lib/database';
import { logger } from '@/lib/logger';
import { IWebhookEventRepository, ISystemLogRepository, CreateWebhookEventDto } from '../types/repository';

export class WebhookEventRepository implements IWebhookEventRepository {
  async create(data: CreateWebhookEventDto): Promise<WebhookEvent> {
    try {
      const event = await prisma.webhookEvent.create({
        data: {
          eventType: data.eventType,
          instagramObjectId: data.instagramObjectId,
          instagramUserId: data.instagramUserId,
          monitorId: data.monitorId,
          payloadData: data.payloadData,
          processingStatus: data.processingStatus || 'pending',
          errorMessage: data.errorMessage,
        },
      });
      
      logger.info('Webhook event created', 'DATABASE', {
        id: event.id,
        eventType: event.eventType,
        objectId: event.instagramObjectId,
      });
      
      return event;
    } catch (error) {
      logger.error('Failed to create webhook event', 'DATABASE', { data }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async findByEventType(eventType: string): Promise<WebhookEvent[]> {
    try {
      return await prisma.webhookEvent.findMany({
        where: { eventType },
        orderBy: { receivedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to find webhook events by type', 'DATABASE', { eventType }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async updateProcessingStatus(id: string, status: string, errorMessage?: string): Promise<WebhookEvent> {
    try {
      const event = await prisma.webhookEvent.update({
        where: { id },
        data: {
          processingStatus: status,
          errorMessage,
          processedAt: new Date(),
        },
      });
      
      logger.info('Webhook event processing status updated', 'DATABASE', {
        id,
        status,
      });
      
      return event;
    } catch (error) {
      logger.error('Failed to update webhook processing status', 'DATABASE', { id, status }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export class SystemLogRepository implements ISystemLogRepository {
  async create(level: string, category: string, message: string, metadata?: any): Promise<SystemLog> {
    try {
      const log = await prisma.systemLog.create({
        data: {
          level,
          category,
          message,
          metadata,
        },
      });
      
      return log;
    } catch (error) {
      // Avoid infinite loop by not logging this error through the logger
      console.error('Failed to create system log:', error);
      throw error;
    }
  }

  async findByCategory(category: string): Promise<SystemLog[]> {
    try {
      return await prisma.systemLog.findMany({
        where: { category },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (error) {
      logger.error('Failed to find system logs by category', 'DATABASE', { category }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async cleanup(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const result = await prisma.systemLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
      
      logger.info('System logs cleaned up', 'DATABASE', {
        deletedCount: result.count,
        olderThanDays,
      });
      
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup system logs', 'DATABASE', { olderThanDays }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}