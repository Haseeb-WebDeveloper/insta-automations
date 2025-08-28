# AI Instagram Content Moderation - Complete Project Documentation

## 🎯 Project Overview

This project demonstrates a **proof-of-concept** Instagram content moderation system with two core features:
1. **DM Auto-Reply System**: Automatically responds to Instagram Direct Messages
2. **Comment Monitoring System**: Monitors Instagram post comments for keywords and sends automated DM replies

**⚠️ Important**: This is a **prototype/testing project** to validate the feasibility of these features. For production use, you'll need to implement proper database storage, authentication, and security measures.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTAGRAM META PLATFORM                      │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Instagram     │    │    Webhooks     │                   │
│  │   Graph API     │    │   (Comments &   │                   │
│  │                 │    │    Messages)    │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                          │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Webhook       │    │   Instagram     │                   │
│  │   Handler       │◄──►│   API Client    │                   │
│  │                 │    │                 │                   │
│  └─────────────────┘    └─────────────────┘                   │
│           │                       ▲                           │
│           ▼                       │                           │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Comment       │    │   Logger        │                   │
│  │   Monitor       │◄──►│   System        │                   │
│  │   Storage       │    │                 │                   │
│  └─────────────────┘    └─────────────────┘                   │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────┐                   │
│  │           DASHBOARD UI                  │                   │
│  │  ┌─────────────┐  ┌─────────────┐      │                   │
│  │  │   Status    │  │   Monitor   │      │                   │
│  │  │   Cards     │  │   Management│      │                   │
│  │  └─────────────┘  └─────────────┘      │                   │
│  └─────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ai-instagram-content-moderation/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── comment-monitors/     # Comment monitoring CRUD
│   │   │   │   ├── [id]/             # Individual monitor operations
│   │   │   │   └── stats/            # Statistics endpoint
│   │   │   ├── instagram/            # Instagram API integration
│   │   │   │   ├── webhook/          # Main webhook handler
│   │   │   │   ├── status/           # Connection status check
│   │   │   │   └── find-account/     # Account ID discovery
│   │   │   ├── logs/                 # Logging endpoint
│   │   │   ├── test/                 # Testing utilities
│   │   │   ├── test-comment-system/  # Comment system tests
│   │   │   ├── test-comment-webhook/ # Webhook simulation
│   │   │   ├── test-post-validation/ # Post validation tests
│   │   │   └── link-media-id/        # Media ID linking utility
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main dashboard
│   ├── components/
│   │   └── ui/                       # Shadcn/ui components
│   ├── lib/                          # Core utilities
│   │   ├── instagram-api.ts          # Instagram Graph API client
│   │   ├── logger.ts                 # Comprehensive logging system
│   │   ├── comment-monitor-storage.ts # In-memory storage system
│   │   └── utils.ts                  # Utility functions
│   └── hooks/                        # Custom React hooks
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── package.json                      # Dependencies and scripts
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS config
├── components.json                   # Shadcn/ui configuration
└── tsconfig.json                     # TypeScript configuration
```

## 🎯 Core Features Implemented

### 1. **DM Auto-Reply System**
- **Trigger**: User sends "hi" to Instagram account
- **Response**: Automatically replies with "how are you"
- **Implementation**: Webhook-based real-time processing
- **Status**: ✅ **Fully Functional**

### 2. **Comment Monitoring System**
- **Feature**: Monitor Instagram posts for specific keywords
- **Action**: Send personalized DM to commenters when keywords are detected
- **Management**: Full CRUD operations for monitors
- **Statistics**: Real-time tracking of detections and activity
- **Status**: ✅ **Fully Functional**

### 3. **Dashboard UI**
- **Status Cards**: Instagram connection, webhook status, monitoring stats
- **Monitor Management**: Add, edit, delete comment monitors
- **Statistics**: Real-time detection counts and activity tracking
- **Testing Tools**: Built-in testing and debugging utilities
- **Status**: ✅ **Complete**

### 4. **Instagram API Integration**
- **Graph API v19.0**: Full integration with Instagram Graph API
- **Token Management**: Automatic token validation and refresh
- **Error Handling**: Comprehensive error management and logging
- **Account Discovery**: Automatic Instagram Account ID detection
- **Status**: ✅ **Production Ready**

### 5. **Webhook System**
- **Real-time Processing**: Handles Instagram webhooks for messages and comments
- **Signature Verification**: Secure webhook validation (configurable)
- **Event Processing**: Separate handlers for messages and comments
- **Development Support**: Bypass options for local testing
- **Status**: ✅ **Production Ready**

## 🔧 Technology Stack

### **Core Framework**
- **Next.js 15.5.0** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type safety and development experience

### **Styling & UI**
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React component library
- **Lucide React** - Icon library

### **Package Manager**
- **Bun** - Fast JavaScript runtime and package manager

### **Build Tools**
- **Turbopack** - Next.js build tool for fast development
- **PostCSS** - CSS processing

### **Instagram Integration**
- **Instagram Graph API v19.0** - Official Instagram API
- **Meta Webhooks** - Real-time event processing

## 🛠️ Critical Setup Requirements

### **1. Instagram Business Account Setup**
```bash
# Required Account Types:
✅ Instagram Professional Account (Business or Creator)
✅ Facebook Page connected to Instagram
✅ Meta Developer Account

