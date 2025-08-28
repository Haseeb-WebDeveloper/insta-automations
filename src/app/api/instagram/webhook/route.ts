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
  // Force reload test
  console.log('=== WEBHOOK POST RECEIVED - RELOAD TEST ===');
  console.log('Current time:', new Date().toISOString());
  
  try {
    // Get the raw body as a buffer to ensure signature verification works correctly
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    console.log('Webhook body:', body);
    console.log('Webhook signature:', signature);
    
    // In development mode, allow bypassing signature verification with a special header
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassSignature = request.headers.get('x-bypass-signature') === 'development';
    
    console.log('Development mode:', isDevelopment, 'Bypass:', bypassSignature);
    
    // For development, temporarily bypass signature verification to test functionality
    // In production, you should enable this verification
    const skipVerification = isDevelopment; // Temporarily skip for development
    
    if (!skipVerification) {
      // Verify the payload signature (bypass in development if requested)
      if (!isDevelopment || !bypassSignature) {
        if (!verifySignature(body, signature)) {
          logger.warn('Invalid webhook signature', 'WEBHOOK_SECURITY', { 
            hasSignature: !!signature,
            isDevelopment,
            bypassSignature 
          });
          return new NextResponse('Unauthorized', { status: 401 });
        }
      } else {
        logger.warn('Signature verification bypassed in development mode', 'WEBHOOK_SECURITY');
        console.log('Signature verification bypassed');
      }
    } else {
      console.log('Signature verification temporarily disabled for development');
      logger.warn('Signature verification temporarily disabled for development', 'WEBHOOK_SECURITY');
    }

    const payload: InstagramWebhookPayload = JSON.parse(body);
    
    console.log('Parsed payload:', payload);
    logger.webhookReceived(payload);

    // Process Instagram messages
    if (payload.object === 'instagram') {
      console.log('Processing Instagram webhook');
      for (const entry of payload.entry) {
        console.log('Processing entry:', entry);
        if (entry.messaging) {
          console.log('Found messaging array with', entry.messaging.length, 'messages');
          for (const messaging of entry.messaging) {
            console.log('Processing messaging:', messaging);
            await withErrorHandling(
              () => handleMessage(messaging),
              'MESSAGE_HANDLING',
              undefined
            );
          }
        }
      }
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
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

  // Ensure both signatures have the same length before comparison
  if (signature.length !== expectedSignature.length) {
    logger.warn('Signature length mismatch', 'WEBHOOK_SECURITY', {
      providedLength: signature.length,
      expectedLength: expectedSignature.length,
      providedSignature: signature,
      expectedSignature
    });
    return false;
  }

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
  console.log('=== HANDLING MESSAGE ===');
  console.log('Messaging object:', messaging);
  
  logger.debug('Processing messaging event', 'MESSAGE_HANDLER', messaging);

  // Check if this is an incoming message (not a delivery receipt)
  if (messaging.message && messaging.message.text) {
    const senderId = messaging.sender.id;
    const messageText = messaging.message.text.toLowerCase().trim();
    
    console.log('Message details:', { senderId, messageText, originalText: messaging.message.text });
    
    logger.messageReceived(senderId, messageText);
    logger.info('Message received for processing', 'MESSAGE_HANDLER', {
      senderId,
      messageText,
      originalText: messaging.message.text
    });

    // Auto-reply logic: respond "how are you" to "hi"
    if (messageText === 'hi') {
      console.log('AUTO-REPLY TRIGGERED: hi -> how are you');
      logger.autoReplyTriggered('hi', 'how are you', senderId);
      await sendReply(senderId, 'how are you');
    } else {
      console.log('No auto-reply triggered for:', messageText);
      logger.info('No auto-reply triggered for message', 'MESSAGE_HANDLER', {
        senderId,
        messageText,
        reason: 'Message does not match trigger condition "hi"'
      });
    }
  } else {
    console.log('No text message found in messaging object');
    logger.debug('Messaging event has no text message', 'MESSAGE_HANDLER', {
      hasMessage: !!messaging.message,
      messageKeys: messaging.message ? Object.keys(messaging.message) : []
    });
  }
  console.log('=== MESSAGE HANDLING COMPLETE ===');
}

// Send reply using Instagram Graph API service
async function sendReply(recipientId: string, message: string) {
  console.log('=== SENDING REPLY ===');
  console.log('Recipient ID:', recipientId);
  console.log('Message:', message);
  
  // Validate recipient ID format (Instagram user IDs should be numeric)
  if (!recipientId || recipientId === 'test_user' || !/^\d+$/.test(recipientId)) {
    console.log('Invalid recipient ID format, skipping send for test/invalid user');
    logger.warn('Skipping message send due to invalid recipient ID', 'SEND_REPLY', {
      recipientId,
      reason: 'Test user or invalid ID format'
    });
    return;
  }
  
  try {
    const result = await instagramAPI.sendMessage(recipientId, message);
    
    console.log('Send result:', result);
    
    if (result.error) {
      console.log('Send failed:', result.error);
      logger.messageSent(recipientId, message, false);
      logger.apiError('sendMessage', new Error(result.error.message), result.error.code);
    } else {
      console.log('Send successful, message ID:', result.message_id);
      logger.messageSent(recipientId, message, true, result.message_id);
    }
  } catch (error) {
    console.error('Send error:', error);
    logger.error('Error sending reply', 'SEND_REPLY', { recipientId, message }, error as Error);
  }
  console.log('=== REPLY SENDING COMPLETE ===');
}