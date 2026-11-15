import {
  LayoutDashboard,
  Pill,
  CalendarDays,
  Users,
  BarChart3,
  UserRound,
  Bell,
  Heart,
  ShieldAlert,
  LogOut,
  X,
} from "lucide-react";

export type TabType =
  | "dashboard"
  | "medications"
  | "appointments"
  | "caregivers"
  | "reports"
  | "profile"
  | "notifications";

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadNotificationsCount?: number;
  onOpenSos: () => void;
  onSignOut: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userEmail?: string;
  role?: string;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  unreadNotificationsCount = 0,
  onOpenSos,
  onSignOut,
  isMobileOpen = false,
  onCloseMobile,
  userEmail,
  role = "patient",
}: SidebarProps) {
  const navItems: Array<{
    id: TabType;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "medications", label: "My Medications", icon: Pill },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "caregivers", label: "Family & Caregivers", icon: Users },
    { id: "reports", label: "Adherence Reports", icon: BarChart3 },
    { id: "profile", label: "Patient Profile", icon: UserRound },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotificationsCount,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#122e28] text-white shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-[#214b43]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3ca886] text-white shadow-lg shadow-[#3ca886]/30">
              <Heart size={22} fill="white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white block leading-none">
                CareOrbit
              </span>
              <span className="text-[10px] font-bold tracking-[.25em] text-[#7ce0bf] uppercase">
                360 Healthcare
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded-xl p-1.5 text-gray-400 hover:bg-[#204940] hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* User Role Tag */}
        <div className="px-6 py-3 bg-[#0d241f] border-b border-[#1b3d36] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#8eb0a4] truncate max-w-[170px]">
            {userEmail || "Connected Patient"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#205246] text-[#7ee3c2]">
            {role === "caregiver" ? "Caregiver" : "Senior"}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#2a6857] text-white shadow-md shadow-[#163a31]/50 font-bold"
                    : "text-[#b2ccc3] hover:bg-[#1a4037] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className={isActive ? "text-[#7fe8c8]" : "text-[#759a8e]"}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f43f5e] px-1.5 text-xs font-bold text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Emergency SOS & Sign Out Footer */}
        <div className="p-4 border-t border-[#214b43] space-y-3 bg-[#0e2722]">
          {/* Prominent Emergency Button */}
          <button
            type="button"
            onClick={onOpenSos}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 px-4 font-bold text-white shadow-lg shadow-red-950/40 hover:from-red-500 hover:to-rose-500 transition active:scale-[0.98]"
          >
            <ShieldAlert size={20} className="animate-pulse" />
            <span className="tracking-wide">Emergency SOS</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-[#8aa99e] hover:bg-[#1c443b] hover:text-white transition"
          >
            <LogOut size={16} />
            <span>Sign out of account</span>
          </button>
        </div>
      </aside>
    </>
  );
}
