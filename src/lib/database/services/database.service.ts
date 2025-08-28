import { CommentMonitorRepository } from '../repositories/comment-monitor.repository';
import { DetectionLogRepository } from '../repositories/detection-log.repository';
import { WebhookEventRepository, SystemLogRepository } from '../repositories/webhook-event.repository';
import { logger } from '@/lib/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  
  private commentMonitorRepo: CommentMonitorRepository;
  private detectionLogRepo: DetectionLogRepository;
  private webhookEventRepo: WebhookEventRepository;
  private systemLogRepo: SystemLogRepository;

  private constructor() {
    this.commentMonitorRepo = new CommentMonitorRepository();
    this.detectionLogRepo = new DetectionLogRepository();
    this.webhookEventRepo = new WebhookEventRepository();
    this.systemLogRepo = new SystemLogRepository();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Repository getters
  getCommentMonitorRepository() {
    return this.commentMonitorRepo;
  }

  getDetectionLogRepository() {
    return this.detectionLogRepo;
  }

  getWebhookEventRepository() {
    return this.webhookEventRepo;
  }

  getSystemLogRepository() {
    return this.systemLogRepo;
  }

  // High-level service methods
  async findRelevantMonitors(identifier: string) {
    try {
      // Try direct post ID match first
      let monitors = await this.commentMonitorRepo.findByPostId(identifier);
      
      // Try media ID match if no results
      if (monitors.length === 0) {
        monitors = await this.commentMonitorRepo.findByMediaId(identifier);
      }
      
      logger.debug('Found relevant monitors', 'DATABASE', {
        identifier,
        count: monitors.length,
      });
      
      return monitors;
    } catch (error) {
      logger.error('Failed to find relevant monitors', 'DATABASE', { identifier }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async logKeywordDetection(
    monitorId: string,
    commentId: string,
    commenterId: string,
    detectedText: string,
    commenterUsername?: string
  ) {
    try {
      // Create detection log and increment monitor count in transaction
      const detectionLog = await this.detectionLogRepo.create({
        monitorId,
        commentId,
        commenterId,
        commenterUsername,
        detectedText,
      });

      await this.commentMonitorRepo.incrementDetectionCount(monitorId);

      logger.info('Keyword detection logged', 'DATABASE', {
        monitorId,
        commentId,
        commenterId,
        logId: detectionLog.id,
      });

      return detectionLog;
    } catch (error) {
      logger.error('Failed to log keyword detection', 'DATABASE', {
        monitorId,
        commentId,
        commenterId,
      }, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();