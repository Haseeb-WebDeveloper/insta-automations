import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { instagramAPI } from '@/lib/instagram-api';
import { logger } from '@/lib/logger';

// Simple webhook handler for Instagram DM auto-reply
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verification successful');
    logger.info('Webhook verification successful', 'WEBHOOK_SIMPLE');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.log('Webhook verification failed');
    logger.warn('Webhook verification failed', 'WEBHOOK_SIMPLE');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  console.log('=== SIMPLE WEBHOOK RECEIVED ===', new Date().toISOString());
  
  try {
    const body = await request.text();
    console.log('Webhook body length:', body.length);
    
    // Log all headers for debugging
    const headers: any = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    // Parse the payload
    const payload = JSON.parse(body);
    console.log('Parsed payload:', JSON.stringify(payload, null, 2));
    
    logger.info('Simple webhook received', 'WEBHOOK_SIMPLE', { 
      bodyLength: body.length,
      hasSignature: !!request.headers.get('x-hub-signature-256'),
      object: payload.object
    });

    // Process Instagram messages
    if (payload.object === 'instagram') {
      console.log('Processing Instagram webhook');
      
      for (const entry of payload.entry || []) {
        console.log('Processing entry:', entry.id);
        
        if (entry.messaging) {
          console.log('Found', entry.messaging.length, 'messaging events');
          
          for (const messaging of entry.messaging) {
            await processMessage(messaging);
          }
        }
      }
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    return new NextResponse('OK', { status: 200 });
    
  } catch (error) {
    console.error('Webhook error:', error);
    logger.error('Simple webhook error', 'WEBHOOK_SIMPLE', {}, error as Error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function processMessage(messaging: any) {
  console.log('=== PROCESSING MESSAGE ===');
  console.log('Messaging:', JSON.stringify(messaging, null, 2));
  
  const senderId = messaging.sender?.id;
  const messageText = messaging.message?.text;
  
  console.log('Sender ID:', senderId);
  console.log('Message text:', messageText);
  
  logger.info('Processing message', 'WEBHOOK_SIMPLE', {
    senderId,
    messageText
  });

  if (messageText && messageText.toLowerCase().trim() === 'hi') {
    console.log('AUTO-REPLY TRIGGERED: hi -> how are you');
    
    logger.info('Auto-reply triggered', 'WEBHOOK_SIMPLE', {
      trigger: 'hi',
      response: 'how are you',
      senderId
    });
    
    // Validate sender ID format
    if (senderId && /^\d+$/.test(senderId) && senderId !== 'test_user') {
      console.log('Sending reply to:', senderId);
      
      try {
        const result = await instagramAPI.sendMessage(senderId, 'how are you');
        
        if (result.error) {
          console.error('Failed to send message:', result.error);
          logger.error('Failed to send auto-reply', 'WEBHOOK_SIMPLE', { senderId }, new Error(result.error.message));
        } else {
          console.log('Message sent successfully:', result.message_id);
          logger.info('Auto-reply sent successfully', 'WEBHOOK_SIMPLE', { senderId, messageId: result.message_id });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        logger.error('Error sending auto-reply', 'WEBHOOK_SIMPLE', { senderId }, error as Error);
      }
    } else {
      console.log('Invalid sender ID, skipping send:', senderId);
      logger.warn('Invalid sender ID format', 'WEBHOOK_SIMPLE', { senderId });
    }
  } else {
    console.log('No auto-reply triggered for message:', messageText);
  }
  
  console.log('=== MESSAGE PROCESSING COMPLETE ===');
}