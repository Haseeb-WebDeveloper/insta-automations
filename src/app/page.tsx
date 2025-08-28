"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  Webhook,
  Instagram,
  Eye,
  Plus,
  Trash2,
  BarChart3,
  Clock,
  Target,
} from "lucide-react";

interface WebhookStatus {
  isConfigured: boolean;
  lastActivity: string | null;
  messageCount: number;
  status: "connected" | "disconnected" | "error";
}

interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  isValid: boolean;
}

interface CommentMonitor {
  id: string;
  postUrl: string;
  postId: string;
  keyword: string;
  autoReplyMessage: string;
  isActive: boolean;
  createdAt: string;
  detectionCount: number;
  lastDetection?: string;
}

interface MonitoringStats {
  totalMonitors: number;
  activeMonitors: number;
  totalDetections: number;
  todayDetections: number;
}

export default function HomePage() {
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>({
    isConfigured: false,
    lastActivity: null,
    messageCount: 0,
    status: "disconnected",
  });

  const [accountInfo, setAccountInfo] = useState<InstagramAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState("");

  // Comment monitoring state
  const [monitors, setMonitors] = useState<CommentMonitor[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    totalMonitors: 0,
    activeMonitors: 0,
    totalDetections: 0,
    todayDetections: 0,
  });
  const [newMonitor, setNewMonitor] = useState({
    postUrl: "",
    keyword: "",
    autoReplyMessage:
      'Hi! You commented "[keyword]" on my post. Thanks for engaging with my content!',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check Instagram API status
  const checkInstagramStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/instagram/status");
      const data = await response.json();

      if (response.ok) {
        setAccountInfo(data.account);
        setWebhookStatus(data.webhook);
      } else {
        setError(data.error || "Failed to check Instagram status");
      }
    } catch (err) {
      setError("Network error: Could not check Instagram status");
    } finally {
      setIsLoading(false);
    }
  };

  // Find Instagram Account ID
  // const findAccountId = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch("/api/instagram/find-account");
  //     const data = await response.json();

  //     if (response.ok) {
  //       console.log("Account data:", data);

  //       // Show the results in an alert or modal
  //       const instagramId = data.instagramMe?.id;
  //       if (instagramId) {
  //         alert(
  //           `Found your Instagram Account ID: ${instagramId}\n\nPlease update your .env.local file:\nINSTAGRAM_ACCOUNT_ID=${instagramId}`
  //         );
  //       } else {
  //         alert(
  //           "Could not find Instagram Account ID. Check the console for more details."
  //         );
  //       }
  //     } else {
  //       alert(`Error: ${data.error}`);
  //     }
  //   } catch (err) {
  //     alert("Network error: Could not find account ID");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Send test message
  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/instagram/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Test message sent successfully!");
        setTestMessage("");
      } else {
        alert(`Failed to send test message: ${data.error}`);
      }
    } catch (err) {
      alert("Network error: Could not send test message");
    } finally {
      setIsLoading(false);
    }
  };

  // Load comment monitors
  const loadMonitors = async () => {
    try {
      const response = await fetch("/api/comment-monitors");
      if (response.ok) {
        const data = await response.json();
        setMonitors(data.monitors || []);
      }
    } catch (err) {
      console.error("Failed to load monitors:", err);
    }
  };

  // Load monitoring statistics
  const loadStats = async () => {
    try {
      const response = await fetch("/api/comment-monitors/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  // Validate Instagram post URL
  const validatePostUrl = (
    url: string
  ): { isValid: boolean; postId?: string; error?: string } => {
    const instagramPostRegex =
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/;
    const match = url.match(instagramPostRegex);

    if (!match) {
      return {
        isValid: false,
        error: "Please enter a valid Instagram post URL",
      };
    }

    return { isValid: true, postId: match[1] };
  };

  // Add new comment monitor
  const addMonitor = async () => {
    setFormError(null);
    setIsSubmitting(true);

    // Validate inputs
    if (!newMonitor.postUrl.trim()) {
      setFormError("Post URL is required");
      setIsSubmitting(false);
      return;
    }

    if (!newMonitor.keyword.trim()) {
      setFormError("Keyword is required");
      setIsSubmitting(false);
      return;
    }

    const urlValidation = validatePostUrl(newMonitor.postUrl);
    if (!urlValidation.isValid) {
      setFormError(urlValidation.error || "Invalid URL");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/comment-monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: newMonitor.postUrl.trim(),
          keyword: newMonitor.keyword.trim(),
          autoReplyMessage: newMonitor.autoReplyMessage.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewMonitor({
          postUrl: "",
          keyword: "",
          autoReplyMessage:
            'Hi! You commented "[keyword]" on my post. Thanks for engaging with my content!',
        });
        await loadMonitors();
        await loadStats();
      } else {
        setFormError(data.error || "Failed to add monitor");
      }
    } catch (err) {
      setFormError("Network error: Could not add monitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle monitor active status
  const toggleMonitor = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/comment-monitors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        await loadMonitors();
        await loadStats();
      }
    } catch (err) {
      console.error("Failed to toggle monitor:", err);
    }
  };

  // Delete monitor
  const deleteMonitor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;

    try {
      const response = await fetch(`/api/comment-monitors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadMonitors();
        await loadStats();
      }
    } catch (err) {
      console.error("Failed to delete monitor:", err);
    }
  };

  useEffect(() => {
    checkInstagramStatus();
    loadMonitors();
    loadStats();

    // Refresh status and stats every 30 seconds
    const interval = setInterval(() => {
      checkInstagramStatus();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
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
            Monitor and manage Instagram Direct Messages with AI-powered
            automation
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
              <CardTitle className="text-sm font-medium">
                Instagram Account
              </CardTitle>
              <Instagram className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              {accountInfo ? (
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {accountInfo.username}
                  </div>
                  <p className="text-xs text-gray-500">{accountInfo.name}</p>
                  <Badge
                    variant={accountInfo.isValid ? "default" : "destructive"}
                  >
                    {accountInfo.isValid ? "Connected" : "Invalid Token"}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-400">
                    Not Connected
                  </div>
                  <p className="text-xs text-gray-500">
                    No account information
                  </p>
                  <Badge variant="outline">Disconnected</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Webhook Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Webhook Status
              </CardTitle>
              <Webhook className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      webhookStatus.status
                    )}`}
                  ></div>
                  <span className="text-2xl font-bold capitalize">
                    {webhookStatus.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {webhookStatus.lastActivity
                    ? `Last activity: ${new Date(
                        webhookStatus.lastActivity
                      ).toLocaleString()}`
                    : "No recent activity"}
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
                <p className="text-xs text-gray-500">
                  Responding to "hi" with "how are you"
                </p>
                <Badge variant="default">Enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comment Monitoring Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Comment Monitoring
            </h2>
            <p className="text-gray-600">
              Monitor Instagram posts for specific keywords and automatically send DMs to commenters
            </p>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMonitors}</div>
                <p className="text-xs text-gray-500">Configured monitors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Monitors</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeMonitors}</div>
                <p className="text-xs text-gray-500">Currently monitoring</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalDetections}</div>
                <p className="text-xs text-gray-500">Keywords detected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.todayDetections}</div>
                <p className="text-xs text-gray-500">Detections today</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Monitor Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Comment Monitor
              </CardTitle>
              <CardDescription>
                Monitor an Instagram post for specific keywords and automatically send DMs to commenters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postUrl">Instagram Post URL</Label>
                  <Input
                    id="postUrl"
                    placeholder="https://www.instagram.com/p/ABC123/"
                    value={newMonitor.postUrl}
                    onChange={(e) => setNewMonitor({ ...newMonitor, postUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Copy the full URL of the Instagram post you want to monitor
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword">Target Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="giveaway"
                    value={newMonitor.keyword}
                    onChange={(e) => setNewMonitor({ ...newMonitor, keyword: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Keyword to detect in comments (case-insensitive)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoReplyMessage">Auto-Reply Message (Optional)</Label>
                <Textarea
                  id="autoReplyMessage"
                  placeholder="Hi! You commented '[keyword]' on my post. Thanks for engaging!"
                  value={newMonitor.autoReplyMessage}
                  onChange={(e) => setNewMonitor({ ...newMonitor, autoReplyMessage: e.target.value })}
                  disabled={isSubmitting}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Use [keyword] to include the detected keyword in your message
                </p>
              </div>

              <Button 
                onClick={addMonitor}
                disabled={isSubmitting || !newMonitor.postUrl.trim() || !newMonitor.keyword.trim()}
                className="w-full md:w-auto"
              >
                {isSubmitting ? 'Adding Monitor...' : 'Add Monitor'}
              </Button>
            </CardContent>
          </Card>

          {/* Active Monitors List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Active Monitors
                <Badge variant="outline">{monitors.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage your comment monitoring configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monitors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No monitors configured yet</p>
                  <p className="text-sm">Add your first monitor above to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Detections</TableHead>
                        <TableHead>Last Detection</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monitors.map((monitor) => (
                        <TableRow key={monitor.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <a 
                                href={monitor.postUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                /p/{monitor.postId}
                              </a>
                              <p className="text-xs text-gray-500">
                                Added {new Date(monitor.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{monitor.keyword}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                monitor.isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className={`text-sm ${
                                monitor.isActive ? 'text-green-700' : 'text-gray-500'
                              }`}>
                                {monitor.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-semibold">{monitor.detectionCount}</span>
                              <span className="text-gray-500"> times</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {monitor.lastDetection 
                                ? new Date(monitor.lastDetection).toLocaleDateString()
                                : 'Never'
                              }
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleMonitor(monitor.id, !monitor.isActive)}
                              >
                                {monitor.isActive ? 'Pause' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteMonitor(monitor.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Instructions
            </CardTitle>
            <CardDescription>
              How to set up and use the AI Instagram Content Moderation tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">1. Connect Instagram Account</h3>
              <p className="text-gray-600">
                Ensure your Instagram account is connected by clicking the "Find Account ID" button and updating your <code>.env.local</code> file with the provided ID.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">2. Configure Webhook</h3>
              <p className="text-gray-600">
                Set up a webhook to receive Instagram notifications by configuring your Instagram app settings.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">3. Add Comment Monitors</h3>
              <p className="text-gray-600">
                Use the form above to add monitors for specific Instagram posts and keywords. The tool will automatically send DMs to commenters when the keyword is detected.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold">4. Monitor and Manage</h3>
              <p className="text-gray-600">
                View and manage your active monitors, check statistics, and pause or delete monitors as needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
