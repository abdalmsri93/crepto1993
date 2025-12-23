import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <TrendingUp className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">محفظة العملات</h1>
        </div>
        
        <p className="text-xl text-muted-foreground">
          تابع محفظتك من Binance بسهولة
        </p>

        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/auth")}
            className="w-full md:w-64 h-12 text-lg"
          >
            تسجيل الدخول / إنشاء حساب
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
