import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { openTelegramLink, hapticFeedback } from "@/lib/telegram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ExternalLink, CheckCircle, Loader2, Users } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import type { Task, TaskCompletion } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  completion?: TaskCompletion;
}

export function TaskCard({ task, completion }: TaskCardProps) {
  const { language, user, setUser } = useApp();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tasks/${task.id}/verify`, {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      hapticFeedback("heavy");
      if (data.success) {
        toast({
          title: t("success", language),
          description: t("taskCompleted", language),
        });
        if (user) {
          setUser({ ...user, balance: user.balance + task.rewardPerMember });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks/completions"] });
      } else {
        toast({
          title: t("error", language),
          description: t("taskFailed", language),
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: t("taskFailed", language),
        variant: "destructive",
      });
    },
  });

  const handleStart = () => {
    hapticFeedback("medium");
    openTelegramLink(task.channelLink);
    setStarted(true);
  };

  const handleVerify = () => {
    hapticFeedback("light");
    verifyMutation.mutate();
  };

  const isCompleted = completion?.status === "verified";
  const progressPercent = Math.min((task.completedCount / task.maxMembers) * 100, 100);

  return (
    <div
      data-testid={`task-card-${task.id}`}
      className="p-4 rounded-xl bg-card border border-border shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-sm">
            <SiTelegram className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground break-words">
              {language === "bn" && task.titleBn ? task.titleBn : task.title}
            </h4>
            <p className="text-sm text-muted-foreground break-all">@{task.channelUsername}</p>
          </div>
        </div>
        
        <Badge className="shrink-0 bg-reward/20 text-reward border-reward/30">
          +{task.rewardPerMember} {t("bdt", language)}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{task.completedCount}/{task.maxMembers}</span>
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{t("completed", language)}</span>
            </div>
          ) : started ? (
            <Button
              size="sm"
              onClick={handleVerify}
              disabled={verifyMutation.isPending}
              className="shadow-sm"
              data-testid={`button-verify-${task.id}`}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  {t("verifying", language)}
                </>
              ) : (
                t("verify", language)
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStart}
              className="shadow-sm"
              data-testid={`button-start-${task.id}`}
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              {t("start", language)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
