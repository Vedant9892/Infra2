import { useUser } from "@/hooks/use-user";
import { useTasks } from "@/hooks/use-tasks";
import { BottomNav } from "@/components/BottomNav";
import { DateStrip } from "@/components/DateStrip";
import { TaskCard } from "@/components/TaskCard";
import { AttendanceModal } from "@/components/AttendanceModal";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Battery, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी" },
  { code: "mr", name: "मराठी" },
];

const translations: any = {
  en: { 
    welcome: "Good Morning,", 
    markAttendance: "Mark Attendance",
    attendanceMsg: "Verify your location and check-in to the job site.",
    tasks: "Today's Schedule",
    checkIn: "Check In Now"
  },
  hi: { 
    welcome: "नमस्ते,", 
    markAttendance: "हाजिरी लगाएं",
    attendanceMsg: "अपना स्थान सत्यापित करें और चेक-इन करें।",
    tasks: "आज का शेड्यूल",
    checkIn: "चेक इन करें"
  },
  mr: { 
    welcome: "शुभ प्रभात,", 
    markAttendance: "हजेरी नोंदवा",
    attendanceMsg: "तुमचे स्थान सत्यापित करा आणि चेक-इन करा.",
    tasks: "आजचे वेळापत्रक",
    checkIn: "चेक इन करा"
  }
};

export default function Home() {
  const [lang, setLang] = useState("en");
  const t = translations[lang] || translations.en;
  const { data: user, isLoading: userLoading } = useUser();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  if (userLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] p-6 space-y-6 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Skeleton className="w-12 h-12 rounded-full" />
             <div className="space-y-2">
               <Skeleton className="w-24 h-4" />
               <Skeleton className="w-32 h-6" />
             </div>
          </div>
        </div>
        <Skeleton className="w-full h-48 rounded-[28px]" />
        <Skeleton className="w-full h-24 rounded-[20px]" />
        <div className="grid grid-cols-2 gap-4 h-80">
          <Skeleton className="h-full rounded-[28px]" />
          <div className="space-y-4">
            <Skeleton className="h-full rounded-[28px]" />
            <Skeleton className="h-full rounded-[28px]" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback if no user found
  const userData = user || { name: "Guest", avatar: null, id: 0 };
  
  // Safe tasks fallback
  const allTasks = tasks || [];
  const primaryTask = allTasks[0];
  const secondaryTask = allTasks[1];

  return (
    <div className="min-h-screen bg-[#F5F3FF] pb-24 text-foreground relative overflow-hidden font-['Outfit']">
      <div className="max-w-md mx-auto px-6 pt-8 space-y-8 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm">
              {userData.avatar ? (
                <img src={userData.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-lg font-bold">
                  {userData.name[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">{t.welcome}</p>
              <h1 className="text-2xl font-display font-bold">{userData.name.split(' ')[0]}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-white/50 p-1 rounded-full">
              {languages.map(l => (
                <button
                  key={l.code}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${lang === l.code ? "bg-white shadow-sm text-primary" : "text-gray-500"}`}
                  onClick={() => setLang(l.code)}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-foreground hover:bg-gray-50 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Hero Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#6C63FF] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Sync
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">{t.markAttendance.split(' ').map((w: string, i: number) => i === 0 ? <span key={i}>{w}<br/></span> : w)}</h2>
            <p className="text-white/80 text-sm mb-8 max-w-[60%]">
              {t.attendanceMsg}
            </p>
            <button 
              onClick={() => setShowAttendanceModal(true)}
              className="bg-white text-[#6C63FF] px-6 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
            >
              {t.checkIn}
            </button>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-90 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD166] to-[#F6C1CC] rounded-full blur-[2px] opacity-80" />
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl rotate-12 border border-white/30" />
          </div>
        </motion.div>

        {/* Date Strip */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-xl font-display font-bold">{t.tasks}</h3>
            <span className="text-sm font-medium text-muted-foreground">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
          <DateStrip />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 auto-rows-[180px]">
          {/* Main Tall Card */}
          {primaryTask ? (
            <TaskCard 
              task={primaryTask} 
              variant="tall" 
              className="row-span-2 bg-[#FFD166]" // Soft Yellow
              colorClass="bg-[#FFD166]"
            />
          ) : (
            <div className="row-span-2 bg-[#FFD166] rounded-[28px] p-6 flex items-center justify-center opacity-50">
              <span className="font-medium">No tasks</span>
            </div>
          )}

          {/* Secondary Cards Column */}
          <div className="flex flex-col gap-4 row-span-2">
            {secondaryTask && (
               <TaskCard 
                 task={secondaryTask} 
                 variant="standard" 
                 className="flex-1 bg-[#BEE7E8]" // Soft Blue
                 colorClass="bg-[#BEE7E8]"
               />
            )}
            
            {/* Status Card (Pink) */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-[#F6C1CC] rounded-[28px] p-6 flex flex-col justify-center relative overflow-hidden shadow-sm"
            >
              <h4 className="font-display font-bold text-xl mb-1 relative z-10">Team Chat</h4>
              <p className="text-sm text-foreground/60 relative z-10">3 new messages</p>
              
              {/* Avatars overlap */}
              <div className="flex -space-x-3 mt-4 relative z-10">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300 shadow-sm" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-400 shadow-sm" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#111111] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  +5
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AttendanceModal 
        open={showAttendanceModal} 
        onOpenChange={setShowAttendanceModal}
        userId={userData.id}
      />
      
      <BottomNav />
    </div>
  );
}
