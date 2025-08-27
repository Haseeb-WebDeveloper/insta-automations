import { NextRequest, NextResponse } from 'next/server';
import { instagramAPI } from '@/lib/instagram-api';

export async function GET(request: NextRequest) {
  try {
    // Check Instagram account status
    let accountInfo = null;
    let isValidToken = false;
    
    try {
      const accountData = await instagramAPI.getAccountInfo();
      if (!accountData.error) {
        accountInfo = {
          id: accountData.id,
          username: accountData.username,
          name: accountData.name,
          isValid: true
        };
        isValidToken = true;
      }
    } catch (error) {
      console.error('Failed to get Instagram account info:', error);
    }

    // Check webhook configuration
    const webhookStatus = {
      isConfigured: !!(process.env.WEBHOOK_VERIFY_TOKEN && process.env.META_APP_SECRET),
      lastActivity: null, // This would come from a database in a real implementation
      messageCount: 0, // This would come from a database in a real implementation
      status: isValidToken ? 'connected' : 'disconnected' as 'connected' | 'disconnected' | 'error'
    };

    // Check environment variables
    const envStatus = {
      metaAppId: !!process.env.NEXT_PUBLIC_META_APP_ID,
      metaAppSecret: !!process.env.META_APP_SECRET,
      webhookVerifyToken: !!process.env.WEBHOOK_VERIFY_TOKEN,
      instagramAccountId: !!process.env.INSTAGRAM_ACCOUNT_ID,
      instagramAccessToken: !!process.env.INSTAGRAM_ACCESS_TOKEN
    };

    return NextResponse.json({
      account: accountInfo,
      webhook: webhookStatus,
      environment: envStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking Instagram status:', error);
    return NextResponse.json({
      error: 'Failed to check Instagram status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}