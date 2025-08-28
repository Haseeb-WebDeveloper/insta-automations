"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Activity,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([checkInstagramStatus(), loadMonitors(), loadStats()]);
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/10">
                  <Instagram className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Instagram Moderation</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="h-8"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <div className="flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    webhookStatus.status === "connected"
                      ? "bg-green-500"
                      : webhookStatus.status === "error"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm  capitalize">
                  {webhookStatus.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02]">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium ">Total Monitors</div>
              <div className="rounded-full bg-blue-100 p-2">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats.totalMonitors
                )}
              </div>
              <p className="text-xs mt-1">Configured monitors</p>
            </div>
          </div>

          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02]">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium ">Active Now</div>
              <div className="rounded-full bg-green-100 p-2">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats.activeMonitors
                )}
              </div>
              <p className="text-xs mt-1">Currently monitoring</p>
            </div>
          </div>

          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02]">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium ">Total Detections</div>
              <div className="rounded-full bg-purple-100 p-2">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats.totalDetections
                )}
              </div>
              <p className="text-xs mt-1">Keywords detected</p>
            </div>
          </div>

          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02]">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium ">Today's Activity</div>
              <div className="rounded-full bg-orange-100 p-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  stats.todayDetections
                )}
              </div>
              <p className="text-xs mt-1">Detections today</p>
            </div>
          </div>
        </div>

        {/* System Status Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Instagram Account Status */}
          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02] space-y-4">
            <div className="flex items-center text-lg">
              <Instagram className="h-5 w-5 mr-2 text-pink-500" />
              Instagram Account
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ) : accountInfo ? (
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold">@{accountInfo.username}</div>
                    <div className="text-sm">{accountInfo.name}</div>
                  </div>
                  <Badge
                    variant={accountInfo.isValid ? "default" : "destructive"}
                    className="w-fit"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {accountInfo.isValid ? "Connected" : "Invalid Token"}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-slate-500">Not Connected</div>
                  <Badge variant="outline" className="w-fit">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Webhook Status */}
          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02] space-y-3">
            <div className="flex items-center text-lg">
              <Webhook className="h-5 w-5 mr-2 text-blue-500" />
              Webhook Status
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        webhookStatus.status === "connected"
                          ? "bg-green-500"
                          : webhookStatus.status === "error"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className="font-semibold capitalize">
                      {webhookStatus.status}
                    </span>
                  </div>
                  <div className="text-sm">
                    {webhookStatus.lastActivity
                      ? `Last activity: ${new Date(
                          webhookStatus.lastActivity
                        ).toLocaleString()}`
                      : "No recent activity"}
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {webhookStatus.messageCount} messages
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Auto Reply Status */}
          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02] space-y-3">
            <div>
              <div className="flex items-center text-lg">
                <MessageCircle className="h-5 w-5 mr-2 text-green-500" />
                Auto Reply
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="font-semibold">Active</div>
                <div className="text-sm">
                  Monitoring comments and sending DMs
                </div>
                <Badge className="w-fit bg-green-100 text-green-700 hover:bg-green-100">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comment Monitoring Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Comment Monitoring</h2>
            <p className="">
              Monitor Instagram posts for specific keywords and automatically
              send DMs to commenters
            </p>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Statistics divs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Total Monitors</div>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalMonitors}</div>
                <p className="text-xs text-gray-500">Configured monitors</p>
              </div>
            </div>

            <div>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Active Monitors</div>
                <Target className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeMonitors}
                </div>
                <p className="text-xs text-gray-500">Currently monitoring</p>
              </div>
            </div>

            <div>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Total Detections</div>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalDetections}
                </div>
                <p className="text-xs text-gray-500">Keywords detected</p>
              </div>
            </div>

            <div>
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Today's Activity</div>
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.todayDetections}
                </div>
                <p className="text-xs text-gray-500">Detections today</p>
              </div>
            </div>
          </div>

          {/* Add Monitor Form */}
          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02] space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Comment Monitor
              </div>
              <p className="text-sm text-foreground">
                Monitor an Instagram post for specific keywords and
                automatically send DMs to commenters
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postUrl" className="text-sm font-medium">
                    Instagram Post URL
                  </Label>
                  <Input
                    id="postUrl"
                    placeholder="https://www.instagram.com/p/ABC123/"
                    value={newMonitor.postUrl}
                    onChange={(e) =>
                      setNewMonitor({ ...newMonitor, postUrl: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-foreground">
                    Copy the full URL of the Instagram post you want to monitor
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword" className="text-sm font-medium">
                    Target Keyword
                  </Label>
                  <Input
                    id="keyword"
                    placeholder="giveaway"
                    value={newMonitor.keyword}
                    onChange={(e) =>
                      setNewMonitor({ ...newMonitor, keyword: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-foreground">
                    Keyword to detect in comments (case-insensitive)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="autoReplyMessage"
                  className="text-sm font-medium"
                >
                  Auto-Reply Message (Optional)
                </Label>
                <Textarea
                  id="autoReplyMessage"
                  placeholder="Hi! You commented '[keyword]' on my post. Thanks for engaging!"
                  value={newMonitor.autoReplyMessage}
                  onChange={(e) =>
                    setNewMonitor({
                      ...newMonitor,
                      autoReplyMessage: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                  rows={3}
                  className="focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-foreground">
                  Use [keyword] to include the detected keyword in your message
                </p>
              </div>

              <Button
                onClick={addMonitor}
                disabled={
                  isSubmitting ||
                  !newMonitor.postUrl.trim() ||
                  !newMonitor.keyword.trim()
                }
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding Monitor...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Monitor
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Active Monitors List */}
          <div className="border py-4 px-5 shadow-none bg-foreground/[0.02]">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center text-lg">
                    <Eye className="h-5 w-5 mr-2" />
                    Active Monitors
                  </div>
                  <p>Manage your comment monitoring configurations</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {monitors.length} monitors
                </Badge>
              </div>
            </div>
            <div>
              {monitors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                    <Eye className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No monitors configured
                  </h3>
                  <p className="mt-2 text-sm">
                    Add your first monitor above to get started with automated
                    comment monitoring
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold">Post</TableHead>
                        <TableHead className="font-semibold">Keyword</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">
                          Detections
                        </TableHead>
                        <TableHead className="font-semibold">
                          Last Activity
                        </TableHead>
                        <TableHead className="font-semibold text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monitors.map((monitor) => (
                        <TableRow
                          key={monitor.id}
                          className="hover:bg-slate-50/50"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <a
                                href={monitor.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                /p/{monitor.postId}
                              </a>
                              <p className="text-xs">
                                Added{" "}
                                {new Date(
                                  monitor.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {monitor.keyword}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  monitor.isActive
                                    ? "bg-green-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  monitor.isActive
                                    ? "text-green-700"
                                    : "text-slate-500"
                                }`}
                              >
                                {monitor.isActive ? "Active" : "Paused"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="font-semibold">
                                {monitor.detectionCount}
                              </span>
                              <span className="ml-1">detections</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {monitor.lastDetection
                                ? new Date(
                                    monitor.lastDetection
                                  ).toLocaleDateString()
                                : "Never"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toggleMonitor(monitor.id, !monitor.isActive)
                                }
                                className="h-8"
                              >
                                {monitor.isActive ? (
                                  <>
                                    <PauseCircle className="h-3 w-3 mr-1" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    Resume
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteMonitor(monitor.id)}
                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
