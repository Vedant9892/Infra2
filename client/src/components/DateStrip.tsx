import { format, addDays, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";

export function DateStrip() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const startDate = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-3 px-1">
        {days.map((date, i) => {
          const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(date)}
              className={`
                flex flex-col items-center justify-center min-w-[60px] h-[84px] rounded-[20px] transition-all duration-300
                ${isSelected 
                  ? "bg-[#111111] text-white shadow-lg shadow-black/20" 
                  : "bg-white text-muted-foreground hover:bg-white/80"}
              `}
            >
              <span className="text-xs font-medium mb-1 opacity-80">{format(date, "EEE")}</span>
              <span className={`text-xl font-bold font-display ${isSelected ? "text-white" : "text-foreground"}`}>
                {format(date, "d")}
              </span>
              {isToday && !isSelected && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
