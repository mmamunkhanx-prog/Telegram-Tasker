import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ListTodo } from "lucide-react";
import type { Task, TaskCompletion } from "@shared/schema";

export default function Tasks() {
  const { language, user } = useApp();

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: completions, isLoading: completionsLoading } = useQuery<TaskCompletion[]>({
    queryKey: ["/api/tasks/completions", user?.id],
    enabled: !!user?.id,
  });

  const isLoading = tasksLoading || completionsLoading;

  const getCompletion = (taskId: string) => {
    return completions?.find((c) => c.taskId === taskId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ListTodo className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">{t("availableTasks", language)}</h2>
      </div>

      {isLoading ? (
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
      ) : tasks?.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <ListTodo className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t("noTasks", language)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completion={getCompletion(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
