import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListTodo, CheckCircle2, Clock } from "lucide-react";
import type { Task, TaskCompletion } from "@shared/schema";

export default function Tasks() {
  const { language, user } = useApp();
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed">("ongoing");

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<TaskCompletion[]>({
    queryKey: ["/api/tasks/completions", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/completions?userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch completions");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const isLoading = tasksLoading || completionsLoading;

  const getCompletion = (taskId: string) => {
    return completions?.find((c) => c.taskId === taskId);
  };

  const ongoingTasks = tasks?.filter((task) => {
    const completion = getCompletion(task.id);
    return !completion || completion.status !== "verified";
  }) || [];

  const completedTasks = tasks?.filter((task) => {
    const completion = getCompletion(task.id);
    return completion?.status === "verified";
  }) || [];

  const renderTaskList = (taskList: Task[], emptyMessage: string) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <ListTodo className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {taskList.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            completion={getCompletion(task.id)}
          />
        ))}
      </div>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-xl bg-card border border-card-border space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ListTodo className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">{t("availableTasks", language)}</h2>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ongoing" | "completed")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ongoing" className="flex items-center gap-2" data-testid="tab-ongoing">
            <Clock className="w-4 h-4" />
            {t("ongoing", language)}
            {!isLoading && ongoingTasks.length > 0 && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {ongoingTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2" data-testid="tab-completed">
            <CheckCircle2 className="w-4 h-4" />
            {t("completedTasks", language)}
            {!isLoading && completedTasks.length > 0 && (
              <span className="ml-1 text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing" className="mt-4">
          {isLoading ? renderSkeleton() : renderTaskList(ongoingTasks, t("noOngoingTasks", language))}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? renderSkeleton() : renderTaskList(completedTasks, t("noCompletedTasks", language))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
