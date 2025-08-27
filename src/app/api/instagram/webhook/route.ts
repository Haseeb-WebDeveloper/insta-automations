import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { instagramAPI } from '@/lib/instagram-api';
import { logger, createErrorResponse, withErrorHandling } from '@/lib/logger';

// Type definitions for Instagram webhook payloads
interface InstagramMessage {
  id: string;
  text: string;
  timestamp: string;
}

interface InstagramMessaging {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message?: InstagramMessage;
}

interface InstagramWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging?: InstagramMessaging[];
  }>;
}

// Webhook verification for Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  logger.debug('Webhook verification attempt', 'WEBHOOK_VERIFY', { mode, token });

  // Verify the webhook
  if (mode === 'subscribe' && token === verifyToken) {
    logger.webhookVerification(true);
    return new NextResponse(challenge, { status: 200 });
  } else {
    logger.webhookVerification(false, token || undefined);
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Handle incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    // Verify the payload signature
    if (!verifySignature(body, signature)) {
      logger.warn('Invalid webhook signature', 'WEBHOOK_SECURITY', { hasSignature: !!signature });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload: InstagramWebhookPayload = JSON.parse(body);
    
    logger.webhookReceived(payload);

    // Process Instagram messages
    if (payload.object === 'instagram') {
      for (const entry of payload.entry) {
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            await withErrorHandling(
              () => handleMessage(messaging),
              'MESSAGE_HANDLING',
              undefined
            );
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    return createErrorResponse(error, 'WEBHOOK_POST');
  }
}

// Verify webhook signature
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    logger.warn('No signature provided in webhook request', 'WEBHOOK_SECURITY');
    return false;
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    logger.error('META_APP_SECRET not configured', 'CONFIG');
    return false;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    logger.warn('Signature verification failed', 'WEBHOOK_SECURITY', {
      providedSignature: signature,
      expectedSignature
    });
  }

  return isValid;
}

// Handle individual messages
async function handleMessage(messaging: InstagramMessaging) {
  logger.debug('Processing messaging event', 'MESSAGE_HANDLER', messaging);

  // Check if this is an incoming message (not a delivery receipt)
  if (messaging.message && messaging.message.text) {
    const senderId = messaging.sender.id;
    const messageText = messaging.message.text.toLowerCase().trim();
    
    logger.messageReceived(senderId, messageText);

    // Auto-reply logic: respond "how are you" to "hi"
    if (messageText === 'hi') {
      logger.autoReplyTriggered('hi', 'how are you', senderId);
      await sendReply(senderId, 'how are you');
    }
  }
}

// Send reply using Instagram Graph API service
async function sendReply(recipientId: string, message: string) {
  try {
    const result = await instagramAPI.sendMessage(recipientId, message);
    
    if (result.error) {
      logger.messageSent(recipientId, message, false);
      logger.apiError('sendMessage', new Error(result.error.message), result.error.code);
    } else {
      logger.messageSent(recipientId, message, true, result.message_id);
    }
  } catch (error) {
    logger.error('Error sending reply', 'SEND_REPLY', { recipientId, message }, error as Error);
  }
}