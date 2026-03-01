import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { DAPProvider } from "./contexts/DAPContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import MyAddresses from "./pages/MyAddresses";
import AccessControl from "./pages/AccessControl";
import ActivityLogs from "./pages/ActivityLogs";
import Settings from "./pages/Settings";
import AIPAdminPortal from "./pages/AIPAdminPortal";
import AdminDemo from "./pages/AdminDemo";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <DAPProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            {/* User Portal Routes */}
            <Route path="/user/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="addresses" element={<MyAddresses />} />
              <Route path="access" element={<AccessControl />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* Legacy routes redirect */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="addresses" element={<MyAddresses />} />
              <Route path="access" element={<AccessControl />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* Admin Portal Routes */}
            <Route path="/admin/database" element={<AIPAdminPortal />} />
            <Route path="/admin/aip-portal" element={<AIPAdminPortal />} />
            <Route path="/admin/demo" element={<AdminDemo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DAPProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
