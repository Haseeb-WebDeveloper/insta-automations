import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  console.log('=== WEBHOOK TEST GET ===');
  logger.info('Webhook test GET endpoint called', 'WEBHOOK_TEST');
  return NextResponse.json({ message: 'GET test successful', timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK TEST POST ===');
  const body = await request.text();
  console.log('Body:', body);
  
  logger.info('Webhook test POST endpoint called', 'WEBHOOK_TEST', { body });
  
  // Test Instagram message processing
  try {
    const payload = JSON.parse(body);
    console.log('Parsed payload:', payload);
    
    if (payload.object === 'instagram') {
      logger.info('Instagram webhook test received', 'WEBHOOK_TEST', { entryCount: payload.entry?.length });
      
      for (const entry of payload.entry || []) {
        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            const senderId = messaging.sender?.id;
            const messageText = messaging.message?.text;
            
            logger.info('Test message processing', 'WEBHOOK_TEST', {
              senderId,
              messageText
            });
            
            if (messageText?.toLowerCase() === 'hi') {
              logger.info('Test auto-reply triggered', 'WEBHOOK_TEST', {
                trigger: 'hi',
                response: 'how are you',
                senderId
              });
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error parsing test webhook', 'WEBHOOK_TEST', {}, error as Error);
  }
  
  return NextResponse.json({ 
    message: 'POST test successful', 
    timestamp: new Date().toISOString(),
    receivedBody: body 
  });
}