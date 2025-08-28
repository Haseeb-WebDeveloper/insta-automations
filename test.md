sequenceDiagram
    participant Dev as Developer
    participant Meta as Meta Developer Console
    participant YourApp as Your Next.js App
    participant Instagram as Instagram Platform
    
    Note over Dev, Instagram: Initial Setup Phase
    Dev->>Meta: 1. Create Meta App
    Dev->>Meta: 2. Configure Instagram Basic Display/Messaging
    Dev->>Meta: 3. Set Webhook URL: https://yourapp.com/api/instagram/webhook
    Dev->>Meta: 4. Set Verify Token: "your_secret_token"
    Dev->>Meta: 5. Subscribe to Events: ["messages", "comments"]
    
    Note over Meta, YourApp: Verification Phase
    Meta->>YourApp: GET /api/instagram/webhook?hub.mode=subscribe&hub.verify_token=your_secret_token&hub.challenge=random_string
    YourApp->>YourApp: Verify token matches
    YourApp->>Meta: Return hub.challenge (proves you own the endpoint)
    Meta->>Meta: ✅ Webhook verified and activated
    
    Note over Meta, Instagram: Runtime Phase
    Instagram->>Meta: User sends DM or comments
    Meta->>YourApp: POST /api/instagram/webhook (with event data)