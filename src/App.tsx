import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SuggestCoins from "./pages/SuggestCoins";
import ProjectDetails from "./pages/ProjectDetails";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import RecommendationTracking from "./pages/RecommendationTracking";
import PortfolioRebalance from "./pages/PortfolioRebalance";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/portfolio" element={<Index />} />
          <Route path="/suggest-coins" element={<SuggestCoins />} />
          <Route path="/project/:symbol" element={<ProjectDetails />} />
          <Route path="/portfolio-rebalance" element={<PortfolioRebalance />} />
          <Route path="/recommendation-tracking" element={<RecommendationTracking />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
