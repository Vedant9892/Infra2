import { motion } from "framer-motion";
import { type Task } from "@shared/schema";
import { Clock, MapPin, MoreHorizontal } from "lucide-react";

interface TaskCardProps {
  task: Task;
  variant: "tall" | "standard" | "compact";
  className?: string;
  colorClass?: string;
}

export function TaskCard({ task, variant, className = "", colorClass = "bg-white" }: TaskCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 rounded-[28px] flex flex-col justify-between shadow-sm transition-shadow ${colorClass} ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="bg-black/5 px-3 py-1 rounded-full backdrop-blur-sm">
          <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">{task.priority}</span>
        </div>
        {variant !== "compact" && (
          <button className="text-foreground/40 hover:text-foreground">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-display font-bold leading-tight mb-2 text-foreground/90">
          {task.title}
        </h3>
        
        {variant !== "compact" && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center text-sm font-medium text-foreground/60">
              <Clock className="w-4 h-4 mr-2 opacity-70" />
              {task.time}
            </div>
            <div className="flex items-center text-sm font-medium text-foreground/60">
              <MapPin className="w-4 h-4 mr-2 opacity-70" />
              {task.location}
            </div>
          </div>
        )}
      </div>

      {task.supervisorAvatar && (
        <div className="absolute bottom-6 right-6">
           <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-sm">
             <img src={task.supervisorAvatar} alt="Supervisor" className="w-full h-full object-cover" />
           </div>
        </div>
      )}
    </motion.div>
  );
}
