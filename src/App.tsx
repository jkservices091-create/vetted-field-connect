import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import SignupWorker from "./pages/SignupWorker";
import SignupHirer from "./pages/SignupHirer";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound.tsx";

import HirerDashboard from "./pages/hire/HirerDashboard";
import HirerProfile from "./pages/hire/HirerProfile";
import HirerJobs from "./pages/hire/Jobs";
import JobNew from "./pages/hire/JobNew";
import HirerJobDetail from "./pages/hire/JobDetail";

import WorkerDashboard from "./pages/work/WorkerDashboard";
import WorkerProfile from "./pages/work/WorkerProfile";
import Verification from "./pages/work/Verification";
import WorkerJobs from "./pages/work/Jobs";
import WorkerJobDetail from "./pages/work/JobDetail";
import Bookings from "./pages/work/Bookings";
import Badges from "./pages/work/Badges";
import TradeEvidence from "./pages/work/TradeEvidence";
import PublicProfileSettings from "./pages/work/PublicProfileSettings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import VettingQueue from "./pages/admin/VettingQueue";
import WorkerReview from "./pages/admin/WorkerReview";
import TradeBadges from "./pages/admin/TradeBadges";

import PublicWorkerProfile from "./pages/PublicWorkerProfile";
import { ComingSoon } from "./pages/ComingSoon";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/apply" element={<SignupWorker />} />
          <Route path="/for-hiring" element={<SignupHirer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/p/:handle" element={<PublicWorkerProfile />} />

          {/* Hiring party */}
          <Route path="/hire" element={<ProtectedRoute requireRole="hiring_party"><HirerDashboard /></ProtectedRoute>} />
          <Route path="/hire/profile" element={<ProtectedRoute requireRole="hiring_party"><HirerProfile /></ProtectedRoute>} />
          <Route path="/hire/jobs" element={<ProtectedRoute requireRole="hiring_party"><HirerJobs /></ProtectedRoute>} />
          <Route path="/hire/jobs/new" element={<ProtectedRoute requireRole="hiring_party"><JobNew /></ProtectedRoute>} />
          <Route path="/hire/jobs/:id" element={<ProtectedRoute requireRole="hiring_party"><HirerJobDetail /></ProtectedRoute>} />
          <Route path="/hire/messages" element={<ProtectedRoute requireRole="hiring_party"><ComingSoon role="hiring_party" title="Messages" description="In-app messaging ships in Phase 5." /></ProtectedRoute>} />
          <Route path="/hire/reviews" element={<ProtectedRoute requireRole="hiring_party"><ComingSoon role="hiring_party" title="Reviews" description="Reviews ship in Phase 6." /></ProtectedRoute>} />

          {/* Worker */}
          <Route path="/work" element={<ProtectedRoute requireRole="worker"><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/work/profile" element={<ProtectedRoute requireRole="worker"><WorkerProfile /></ProtectedRoute>} />
          <Route path="/work/verification" element={<ProtectedRoute requireRole="worker"><Verification /></ProtectedRoute>} />
          <Route path="/work/jobs" element={<ProtectedRoute requireRole="worker"><WorkerJobs /></ProtectedRoute>} />
          <Route path="/work/jobs/:id" element={<ProtectedRoute requireRole="worker"><WorkerJobDetail /></ProtectedRoute>} />
          <Route path="/work/bookings" element={<ProtectedRoute requireRole="worker"><Bookings /></ProtectedRoute>} />
          <Route path="/work/badges" element={<ProtectedRoute requireRole="worker"><Badges /></ProtectedRoute>} />
          <Route path="/work/trade-evidence/:slug" element={<ProtectedRoute requireRole="worker"><TradeEvidence /></ProtectedRoute>} />
          <Route path="/work/profile/public" element={<ProtectedRoute requireRole="worker"><PublicProfileSettings /></ProtectedRoute>} />
          <Route path="/work/messages" element={<ProtectedRoute requireRole="worker"><ComingSoon role="worker" title="Messages" description="Messaging ships in Phase 5." /></ProtectedRoute>} />
          <Route path="/work/reviews" element={<ProtectedRoute requireRole="worker"><ComingSoon role="worker" title="Reviews" description="Reviews ship in Phase 6." /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/queue" element={<ProtectedRoute requireRole="admin"><VettingQueue /></ProtectedRoute>} />
          <Route path="/admin/trade-badges" element={<ProtectedRoute requireRole="admin"><TradeBadges /></ProtectedRoute>} />
          <Route path="/admin/workers" element={<ProtectedRoute requireRole="admin"><ComingSoon role="admin" title="Workers" description="Browse all workers ships in Phase 7." /></ProtectedRoute>} />
          <Route path="/admin/workers/:id" element={<ProtectedRoute requireRole="admin"><WorkerReview /></ProtectedRoute>} />
          <Route path="/admin/hiring-parties" element={<ProtectedRoute requireRole="admin"><ComingSoon role="admin" title="Hirers" description="Phase 7." /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute requireRole="admin"><ComingSoon role="admin" title="Jobs" description="Phase 7." /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute requireRole="admin"><ComingSoon role="admin" title="Reviews" description="Phase 7." /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
