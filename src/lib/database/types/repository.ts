import { CommentMonitor, DetectionLog, WebhookEvent, SystemLog } from '@prisma/client';

// DTOs for data transfer
export interface CreateCommentMonitorDto {
  postUrl: string;
  postId: string;
  mediaId?: string;
  keyword: string;
  autoReplyMessage: string;
  isActive?: boolean;
}

export interface UpdateCommentMonitorDto {
  postUrl?: string;
  mediaId?: string;
  keyword?: string;
  autoReplyMessage?: string;
  isActive?: boolean;
  detectionCount?: number;
  lastDetection?: Date;
}

export interface CreateDetectionLogDto {
  monitorId: string;
  commentId: string;
  commenterId: string;
  commenterUsername?: string;
  detectedText: string;
  replyStatus?: string;
  replyId?: string;
  errorMessage?: string;
  metadata?: any;
}

export interface CreateWebhookEventDto {
  eventType: string;
  instagramObjectId: string;
  instagramUserId?: string;
  monitorId?: string;
  payloadData: any;
  processingStatus?: string;
  errorMessage?: string;
}

export interface MonitoringStats {
  totalMonitors: number;
  activeMonitors: number;
  totalDetections: number;
  todayDetections: number;
  recentActivity: Array<{
    monitorId: string;
    keyword: string;
    postId: string;
    detectionTime: string;
  }>;
}

// Repository interfaces
export interface ICommentMonitorRepository {
  create(data: CreateCommentMonitorDto): Promise<CommentMonitor>;
  findAll(): Promise<CommentMonitor[]>;
  findById(id: string): Promise<CommentMonitor | null>;
  findByPostId(postId: string): Promise<CommentMonitor[]>;
  findByMediaId(mediaId: string): Promise<CommentMonitor[]>;
  findActiveMonitors(): Promise<CommentMonitor[]>;
  update(id: string, data: UpdateCommentMonitorDto): Promise<CommentMonitor>;
  delete(id: string): Promise<boolean>;
  checkDuplicate(postId: string, keyword: string, excludeId?: string): Promise<boolean>;
  incrementDetectionCount(id: string): Promise<CommentMonitor>;
  getStats(): Promise<MonitoringStats>;
  clearAll(): Promise<number>;
}

export interface IDetectionLogRepository {
  create(data: CreateDetectionLogDto): Promise<DetectionLog>;
  findByMonitorId(monitorId: string): Promise<DetectionLog[]>;
  findByCommenterId(commenterId: string): Promise<DetectionLog[]>;
  updateReplyStatus(id: string, status: string, replyId?: string, errorMessage?: string): Promise<DetectionLog>;
}

export interface IWebhookEventRepository {
  create(data: CreateWebhookEventDto): Promise<WebhookEvent>;
  findByEventType(eventType: string): Promise<WebhookEvent[]>;
  updateProcessingStatus(id: string, status: string, errorMessage?: string): Promise<WebhookEvent>;
}

export interface ISystemLogRepository {
  create(level: string, category: string, message: string, metadata?: any): Promise<SystemLog>;
  findByCategory(category: string): Promise<SystemLog[]>;
  cleanup(olderThanDays: number): Promise<number>;
}