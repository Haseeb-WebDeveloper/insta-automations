'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, MessageCircle, Send, Webhook, Instagram } from 'lucide-react';

interface WebhookStatus {
  isConfigured: boolean;
  lastActivity: string | null;
  messageCount: number;
  status: 'connected' | 'disconnected' | 'error';
}

interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  isValid: boolean;
}

export default function HomePage() {
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>({
    isConfigured: false,
    lastActivity: null,
    messageCount: 0,
    status: 'disconnected'
  });
  
  const [accountInfo, setAccountInfo] = useState<InstagramAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');

  // Check Instagram API status
  const checkInstagramStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/instagram/status');
      const data = await response.json();
      
      if (response.ok) {
        setAccountInfo(data.account);
        setWebhookStatus(data.webhook);
      } else {
        setError(data.error || 'Failed to check Instagram status');
      }
    } catch (err) {
      setError('Network error: Could not check Instagram status');
    } finally {
      setIsLoading(false);
    }
  };

  // Find Instagram Account ID
  const findAccountId = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/instagram/find-account');
      const data = await response.json();
      
      if (response.ok) {
        console.log('Account data:', data);
        
        // Show the results in an alert or modal
        const instagramId = data.instagramMe?.id;
        if (instagramId) {
          alert(`Found your Instagram Account ID: ${instagramId}\n\nPlease update your .env.local file:\nINSTAGRAM_ACCOUNT_ID=${instagramId}`);
        } else {
          alert('Could not find Instagram Account ID. Check the console for more details.');
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Network error: Could not find account ID');
    } finally {
      setIsLoading(false);
    }
  };

  // Send test message
  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/instagram/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Test message sent successfully!');
        setTestMessage('');
      } else {
        alert(`Failed to send test message: ${data.error}`);
      }
    } catch (err) {
      alert('Network error: Could not send test message');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkInstagramStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(checkInstagramStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Instagram className="h-8 w-8 text-pink-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Instagram Content Moderation
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Monitor and manage Instagram Direct Messages with AI-powered automation
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Instagram Account Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instagram Account</CardTitle>
              <Instagram className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              {accountInfo ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{accountInfo.username}</div>
                  <p className="text-xs text-gray-500">{accountInfo.name}</p>
                  <Badge variant={accountInfo.isValid ? 'default' : 'destructive'}>
                    {accountInfo.isValid ? 'Connected' : 'Invalid Token'}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-400">Not Connected</div>
                  <p className="text-xs text-gray-500">No account information</p>
                  <Badge variant="outline">Disconnected</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Webhook Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Webhook Status</CardTitle>
              <Webhook className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(webhookStatus.status)}`}></div>
                  <span className="text-2xl font-bold capitalize">{webhookStatus.status}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {webhookStatus.lastActivity 
                    ? `Last activity: ${new Date(webhookStatus.lastActivity).toLocaleString()}`
                    : 'No recent activity'
                  }
                </p>
                <Badge variant="outline">
                  {webhookStatus.messageCount} messages processed
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Auto Reply Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto Reply</CardTitle>
              <Send className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-gray-500">Responding to "hi" with "how are you"</p>
                <Badge variant="default">Enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Setup Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to configure your Instagram DM auto-reply system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">1. Environment Configuration</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Copy .env.local.example to .env.local</li>
                  <li>• Set your Meta App ID and Secret</li>
                  <li>• Add your Instagram Access Token</li>
                  <li>• Configure webhook verify token</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">2. Meta Developer Setup</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create a Meta App in Developer Console</li>
                  <li>• Add Instagram Messaging Product</li>
                  <li>• Configure webhook URL: /api/instagram/webhook</li>
                  <li>• Subscribe to messaging events</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={checkInstagramStatus}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Checking...' : 'Refresh Status'}
                </Button>
                
                <Button 
                  onClick={findAccountId}
                  disabled={isLoading}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  {isLoading ? 'Finding...' : 'Find Account ID'}
                </Button>
                
                <Button 
                  onClick={() => window.open('/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=Haseeb,.122025&hub.challenge=test', '_blank')}
                  variant="outline"
                >
                  Test Webhook
                </Button>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Common Issue:</strong> If you see "Not Connected", your Instagram Account ID might be incorrect. 
                  Click "Find Account ID" to get the correct numeric ID.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook URL Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Webhook URL</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border font-mono text-sm">
                  {typeof window !== 'undefined' ? 
                    `${window.location.origin}/api/instagram/webhook` : 
                    'https://your-domain.com/api/instagram/webhook'
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this URL in your Meta App webhook configuration
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Subscribed Events</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="outline">messages</Badge>
                  <Badge variant="outline">messaging_seen</Badge>
                  <Badge variant="outline">messaging_deliveries</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
