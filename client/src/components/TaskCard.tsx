import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { openTelegramLink, hapticFeedback } from "@/lib/telegram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ExternalLink, CheckCircle, Loader2 } from "lucide-react";
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

  return (
    <div
      data-testid={`task-card-${task.id}`}
      className="p-4 rounded-xl bg-card border border-card-border space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <SiTelegram className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium truncate">
              {language === "bn" && task.titleBn ? task.titleBn : task.title}
            </h4>
            <p className="text-sm text-muted-foreground">@{task.channelUsername}</p>
          </div>
        </div>
        
        <Badge variant="secondary" className="shrink-0">
          +{task.rewardPerMember} {t("bdt", language)}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {task.completedCount}/{task.maxMembers} {t("completed", language).toLowerCase()}
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-green-500">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{t("completed", language)}</span>
          </div>
        ) : started ? (
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={verifyMutation.isPending}
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
            data-testid={`button-start-${task.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            {t("start", language)}
          </Button>
        )}
      </div>
    </div>
  );
}
