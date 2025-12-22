import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { insertTaskSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof insertTaskSchema>;

export default function CreateTask() {
  const { language, user, setUser } = useApp();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      titleBn: "",
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

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/tasks", {
        ...data,
        creatorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
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
    onError: () => {
      toast({
        title: t("error", language),
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (hasInsufficientBalance) return;
    hapticFeedback("light");
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">{t("createTask", language)}</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("taskTitle", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Join our Telegram channel"
                        data-testid="input-task-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titleBn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("taskTitleBn", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="আমাদের টেলিগ্রাম চ্যানেলে যোগ দিন"
                        data-testid="input-task-title-bn"
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
                    <FormLabel>{t("channelUsername", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="mychannel"
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
                    <FormLabel>{t("channelLink", language)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://t.me/mychannel"
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
                      <FormLabel>{t("rewardPerMember", language)}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.5"
                          min="0.5"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      <FormLabel>{t("totalBudget", language)}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-budget"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("estimatedMembers", language)}</span>
                  <span className="font-semibold">{estimatedMembers}</span>
                </div>
              </div>

              {hasInsufficientBalance && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {t("insufficientBalance", language)}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending || hasInsufficientBalance}
                data-testid="button-create-task"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("creating", language)}
                  </>
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
