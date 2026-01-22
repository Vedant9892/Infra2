import { BottomNav } from "@/components/BottomNav";
import { useUser } from "@/hooks/use-user";
import { useAttendanceHistory } from "@/hooks/use-attendance";
import { motion } from "framer-motion";
import { Activity, Clock, Award, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stats() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: history, isLoading: historyLoading } = useAttendanceHistory();

  if (userLoading || historyLoading) return <div className="p-6"><Skeleton className="w-full h-64" /></div>;

  const userData = user || { name: "User", stats: { attendanceRate: 0, hoursWorked: 0, tasksCompleted: 0 } };
  const userStats = userData.stats || { attendanceRate: 95, hoursWorked: 142, tasksCompleted: 28 };

  return (
    <div className="min-h-screen bg-[#F5F3FF] pb-24 max-w-md mx-auto relative">
      <div className="p-6 pt-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-bold mb-2">Performance</h1>
          <p className="text-muted-foreground">Your activity this month.</p>
        </header>

        {/* Stats Row */}
        <div className="flex justify-between items-center bg-white rounded-[28px] p-6 shadow-sm">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full text-purple-600 mb-2 mx-auto">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-display">{userStats.attendanceRate}%</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Attendance</p>
          </div>
          <div className="w-px h-12 bg-gray-100" />
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full text-yellow-600 mb-2 mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-display">{userStats.hoursWorked}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Hours</p>
          </div>
          <div className="w-px h-12 bg-gray-100" />
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 mb-2 mx-auto">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold font-display">{userStats.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Tasks</p>
          </div>
        </div>

        {/* Recent Activity List */}
        <div>
          <h3 className="text-lg font-display font-bold mb-4 ml-1">Recent Check-ins</h3>
          <div className="space-y-3">
            {history?.slice(0, 5).map((record, i) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-transparent hover:border-purple-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${record.status === 'checked_in' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="font-bold text-base">{record.status === 'checked_in' ? 'Site Check-in' : 'Check-out'}</p>
                    <p className="text-sm text-muted-foreground">{record.location}</p>
                  </div>
                </div>
                <div className="flex items-center text-muted-foreground">
                   <span className="text-sm font-medium mr-2">
                     {record.date ? new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                   </span>
                   <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
            
            {(!history || history.length === 0) && (
              <div className="text-center p-8 text-muted-foreground bg-white rounded-[28px]">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
