import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Loader2, AlertCircle, Users } from "lucide-react";
import { z } from "zod";

const createTaskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  channelUsername: z.string().min(1, "Channel username is required"),
  channelLink: z.string().url("Must be a valid URL"),
  rewardPerMember: z.coerce.number().min(0.5, "Minimum reward is 0.5 BDT"),
  totalBudget: z.coerce.number().min(1, "Budget must be at least 1 BDT"),
});

type FormData = z.infer<typeof createTaskFormSchema>;

export default function CreateTask() {
  const { language, user, setUser, isLoading } = useApp();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      title: "",
      channelUsername: "",
      channelLink: "",
      rewardPerMember: 0.5,
      totalBudget: 10,
    },
  });

  const rewardPerMember = form.watch("rewardPerMember");
  const totalBudget = form.watch("totalBudget");
  const estimatedMembers = rewardPerMember > 0 ? Math.floor(totalBudget / rewardPerMember) : 0;
  const hasInsufficientBalance = (user?.balance ?? 0) < totalBudget;
  
  const isAdmin = user?.telegramId === "1991771063";

  const createMutation = useMutation({
    mutationFn: async (data: FormData & { creatorId: string }) => {
      if (!data.creatorId) {
        throw new Error("User not authenticated. Please refresh the page.");
      }
      
      const response = await apiRequest("POST", "/api/tasks", data);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create task");
      }
      
      return result;
    },
    onSuccess: (data) => {
      hapticFeedback("heavy");
      toast({
        title: t("success", language),
        description: t("taskCreated", language),
      });
      if (user) {
        setUser({ ...user, balance: user.balance - totalBudget });
      }
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("error", language),
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    hapticFeedback("light");
    
    if (!user || !user.id) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" 
          ? "ব্যবহারকারী লোড হয়নি। পেজ রিফ্রেশ করুন।" 
          : "User not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasInsufficientBalance && !isAdmin) {
      toast({
        title: language === "bn" ? "ব্যালেন্স অপর্যাপ্ত" : "Insufficient balance",
        description: language === "bn" 
          ? "অনুগ্রহ করে প্রথমে ডিপোজিট করুন" 
          : "Please deposit first",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate({
      ...data,
      creatorId: user.id,
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <PlusCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-foreground">{t("createTask", language)}</h2>
          <p className="text-sm text-muted-foreground">
            {language === "bn" ? "আপনার চ্যানেল প্রমোট করুন" : "Promote your channel"}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t("taskTitle", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Join our Telegram channel"
                        className="bg-muted/50 border-border"
                        data-testid="input-task-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channelUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t("channelUsername", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="mychannel"
                        className="bg-muted/50 border-border"
                        data-testid="input-channel-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channelLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t("channelLink", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://t.me/mychannel"
                        className="bg-muted/50 border-border"
                        data-testid="input-channel-link"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rewardPerMember"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t("rewardPerMember", language)}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            field.onChange(isNaN(val) ? 0.5 : val);
                          }}
                          className="bg-muted/50 border-border"
                          data-testid="input-reward"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">{t("minReward", language)}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">{t("totalBudget", language)}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            field.onChange(isNaN(val) ? 1 : val);
                          }}
                          className="bg-muted/50 border-border"
                          data-testid="input-budget"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{t("estimatedMembers", language)}</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{estimatedMembers}</span>
                </div>
              </div>

              {hasInsufficientBalance && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold">{t("insufficientBalance", language)}</span>
                  </div>
                  <p className="text-xs ml-6">
                    {language === "bn" 
                      ? `আপনার ব্যালেন্স: ${user?.balance?.toFixed(2) || 0} BDT। প্রয়োজন: ${totalBudget} BDT। প্রথমে ডিপোজিট করুন।`
                      : `Your balance: ${user?.balance?.toFixed(2) || 0} BDT. Required: ${totalBudget} BDT. Please deposit first.`
                    }
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full shadow-md"
                disabled={createMutation.isPending || !user}
                data-testid="button-create-task"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("creating", language)}
                  </>
                ) : !user ? (
                  language === "bn" ? "লোড হচ্ছে..." : "Loading..."
                ) : (
                  t("create", language)
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
