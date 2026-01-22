import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F3FF] p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 text-center shadow-xl shadow-purple-900/5">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
          <AlertTriangle className="w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-[#6C63FF] hover:bg-[#5a52d5] text-white shadow-lg shadow-indigo-200">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
