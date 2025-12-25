import { useQuery, useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  ListTodo,
  Clock,
  Check,
  X,
  Shield,
  Image,
  Trash2,
  Plus,
  Loader2,
  Settings,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminStats, Transaction, Banner, AppSettings } from "@shared/schema";
import { useState, useEffect } from "react";
import { Redirect } from "wouter";

async function adminApiRequest(
  method: string,
  url: string,
  userId: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

export default function Admin() {
  const { user, language } = useApp();
  const { toast } = useToast();

  const adminQueryFn = async (url: string) => {
    if (!user?.id) throw new Error("Not authenticated");
    const res = await fetch(url, {
      headers: { "x-user-id": user.id },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  };

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => adminQueryFn("/api/admin/stats"),
    enabled: !!user?.isAdmin,
  });

  const { data: pendingDeposits, isLoading: depositsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/pending-deposits"],
    queryFn: () => adminQueryFn("/api/admin/pending-deposits"),
    enabled: !!user?.isAdmin,
  });

  const { data: pendingWithdrawals, isLoading: withdrawalsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/pending-withdrawals"],
    queryFn: () => adminQueryFn("/api/admin/pending-withdrawals"),
    enabled: !!user?.isAdmin,
  });

  const { data: bannersList, isLoading: bannersLoading } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
    queryFn: () => adminQueryFn("/api/admin/banners"),
    enabled: !!user?.isAdmin,
  });

  const { data: appSettings, isLoading: settingsLoading } = useQuery<AppSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: () => adminQueryFn("/api/admin/settings"),
    enabled: !!user?.isAdmin,
  });

  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerCaption, setBannerCaption] = useState("");
  const [bannerRedirectLink, setBannerRedirectLink] = useState("");

  const [referralBonus, setReferralBonus] = useState<string>("5");
  const [minWithdraw, setMinWithdraw] = useState<string>("50");
  const [minDeposit, setMinDeposit] = useState<string>("10");
  const [dailyReward, setDailyReward] = useState<string>("1");

  useEffect(() => {
    if (appSettings) {
      setReferralBonus(String(appSettings.referralBonusAmount));
      setMinWithdraw(String(appSettings.minWithdrawAmount));
      setMinDeposit(String(appSettings.minDepositAmount));
      setDailyReward(String(appSettings.dailyCheckinReward));
    }
  }, [appSettings]);

  const createBannerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await adminApiRequest("POST", "/api/admin/banners", user.id, {
        imageUrl: bannerImageUrl,
        caption: bannerCaption,
        redirectLink: bannerRedirectLink,
      });
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("heavy");
      toast({ title: t("success", language), description: "Banner created" });
      setBannerImageUrl("");
      setBannerCaption("");
      setBannerRedirectLink("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
    },
    onError: (error) => {
      toast({ title: t("error", language), description: error.message, variant: "destructive" });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete banner");
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("medium");
      toast({ title: t("success", language), description: "Banner deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await adminApiRequest("PUT", "/api/admin/settings", user.id, {
        referralBonusAmount: parseFloat(referralBonus),
        minWithdrawAmount: parseFloat(minWithdraw),
        minDepositAmount: parseFloat(minDeposit),
        dailyCheckinReward: parseFloat(dailyReward),
      });
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("heavy");
      toast({ title: t("success", language), description: "Settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({ title: t("error", language), description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "deposit" | "withdrawal" }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await adminApiRequest("POST", `/api/admin/transactions/${id}/approve`, user.id, { type });
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("heavy");
      toast({ title: t("success", language), description: "Transaction approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-withdrawals"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "deposit" | "withdrawal" }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await adminApiRequest("POST", `/api/admin/transactions/${id}/reject`, user.id, { type });
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("medium");
      toast({ title: t("success", language), description: "Transaction rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-withdrawals"] });
    },
  });

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const statCards = [
    { label: t("totalUsers", language), value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500" },
    { label: t("totalDeposits", language), value: stats?.totalDeposits ?? 0, icon: ArrowDownCircle, color: "text-green-500" },
    { label: t("totalWithdrawals", language), value: stats?.totalWithdrawals ?? 0, icon: ArrowUpCircle, color: "text-red-500" },
    { label: t("pendingDeposits", language), value: stats?.pendingDeposits ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: t("pendingWithdrawals", language), value: stats?.pendingWithdrawals ?? 0, icon: Clock, color: "text-orange-500" },
    { label: t("activeTasks", language), value: stats?.activeTasks ?? 0, icon: ListTodo, color: "text-purple-500" },
  ];

  const formatDate = (timestamp: Date | string | number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">{t("adminPanel", language)}</h1>
          <p className="text-sm text-muted-foreground">Manage your platform</p>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">{t("statistics", language)}</h2>
        <div className="grid grid-cols-2 gap-3">
          {statsLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))
            : statCards.map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-2xl font-bold font-mono">{value}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border p-1 rounded-xl">
          <TabsTrigger value="settings" className="gap-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-settings">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="deposits" className="gap-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-deposits">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Deposits</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-withdrawals">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Withdrawals</span>
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="admin-tab-banners">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Banners</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Global Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {settingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="referralBonus" className="text-foreground font-medium">
                      Referral Bonus Amount (BDT)
                    </Label>
                    <Input
                      id="referralBonus"
                      type="number"
                      step="0.5"
                      min="0"
                      value={referralBonus}
                      onChange={(e) => setReferralBonus(e.target.value)}
                      className="bg-muted/50"
                      data-testid="input-referral-bonus"
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount given to referrer when a new user joins via their link
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minWithdraw" className="text-foreground font-medium">
                      Minimum Withdraw Limit (BDT)
                    </Label>
                    <Input
                      id="minWithdraw"
                      type="number"
                      step="1"
                      min="1"
                      value={minWithdraw}
                      onChange={(e) => setMinWithdraw(e.target.value)}
                      className="bg-muted/50"
                      data-testid="input-min-withdraw"
                    />
                    <p className="text-xs text-muted-foreground">
                      Users cannot withdraw less than this amount
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minDeposit" className="text-foreground font-medium">
                      Minimum Deposit Amount (BDT)
                    </Label>
                    <Input
                      id="minDeposit"
                      type="number"
                      step="1"
                      min="1"
                      value={minDeposit}
                      onChange={(e) => setMinDeposit(e.target.value)}
                      className="bg-muted/50"
                      data-testid="input-min-deposit"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum amount required for deposits
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dailyReward" className="text-foreground font-medium">
                      Daily Check-in Reward (BDT)
                    </Label>
                    <Input
                      id="dailyReward"
                      type="number"
                      step="0.5"
                      min="0"
                      value={dailyReward}
                      onChange={(e) => setDailyReward(e.target.value)}
                      className="bg-muted/50"
                      data-testid="input-daily-reward"
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount given for daily check-in
                    </p>
                  </div>

                  <Button
                    onClick={() => updateSettingsMutation.mutate()}
                    disabled={updateSettingsMutation.isPending}
                    className="w-full shadow-md"
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits" className="mt-4">
          {depositsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !pendingDeposits?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending deposits
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDeposits.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{tx.method?.toUpperCase()}</Badge>
                          <span className="font-bold font-mono">{tx.amount} BDT</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          TxID: {tx.transactionId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: tx.id, type: "deposit" })}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${tx.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {t("approve", language)}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate({ id: tx.id, type: "deposit" })}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${tx.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t("reject", language)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          {withdrawalsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !pendingWithdrawals?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending withdrawals
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{tx.method?.toUpperCase()}</Badge>
                          <span className="font-bold font-mono">{tx.amount} BDT</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          To: {tx.walletAddress}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: tx.id, type: "withdrawal" })}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-withdraw-${tx.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {t("approve", language)}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectMutation.mutate({ id: tx.id, type: "withdrawal" })}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-withdraw-${tx.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t("reject", language)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="banners" className="mt-4">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Add New Banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Image URL (e.g., https://example.com/banner.jpg)"
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
                className="bg-muted/50"
                data-testid="input-banner-image-url"
              />
              <Input
                placeholder="Caption / Title"
                value={bannerCaption}
                onChange={(e) => setBannerCaption(e.target.value)}
                className="bg-muted/50"
                data-testid="input-banner-caption"
              />
              <Input
                placeholder="Redirect Link (e.g., https://t.me/channel)"
                value={bannerRedirectLink}
                onChange={(e) => setBannerRedirectLink(e.target.value)}
                className="bg-muted/50"
                data-testid="input-banner-redirect-link"
              />
              <Button
                onClick={() => createBannerMutation.mutate()}
                disabled={!bannerImageUrl || !bannerCaption || !bannerRedirectLink || createBannerMutation.isPending}
                className="w-full"
                data-testid="button-create-banner"
              >
                {createBannerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Banner
              </Button>
            </CardContent>
          </Card>

          {bannersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !bannersList?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No banners yet
            </div>
          ) : (
            <div className="space-y-3">
              {bannersList.map((banner) => (
                <Card key={banner.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={banner.imageUrl}
                        alt={banner.caption}
                        className="w-20 h-12 object-cover rounded-lg bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm break-words">{banner.caption}</p>
                        <p className="text-xs text-muted-foreground break-all">{banner.redirectLink}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteBannerMutation.mutate(banner.id)}
                        disabled={deleteBannerMutation.isPending}
                        data-testid={`button-delete-banner-${banner.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
