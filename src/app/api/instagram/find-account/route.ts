import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  if (!accessToken) {
    return NextResponse.json({
      error: 'No access token configured'
    }, { status: 400 });
  }

  try {
    // First, let's try to get user info from the access token
    console.log('Checking access token info...');
    
    // Get debug info about the token
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();
    
    console.log('Token debug info:', debugData);

    // Try to get the user's accounts
    const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`;
    const accountsResponse = await fetch(accountsUrl);
    const accountsData = await accountsResponse.json();
    
    console.log('User accounts:', accountsData);

    // Try to get Instagram accounts specifically
    const igAccountsUrl = `https://graph.facebook.com/v19.0/me?fields=accounts{instagram_business_account,name}&access_token=${accessToken}`;
    const igAccountsResponse = await fetch(igAccountsUrl);
    const igAccountsData = await igAccountsResponse.json();
    
    console.log('Instagram accounts:', igAccountsData);

    // Also try direct Instagram API
    const instagramMeUrl = `https://graph.instagram.com/v19.0/me?fields=id,username,name&access_token=${accessToken}`;
    const instagramMeResponse = await fetch(instagramMeUrl);
    const instagramMeData = await instagramMeResponse.json();
    
    console.log('Instagram me data:', instagramMeData);

    return NextResponse.json({
      tokenDebug: debugData,
      userAccounts: accountsData,
      instagramAccounts: igAccountsData,
      instagramMe: instagramMeData,
      suggestions: {
        message: 'Look for the numeric ID in the instagramMe data - that should be your INSTAGRAM_ACCOUNT_ID'
      }
    });

  } catch (error) {
    console.error('Error finding account:', error);
    return NextResponse.json({
      error: 'Failed to find account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}