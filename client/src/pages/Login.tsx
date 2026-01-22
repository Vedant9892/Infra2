import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle, Globe, Briefcase, Shield, HardHat, Landmark } from "lucide-react";

const languages = [
  { code: "en", name: "English", icon: "🇮🇳" },
  { code: "hi", name: "हिंदी", icon: "🇮🇳" },
  { code: "mr", name: "मराठी", icon: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી", icon: "🇮🇳" },
];

const roles = [
  { id: "labour", title: "Labour", description: "Daily attendance & task tracking", icon: HardHat, color: "bg-blue-100" },
  { id: "supervisor", title: "Supervisor", description: "Manage teams & site progress", icon: Briefcase, color: "bg-purple-100" },
  { id: "engineer", title: "Engineer", description: "Technical audits & inspections", icon: Shield, color: "bg-green-100" },
  { id: "owner", title: "Site Owner", description: "Project overview & investments", icon: Landmark, color: "bg-orange-100" },
];

export default function Login() {
  const [step, setStep] = useState<"landing" | "role" | "phone" | "otp">("landing");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (step === "landing") {
      const timer = setTimeout(() => setStep("role"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const translations: any = {
    en: { tagline: "Digitising Indian Construction Sites", selectRole: "Select your role", phoneLogin: "Phone Login", enterOtp: "Enter OTP", verify: "Verify & Start" },
    hi: { tagline: "भारतीय निर्माण स्थलों का डिजिटलीकरण", selectRole: "अपनी भूमिका चुनें", phoneLogin: "फ़ोन लॉगिन", enterOtp: "ओटीपी दर्ज करें", verify: "सत्यापित करें" },
    mr: { tagline: "भारतीय बांधकाम साइट्सचे डिजिटलीकरण", selectRole: "तुमची भूमिका निवडा", phoneLogin: "फोन लॉगिन", enterOtp: "ओटीपी प्रविष्ट करा", verify: "सत्यापित करा" },
  };

  const t = translations[selectedLang] || translations.en;

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col items-center justify-center p-6 font-['Outfit']">
      <div className="absolute top-6 right-6 flex gap-2">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant="ghost"
            size="sm"
            className={`rounded-full h-8 px-3 text-xs ${selectedLang === lang.code ? "bg-white shadow-sm ring-1 ring-primary/20" : ""}`}
            onClick={() => setSelectedLang(lang.code)}
          >
            {lang.name}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <HardHat className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">BuildBuddy</h1>
            <p className="text-gray-500 font-medium">{t.tagline}</p>
          </motion.div>
        )}

        {step === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t.selectRole}</h2>
            <div className="grid grid-cols-1 gap-4">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className="p-4 flex items-center gap-4 cursor-pointer hover-elevate active-elevate-2 border-none shadow-sm"
                  onClick={() => {
                    setSelectedRole(role.id);
                    setStep("phone");
                  }}
                >
                  <div className={`w-12 h-12 ${role.color} rounded-2xl flex items-center justify-center`}>
                    <role.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{role.title}</h3>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {(step === "phone" || step === "otp") && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <Card className="p-8 border-none shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{step === "phone" ? t.phoneLogin : t.enterOtp}</h2>
              <p className="text-gray-500 text-sm mb-6">
                {step === "phone" ? "Enter your Indian mobile number" : "We've sent a 6-digit code"}
              </p>

              <div className="space-y-4">
                {step === "phone" ? (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                    <Input className="pl-14 h-12 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200" placeholder="9876543210" />
                  </div>
                ) : (
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Input key={i} className="h-12 w-full text-center font-bold text-lg rounded-xl bg-gray-50 border-none ring-1 ring-gray-200" maxLength={1} />
                    ))}
                  </div>
                )}

                <Button
                  className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20"
                  onClick={() => {
                    if (step === "phone") setStep("otp");
                    else setLocation("/home");
                  }}
                >
                  {step === "phone" ? "Send OTP" : t.verify}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
