import { Link, useLocation } from "wouter";
import { Home, LayoutGrid, BarChart2, User } from "lucide-react";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: LayoutGrid, label: "Projects", href: "/projects" },
    { icon: BarChart2, label: "Stats", href: "/stats" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        
        return (
          <Link key={item.label} href={item.href}>
            <div className="relative flex flex-col items-center justify-center p-2 cursor-pointer group">
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-1 w-1 h-1 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive ? "text-white" : "text-white/40 group-hover:text-white/70"
                }`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
