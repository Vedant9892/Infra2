import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, CheckCircle2 } from "lucide-react";
import { useMarkAttendance } from "@/hooks/use-attendance";
import { motion, AnimatePresence } from "framer-motion";

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

export function AttendanceModal({ open, onOpenChange, userId }: AttendanceModalProps) {
  const [step, setStep] = useState<"location" | "photo" | "success">("location");
  const markAttendance = useMarkAttendance();

  const handleSimulateLocation = () => {
    // Simulate finding location delay
    setTimeout(() => setStep("photo"), 1000);
  };

  const handleSimulatePhoto = () => {
    // Simulate taking photo delay
    setTimeout(() => {
      markAttendance.mutate({
        userId,
        status: "checked_in",
        location: "Construction Site A",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=400&fit=crop", // Simulated photo
        isSynced: true
      }, {
        onSuccess: () => setStep("success")
      });
    }, 1500);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset step after animation completes
    setTimeout(() => setStep("location"), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-[2rem] border-none sm:max-w-[400px] p-0 overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {step === "location" && (
            <motion.div 
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <MapPin className="w-10 h-10 animate-bounce" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display text-center">Verifying Location</DialogTitle>
                <p className="text-muted-foreground mt-2">Please wait while we verify you are at the correct job site.</p>
              </DialogHeader>
              <Button 
                onClick={handleSimulateLocation}
                className="w-full h-12 rounded-xl text-lg bg-[#6C63FF] hover:bg-[#5a52d5] text-white shadow-lg shadow-indigo-200"
              >
                Verify GPS
              </Button>
            </motion.div>
          )}

          {step === "photo" && (
            <motion.div 
              key="photo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-0 flex flex-col h-[500px]"
            >
              <div className="flex-1 bg-black relative">
                {/* Simulated Camera Viewfinder */}
                <div className="absolute inset-0 flex items-center justify-center">
                   <p className="text-white/50 text-sm">Camera Preview</p>
                </div>
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <button 
                    onClick={handleSimulatePhoto}
                    disabled={markAttendance.isPending}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full group-active:scale-90 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="bg-white p-4 text-center">
                <h3 className="font-semibold text-lg">Take a selfie</h3>
                <p className="text-sm text-muted-foreground">Proof of attendance</p>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 flex flex-col items-center text-center space-y-6"
            >
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-display text-center">You're Checked In!</DialogTitle>
                <p className="text-muted-foreground mt-2">Have a safe day at work.</p>
              </DialogHeader>
              <Button 
                onClick={handleClose}
                className="w-full h-12 rounded-xl text-lg bg-[#111111] text-white hover:bg-black/90 shadow-lg"
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
