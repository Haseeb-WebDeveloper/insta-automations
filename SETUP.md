# Instagram DM Auto-Reply Setup Guide

This guide will help you set up the Instagram Direct Message auto-reply system that responds "how are you" when users send "hi".

## Prerequisites

1. **Instagram Professional Account**: You need a Business or Creator Instagram account
2. **Meta Developer Account**: Sign up at [developers.facebook.com](https://developers.facebook.com)
3. **Node.js**: Version 18 or higher

## Step 1: Meta App Setup

### 1.1 Create a Meta App
1. Go to [Meta Developer Console](https://developers.facebook.com/apps/)
2. Click "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - App Name: "Instagram DM Moderator"
   - App Contact Email: Your email
   - Business Manager Account: Select your business account

### 1.2 Add Instagram Basic Display Product
1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display > Basic Display
4. Add your Instagram account as a test user

### 1.3 Configure Instagram Messaging
1. Add "Instagram Messaging" product to your app
2. In Instagram Messaging settings:
   - Add webhook URL: `https://your-domain.com/api/instagram/webhook`
   - Verify token: Create a secure random string (save this)
   - Subscribe to webhook events: `messages`

### 1.4 Get Access Token
1. Go to Instagram Basic Display > User Token Generator
2. Generate token for your Instagram account
3. Copy the access token (this expires, so you'll need to refresh it)

## Step 2: Environment Configuration

### 2.1 Create Environment File
Copy `.env.local.example` to `.env.local` and fill in these values:

```bash
# Your Meta App credentials
NEXT_PUBLIC_META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here

# Instagram API configuration
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token

# Webhook configuration
WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here

# Environment
NODE_ENV=development
```

### 2.2 Find Your Instagram Account ID
To get your Instagram Account ID:

1. Use the Graph API Explorer: `https://developers.facebook.com/tools/explorer/`
2. Select your app and get a User Access Token
3. Make a GET request to: `me/accounts`
4. Look for your Instagram account in the response

OR use this endpoint once your app is running:
```bash
curl "https://graph.instagram.com/v19.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"
```

## Step 3: Development Setup

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3.3 Test Webhook Locally (Development)
For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000
```

Update your webhook URL in Meta Developer Console to use the ngrok URL:
`https://your-ngrok-url.ngrok.io/api/instagram/webhook`

## Step 4: Production Deployment

### 4.1 Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy the app

### 4.2 Update Webhook URL
Once deployed, update your webhook URL in Meta Developer Console:
`https://your-app-domain.vercel.app/api/instagram/webhook`

## Step 5: Testing

### 5.1 Verify Webhook
1. In Meta Developer Console, go to Instagram Messaging
2. Test your webhook URL
3. Check if verification passes

### 5.2 Test Auto-Reply
1. Have a test user send "hi" to your Instagram account
2. The system should automatically reply with "how are you"
3. Check the dashboard for message logs

### 5.3 Monitor Dashboard
1. Go to your app's homepage
2. Check the status of:
   - Instagram Account connection
   - Webhook status
   - Auto-reply functionality

## Troubleshooting

### Common Issues

#### 1. Webhook Verification Fails
- Check that `WEBHOOK_VERIFY_TOKEN` matches the token in Meta Developer Console
- Ensure webhook URL is accessible from the internet
- Check server logs for errors

#### 2. Messages Not Being Received
- Verify webhook subscription includes "messages" event
- Check if Instagram account is properly connected
- Ensure app is not in development mode restrictions

#### 3. Auto-Reply Not Working
- Check Instagram access token validity
- Verify `INSTAGRAM_ACCOUNT_ID` is correct
- Check API logs for error messages

#### 4. Dashboard Shows Disconnected
- Verify all environment variables are set correctly
- Check Instagram access token hasn't expired
- Test API connectivity

### Debugging Tools

#### 1. Check Logs
Visit `/api/logs` to see detailed application logs

#### 2. Test Instagram API
Use the dashboard "Refresh Status" button to test connectivity

#### 3. Webhook Testing
Test webhook verification:
```bash
curl "http://localhost:3000/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test"
```

## Security Notes

1. **Never expose secrets**: Keep `META_APP_SECRET` and access tokens secure
2. **Use HTTPS**: Always use HTTPS in production
3. **Token rotation**: Regularly refresh Instagram access tokens
4. **Rate limiting**: Be aware of Instagram API rate limits

## Next Steps

After basic setup is working:

1. **Add database**: Store messages and responses in a database
2. **Implement authentication**: Add user authentication for dashboard access
3. **Enhanced moderation**: Add AI-powered content analysis
4. **Multi-level approval**: Implement the two-level moderation workflow
5. **Analytics**: Add reporting and analytics features

## Support

If you encounter issues:

1. Check the application logs
2. Verify all environment variables
3. Test webhook connectivity
4. Review Meta Developer Console for any app restrictions
5. Check Instagram account permissions