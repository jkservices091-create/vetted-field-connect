import { LayoutDashboard, Briefcase, MessageSquare, Star, Building2, PlusCircle } from "lucide-react";
import { NavItem } from "@/components/AppLayout";

export const hirerNav: NavItem[] = [
  { to: "/hire", label: "Dashboard", icon: LayoutDashboard },
  { to: "/hire/jobs", label: "My jobs", icon: Briefcase },
  { to: "/hire/jobs/new", label: "Post a job", icon: PlusCircle },
  { to: "/hire/messages", label: "Messages", icon: MessageSquare },
  { to: "/hire/reviews", label: "Reviews", icon: Star },
  { to: "/hire/profile", label: "Company profile", icon: Building2 },
];

import { Search, ClipboardCheck, User, BookCheck, GraduationCap } from "lucide-react";

export const workerNav: NavItem[] = [
  { to: "/work", label: "Dashboard", icon: LayoutDashboard },
  { to: "/work/jobs", label: "Find work", icon: Search },
  { to: "/work/quizzes", label: "Trade quizzes", icon: GraduationCap },
  { to: "/work/bookings", label: "My bookings", icon: BookCheck },
  { to: "/work/verification", label: "Verification", icon: ClipboardCheck },
  { to: "/work/messages", label: "Messages", icon: MessageSquare },
  { to: "/work/reviews", label: "Reviews", icon: Star },
  { to: "/work/profile", label: "Profile", icon: User },
];

import { ShieldCheck, Users, Flag } from "lucide-react";

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/queue", label: "Vetting queue", icon: ShieldCheck },
  { to: "/admin/workers", label: "Workers", icon: Users },
  { to: "/admin/hiring-parties", label: "Hirers", icon: Building2 },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/quiz-attempts", label: "Quiz attempts", icon: GraduationCap },
  { to: "/admin/reviews", label: "Reviews", icon: Flag },
];
