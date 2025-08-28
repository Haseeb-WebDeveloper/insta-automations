

export interface WebhookStatus {
  isConfigured: boolean;
  lastActivity: string | null;
  messageCount: number;
  status: "connected" | "disconnected" | "error";
}

export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  isValid: boolean;
}

export interface CommentMonitor {
  id: string;
  postUrl: string;
  postId: string;
  keyword: string;
  autoReplyMessage: string;
  isActive: boolean;
  createdAt: string;
  detectionCount: number;
  lastDetection?: string;
}

export interface MonitoringStats {
  totalMonitors: number;
  activeMonitors: number;
  totalDetections: number;
  todayDetections: number;
}



export interface InstagramMessage {
  text: string;
}

export interface InstagramSendMessagePayload {
  recipient: {
    id: string;
  };
  message: InstagramMessage;
}

export interface InstagramAPIResponse {
  message_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}
