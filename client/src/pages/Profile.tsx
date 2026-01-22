import { BottomNav } from "@/components/BottomNav";
import { useUser } from "@/hooks/use-user";
import { motion } from "framer-motion";
import { User, Settings, Shield, HelpCircle, LogOut, ChevronRight, ToggleLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function Profile() {
  const { data: user, isLoading } = useUser();
  const [offlineMode, setOfflineMode] = useState(false);

  if (isLoading) return <div className="p-6"><Skeleton className="w-full h-64" /></div>;

  const userData = user || { name: "Guest User", role: "Visitor", avatar: null, location: "Unknown" };

  const menuItems = [
    { icon: User, label: "Personal Information", color: "bg-blue-100 text-blue-600" },
    { icon: Shield, label: "Security & Privacy", color: "bg-purple-100 text-purple-600" },
    { icon: Settings, label: "App Settings", color: "bg-yellow-100 text-yellow-600" },
    { icon: HelpCircle, label: "Help & Support", color: "bg-pink-100 text-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3FF] pb-24 max-w-md mx-auto relative">
      <div className="p-6 pt-12 space-y-8">
        
        {/* Profile Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
             <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden mx-auto">
              {userData.avatar ? (
                <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
                  {userData.name[0]}
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <h1 className="text-2xl font-display font-bold">{userData.name}</h1>
          <p className="text-muted-foreground font-medium">{userData.role} • {userData.location}</p>
        </div>

        {/* Offline Toggle Card */}
        <div className="bg-[#111111] text-white rounded-[24px] p-6 flex items-center justify-between shadow-lg shadow-black/10">
          <div>
            <h3 className="font-bold text-lg mb-1">Offline Mode</h3>
            <p className="text-white/60 text-sm">Save data locally when no signal.</p>
          </div>
          <Switch 
            checked={offlineMode} 
            onCheckedChange={setOfflineMode}
            className="data-[state=checked]:bg-[#6C63FF] data-[state=unchecked]:bg-gray-600"
          />
        </div>

        {/* Menu List */}
        <div className="space-y-3">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm group hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-foreground/80 group-hover:text-foreground transition-colors">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </motion.button>
          ))}
          
          <button className="w-full p-4 flex items-center justify-center text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors mt-4">
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