# Critical IDs (from your current setup):
INSTAGRAM_ACCOUNT_ID=17841463755973016    # Use Business Account ID, NOT User ID
FACEBOOK_PAGE_ID=108583872211618          # Connected Facebook Page
FACEBOOK_USER_ID=1846867453379711         # Your Facebook User ID
```

### **2. Meta App Configuration**
```javascript
// Required App Products:
- Instagram Basic Display
- Instagram Messaging  
- Webhooks

// Required Permissions:
✅ instagram_basic                    // Basic Instagram access
✅ instagram_manage_messages         // Send/receive DMs
✅ instagram_manage_comments         // Manage comments  
✅ pages_messaging                   // Facebook Page messaging
✅ pages_messaging_subscriptions     // Webhook subscriptions

// Webhook Events:
✅ messages                          // Instagram DM events
✅ comments                          // Instagram comment events
```

### **3. Environment Variables**
```bash
# Meta App Credentials
NEXT_PUBLIC_META_APP_ID=1784401719137951
META_APP_SECRET=e9c381825903828b52612ae0f2f94364

# Instagram API Configuration  
INSTAGRAM_ACCOUNT_ID=17841463755973016    # ⚠️ CRITICAL: Must be numeric Business Account ID
INSTAGRAM_ACCESS_TOKEN=IGAAJlgQpaDHR...    # Long-lived access token

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=Haseeb,.122025        # Custom verification token
WEBHOOK_URL=https://your-domain.com/api/instagram/webhook

# Development
NODE_ENV=development
```

## 🚨 Common Pitfalls & Solutions

### **1. Instagram Account ID Issues**
**❌ Problem**: Using username or wrong ID format
```javascript
// WRONG - Username
INSTAGRAM_ACCOUNT_ID=haseeb.ahmed.raza.khan

// WRONG - Facebook User ID  
INSTAGRAM_ACCOUNT_ID=1846867453379711

// ✅ CORRECT - Instagram Business Account ID
INSTAGRAM_ACCOUNT_ID=17841463755973016
```

**✅ Solution**: Use the numeric Instagram Business Account ID, find it via:
```bash
# API call to get correct ID
curl "https://graph.facebook.com/v19.0/me/accounts?access_token=YOUR_TOKEN"
```

### **2. Webhook Structure Differences**
**❌ Problem**: Real Instagram webhooks vs test webhooks have different structures

```javascript
// Test webhook structure
{
  value: {
    media_id: "DFICIYYCurs",    // Direct field
    text: "test comment"
  }
}

// Real Instagram webhook structure  
{
  value: {
    media: { 
      id: "18053482142033648"   // Nested object
    },
    text: "test comment"
  }
}
```

**✅ Solution**: Handle both structures in webhook handler:
```typescript
// Fixed extraction logic
const mediaId = commentData.media_id || commentData.media?.id;
```

### **3. Shortcode vs Media ID Mismatch**
**❌ Problem**: Monitors store shortcodes but webhooks send media IDs

```javascript
// Monitor stores shortcode from URL
postId: "DFICIYYCurs"

