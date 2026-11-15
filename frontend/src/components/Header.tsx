import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import BackendStatus from "./BackendStatus";
import type { TabType } from "./Sidebar";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onSelectTab: (tab: TabType) => void;
  userName?: string;
  userEmail?: string;
  role?: string;
  unreadCount?: number;
  adherencePercentage?: number;
  totalMeds?: number;
  completedMeds?: number;
  onSignOut: () => void;
}

export default function Header({
  onOpenMobileMenu,
  onSelectTab,
  userName = "Eleanor Jenkins",
  userEmail = "eleanor.care@example.com",
  role = "patient",
  unreadCount = 0,
  totalMeds = 0,
  completedMeds = 0,
  onSignOut,
}: HeaderProps) {
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e2ece7] bg-white/95 px-5 py-4 backdrop-blur-md md:px-8">
      {/* Left: Hamburger (mobile) + Greeting */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-xl p-2 text-[#24483e] hover:bg-[#eef6f2] lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#173a33] tracking-tight">
              Hello, {userName}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#e8f6f0] px-2.5 py-0.5 text-[11px] font-bold text-[#2a7a63]">
              <ShieldCheck size={13} />
              {role === "caregiver" ? "Family Caregiver" : "Senior Patient"}
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-[#71877e] mt-0.5 font-medium">
            <Calendar size={13} className="text-[#3ba887]" />
            {todayFormatted}
          </p>
        </div>
      </div>

      {/* Center: Daily Health Summary Pill (hidden on small screens) */}
      <div className="hidden xl:flex items-center gap-3 rounded-full border border-[#dcebe3] bg-[#f5faf7] px-4 py-2 text-xs font-semibold text-[#30554b] shadow-sm">
        <span className="flex h-2.5 w-2.5 rounded-full bg-[#3ba887] animate-pulse" />
        <span>
          Daily Routine: <strong>{completedMeds} of {totalMeds}</strong> scheduled doses recorded
        </span>
        <button
          onClick={() => onSelectTab("medications")}
          className="text-[#2b7f67] hover:underline font-bold ml-1"
        >
          View Schedule →
        </button>
      </div>

      {/* Right: Actions, Backend status, Notifications, Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Backend health status badge */}
        <div className="hidden sm:block">
          <BackendStatus />
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          onClick={() => onSelectTab("notifications")}
          aria-label="View notifications"
          className="relative rounded-2xl border border-[#e1ede6] bg-white p-2.5 text-[#30554b] transition hover:bg-[#eef7f2] hover:text-[#257962] shadow-sm"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="flex items-center gap-2.5 rounded-2xl border border-[#e1ede6] bg-white p-1.5 pr-3 transition hover:bg-[#eef7f2] shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3ba887] to-[#1e6958] font-bold text-white text-sm shadow-sm">
              {userName ? userName.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[#1f433b] leading-tight truncate max-w-[120px]">
                {userName}
              </p>
              <p className="text-[10px] text-[#71877e] leading-tight truncate max-w-[120px]">
                {userEmail}
              </p>
            </div>
            <ChevronDown size={14} className="text-[#71877e] hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#dcebe3] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-[#1f433b]">{userName}</p>
                <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab("profile");
                    setProfileDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-[#eef7f2] hover:text-[#257962]"
                >
                  <User size={15} />
                  Patient Profile & Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTab("reports");
                    setProfileDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-[#eef7f2] hover:text-[#257962]"
                >
                  <ShieldCheck size={15} />
                  Adherence Reports
                </button>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdown(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
