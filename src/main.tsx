import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 🔒 استيراد خدمة النسخ الاحتياطي لتشغيل المزامنة التلقائية
import { syncAllInvestments } from "./services/investmentBackupService";

// 🔄 تشغيل المزامنة عند بدء التطبيق
syncAllInvestments();

createRoot(document.getElementById("root")!).render(<App />);
