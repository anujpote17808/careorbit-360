import { useState } from "react";
import CareOrbitCanvas from "./CareOrbitCanvas";
import type { TabType } from "./Sidebar";
import type { DashboardMedication } from "./DashboardView";
import type { Appointment, Caregiver, NotificationItem } from "../services/api";
import {
  Heart,
  Pill,
  CalendarDays,
  Users,
  BarChart3,
  Bell,
  Activity,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface CareOrbitViewProps {
  onSelectTab: (tab: TabType) => void;
  patientName?: string;
  medications: DashboardMedication[];
  appointments: Appointment[];
  caregivers: Caregiver[];
  notifications: NotificationItem[];
  adherenceRate: number;
}

export default function CareOrbitView({
  onSelectTab,
  patientName = "Eleanor Vance",
  medications,
  appointments,
  caregivers,
  notifications,
  adherenceRate,
}: CareOrbitViewProps) {
  const [selectedModule, setSelectedModule] = useState<TabType>("medications");

  const completedMeds = medications.filter((m) => m.doseStatus === "taken").length;
  const totalMeds = medications.length;
  const remainingMeds = Math.max(0, totalMeds - completedMeds);
  const nextAppt = appointments.find((a) => a.status === "scheduled") || appointments[0];
  const unreadAlerts = notifications.filter((n) => !n.is_read).length;

  const moduleCards = [
    {
      id: "medications" as TabType,
      title: "Medications",
      headline: `${completedMeds} of ${totalMeds} Doses Taken`,
      detail: `${remainingMeds} doses scheduled today`,
      color: "border-emerald-500 bg-emerald-950/20 text-emerald-400",
      iconBg: "bg-emerald-500 text-white",
      icon: Pill,
      cta: "Open Medication Schedule",
    },
    {
      id: "appointments" as TabType,
      title: "Doctor Appointments",
      headline: nextAppt ? `${nextAppt.doctor_name}` : "No Upcoming Visits",
      detail: nextAppt ? `${nextAppt.specialty || "Checkup"} • ${new Date(nextAppt.scheduled_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : "All checkups up to date",
      color: "border-sky-500 bg-sky-950/20 text-sky-400",
      iconBg: "bg-sky-500 text-white",
      icon: CalendarDays,
      cta: "View Calendar",
    },
    {
      id: "caregivers" as TabType,
      title: "Care Circle",
      headline: `${caregivers.length} Active Guardians`,
      detail: "Family and nursing staff connected",
      color: "border-purple-500 bg-purple-950/20 text-purple-400",
      iconBg: "bg-purple-500 text-white",
      icon: Users,
      cta: "Manage Care Circle",
    },
    {
      id: "reports" as TabType,
      title: "Adherence Analytics",
      headline: `${adherenceRate}% Adherence Score`,
      detail: "Consistent medication streak active",
      color: "border-teal-500 bg-teal-950/20 text-teal-400",
      iconBg: "bg-teal-500 text-white",
      icon: BarChart3,
      cta: "View Analytics",
    },
    {
      id: "notifications" as TabType,
      title: "Security & Alerts",
      headline: `${unreadAlerts} Unread Reminders`,
      detail: "Emergency SOS protocols armed and active",
      color: "border-rose-500 bg-rose-950/20 text-rose-400",
      iconBg: "bg-rose-500 text-white",
      icon: Bell,
      cta: "Open Notification Feed",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
            <Sparkles size={14} className="text-teal-600" />
            <span>Interactive Care Ecosystem</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
            360° Care Orbit Visualization
          </h1>
          <p className="text-sm font-medium text-slate-500">
            All care disciplines, schedules, and guardians rotating in real-time around the patient.
          </p>
        </div>

        {/* Vitals Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 shadow-sm border border-slate-200 text-xs font-semibold text-slate-700">
            <Activity size={16} className="text-emerald-500 animate-pulse" />
            <span>Telemetry: <strong className="text-slate-900">Synchronized</strong></span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 shadow-sm border border-slate-200 text-xs font-semibold text-slate-700">
            <Heart size={16} className="text-rose-500" fill="#f43f5e" />
            <span>Adherence: <strong className="text-teal-700 font-extrabold">{adherenceRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* Main 3D Orbit Experience Card */}
      <div className="rounded-[2.5rem] bg-gradient-to-b from-[#0a231d] to-[#071713] p-4 sm:p-6 shadow-2xl border border-teal-900/60 text-white">
        <CareOrbitCanvas
          variant="fullscreen"
          patientName={patientName}
          adherenceRate={adherenceRate}
          activeMedsCount={medications.length}
          nextAppointmentStr={nextAppt ? `${nextAppt.doctor_name} (${nextAppt.specialty})` : "All clear"}
          caregiversCount={caregivers.length}
          unreadAlertsCount={unreadAlerts}
          onSelectNode={(tab) => {
            setSelectedModule(tab);
            onSelectTab(tab);
          }}
        />

        {/* Orbit Control & Status Bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
          {moduleCards.map((m) => {
            const isSelected = selectedModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedModule(m.id);
                  onSelectTab(m.id);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-xs ${
                  isSelected
                    ? "border-teal-400 bg-teal-900/40 text-white shadow-lg shadow-teal-500/10 scale-105"
                    : "border-teal-900/40 bg-slate-900/50 text-slate-400 hover:text-white hover:border-teal-700/60"
                }`}
              >
                <m.icon size={18} className="mb-1 text-teal-300" />
                <span className="font-bold">{m.title}</span>
                <span className="text-[10px] text-teal-400/80 mt-0.5">{m.headline}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Care Node Details Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Medications Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Pill size={20} />
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {completedMeds}/{totalMeds} Taken
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">Medication Routine</h3>
          <p className="mt-1 text-xs text-slate-500">
            {remainingMeds === 0 ? "All scheduled medicines taken today!" : `${remainingMeds} doses awaiting intake today.`}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Daily Compliance</span>
            <span className="text-xs font-black text-emerald-600">{adherenceRate}%</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("medications")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <span>Manage All Medications</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Appointments Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
              <CalendarDays size={20} />
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
              {appointments.length} Total Visits
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">Clinical Appointments</h3>
          <p className="mt-1 text-xs text-slate-500">
            {nextAppt ? `Next: ${nextAppt.doctor_name} (${nextAppt.specialty || "General"}) on ${new Date(nextAppt.scheduled_at).toLocaleDateString([], { month: "short", day: "numeric" })}` : "No scheduled clinical appointments."}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Doctor Reviews</span>
            <span className="text-xs font-black text-sky-600">Up to date</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("appointments")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <span>View Appointments</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Care Circle & SOS Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-md shadow-purple-500/20">
              <Users size={20} />
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 flex items-center gap-1">
              <ShieldAlert size={12} />
              <span>SOS Armed</span>
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">Guardian Network</h3>
          <p className="mt-1 text-xs text-slate-500">
            {caregivers.length} active family members and caregivers with emergency notification access.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Family Check-ins</span>
            <span className="text-xs font-black text-purple-600">Active</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("caregivers")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 py-2.5 text-xs font-bold text-slate-700 transition"
          >
            <span>Coordinate Care Circle</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