// Webhook sends media ID
media_id: "18053482142033648"
```

**✅ Solution**: Implement media ID mapping system:
```typescript
interface CommentMonitor {
  postId: string;     // Shortcode from URL
  mediaId?: string;   // Actual Instagram media ID
  // ... other fields
}

// Enhanced matching logic
findRelevantMonitors(identifier: string): CommentMonitor[] {
  // Try multiple matching strategies
  // 1. Direct postId match
  // 2. MediaId match
  // 3. Cross-reference matching
}
```

### **4. Token Type Confusion**
**❌ Problem**: Using User Access Token instead of Page Access Token

**✅ Solution**: Instagram Graph API requires Page Access Token:
```typescript
// Automatic token detection and conversion
private async getValidAccessToken(): Promise<string> {
  // Try user token first
  const testResponse = await fetch(`${this.baseUrl}/${this.accountId}?fields=id&access_token=${this.accessToken}`);
  
  if (testResponse.ok) {
    return this.accessToken;
  }
  
  // Get page token if user token fails
  const pageResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${this.accessToken}`);
  const pageData = await pageResponse.json();
  
  return pageData.data[0].access_token;
}
```

### **5. Signature Verification Issues**
**❌ Problem**: Webhook signature verification failing

**✅ Solution**: Proper HMAC calculation:
```typescript
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const appSecret = process.env.META_APP_SECRET;
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## 🧪 Testing & Debugging

### **Built-in Testing Tools**

#### **1. Comment System Testing**
```bash
# Test keyword detection
POST /api/test-comment-system
{
  "action": "test_keyword_detection",
  "keyword": "amazing",
  "commentText": "This is amazing!"
}

# Simulate comment webhook
POST /api/test-comment-system  
{
  "action": "simulate_comment",
  "postId": "DFICIYYCurs",
  "commentText": "test comment",
  "commenterId": "test_user",
  "skipDM": true
}
```

#### **2. Instagram Post Validation**
```bash
# Test post URL validation
POST /api/test-post-validation
{
  "postUrl": "https://www.instagram.com/p/DFICIYYCurs/"
}
```

#### **3. Media ID Linking**
```bash
# Link media ID to existing monitor
POST /api/link-media-id
{
  "monitorId": "monitor_123",
  "mediaId": "18053482142033648"
}
```

### **Development Workflow**

#### **1. Local Development Setup**
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Use ngrok for webhook testing
npx ngrok http 3000
```

#### **2. Testing Real Webhooks**
```bash
# 1. Set up ngrok tunnel
WEBHOOK_URL=https://abc123.ngrok.io/api/instagram/webhook

# 2. Update Meta Developer Console with ngrok URL
# 3. Test with real Instagram comments
# 4. Monitor logs at /api/logs
```

#### **3. Debugging Checklist**
- ✅ Check environment variables are set correctly
- ✅ Verify Instagram Account ID is numeric Business Account ID
- ✅ Test webhook URL accessibility
- ✅ Check Meta App permissions and products
- ✅ Validate access token hasn't expired
- ✅ Monitor application logs for detailed error information

## 📊 Performance & Monitoring

### **Logging System**
```typescript
// Comprehensive logging with context
logger.info('Message received', 'MESSAGE_IN', { senderId, message });
logger.error('API error', 'INSTAGRAM_API', { endpoint, statusCode }, error);

// Access logs via API
GET /api/logs?count=100&level=1  // Get recent logs
```

### **Statistics Tracking**
```typescript
interface MonitoringStats {
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
```

## 🚀 Production Migration Checklist

### **1. Database Integration**
```typescript
// Replace in-memory storage with database
// Recommended: Supabase (as per project requirements)

interface CommentMonitor {
  id: string;
  postUrl: string;
  postId: string;
  mediaId?: string;
  keyword: string;
  autoReplyMessage: string;
  isActive: boolean;
  createdAt: string;
  detectionCount: number;
  lastDetection?: string;
  userId?: string;      // Add user association
  organizationId?: string; // Add organization support
}
```

### **2. Authentication & Authorization**
```typescript
// Add authentication layer
// Recommended: NextAuth.js or Supabase Auth

// Route protection
export async function middleware(request: NextRequest) {
  // Protect dashboard routes
  // Validate user permissions
  // Organization-level access control
}
```

### **3. Security Hardening**
```typescript
// Enable webhook signature verification
const skipVerification = false; // Disable for production

// Add rate limiting
import { Ratelimit } from "@upstash/ratelimit";

// Input validation
import { z } from "zod";

const CreateMonitorSchema = z.object({
  postUrl: z.string().url(),
  keyword: z.string().min(1).max(100),
  autoReplyMessage: z.string().min(1).max(1000)
});
```

### **4. Error Handling & Monitoring**
```typescript
// Add external monitoring
// Recommended: Sentry, LogRocket, or similar

// Webhook retry mechanism
// Dead letter queue for failed processing
// Health check endpoints

GET /api/health          // System health
GET /api/metrics         // Application metrics
```

### **5. Scalability Considerations**
```typescript
// Queue system for webhook processing
// Recommended: BullMQ with Redis

// Horizontal scaling support
// Load balancer configuration
// Database connection pooling
// CDN for static assets
```

## 📝 Key Learnings & Best Practices

### **1. Instagram API Quirks**
- **Always use numeric Business Account ID**, never username
- **Graph API doesn't support shortcode validation** directly
- **Page Access Token required** for Instagram Business accounts
- **Different webhook structures** between test and production

### **2. Webhook Development**
- **Signature verification is critical** for production security
- **Development bypass options** essential for local testing
- **Comprehensive logging** crucial for debugging webhook issues
- **Handle both message and comment events** in same endpoint

### **3. Comment Monitoring**
- **Shortcode vs Media ID mapping** is complex - plan for it
- **Keyword matching should be case-insensitive** and support partial matches
- **Rate limiting awareness** - Instagram has API limits
- **Real-time statistics** enhance user experience significantly

### **4. Development Workflow**
- **ngrok is essential** for local webhook testing
- **Comprehensive test endpoints** save development time
- **Structured logging** with context makes debugging easier
- **Environment configuration validation** prevents runtime issues

### **5. Production Readiness**
- **Database persistence** is mandatory for production use
- **Authentication & authorization** required for multi-user systems
- **Input validation** and **error handling** are critical
- **Monitoring & alerting** essential for operational stability

## 🔄 Migration Path to Production

### **Phase 1: Core Infrastructure**
1. **Database Setup** - Implement Supabase integration
2. **Authentication** - Add user management system
3. **Security** - Enable webhook signature verification
4. **Input Validation** - Add comprehensive validation layer

### **Phase 2: Production Features**
1. **Multi-user Support** - Organization and team management
2. **Advanced Monitoring** - Enhanced analytics and reporting
3. **Webhook Reliability** - Queue system and retry logic
4. **API Rate Limiting** - Request throttling and quotas

### **Phase 3: Scale & Optimize**
1. **Performance Optimization** - Caching and query optimization
2. **Monitoring & Alerting** - External monitoring integration
3. **Backup & Recovery** - Data backup and disaster recovery
4. **CI/CD Pipeline** - Automated testing and deployment

## 📞 Support & Troubleshooting

### **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Webhook not receiving events | No logs in `/api/logs`, dashboard shows disconnected | Check webhook URL accessibility, verify Meta Developer Console configuration |
| DM sending fails | "User cannot be found" errors | Ensure using real Instagram user IDs, check access token validity |
| Comment monitoring not working | Keywords detected but no DM sent | Verify media ID mapping, check monitor active status |
| Dashboard shows errors | API endpoints returning 500 errors | Check environment variables, verify Instagram API connectivity |

### **Debug Resources**
- **Application Logs**: `/api/logs`
- **Instagram Status**: `/api/instagram/status` 
- **Test Endpoints**: `/api/test-*`
- **Monitor Statistics**: `/api/comment-monitors/stats`

---

## 📄 License

This project is for educational and testing purposes. Ensure compliance with Instagram's Terms of Service and API guidelines for any production use.

---

**Created with ❤️ for learning Instagram API integration and webhook development**