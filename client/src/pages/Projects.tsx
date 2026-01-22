import { BottomNav } from "@/components/BottomNav";
import { useTasks } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Projects() {
  const { data: tasks, isLoading } = useTasks();

  if (isLoading) return <div className="p-6 pt-12"><Skeleton className="w-full h-12 mb-8" /><div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div></div>;

  return (
    <div className="min-h-screen bg-[#F5F3FF] pb-24 max-w-md mx-auto relative">
      <div className="p-6 pt-12">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">My Projects</h1>
          <p className="text-muted-foreground">All assigned tasks and sites.</p>
        </header>

        <div className="space-y-4">
          {tasks?.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <TaskCard 
                task={task} 
                variant="standard" 
                className="bg-white"
              />
            </motion.div>
          ))}
          
          {(!tasks || tasks.length === 0) && (
            <div className="text-center p-12 bg-white rounded-[28px] border-2 border-dashed border-gray-200">
              <p className="text-muted-foreground font-medium">No projects assigned yet.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
