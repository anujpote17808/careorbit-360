import {
  CheckCircle2,
  Clock3,
  CalendarDays,
  Users,
  Pill,
  AlertCircle,
  Mail,
  Loader2,
  HeartHandshake,
  Activity,
  Plus,
  Sparkles,
  Maximize2,
} from "lucide-react";
import CareOrbitCanvas from "./CareOrbitCanvas";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";
import type { TabType } from "./Sidebar";
import type { Appointment, NotificationItem, CaregiverActivity } from "../services/api";

export interface DashboardMedication {
  id: string;
  name: string;
  dosage: string;
  scheduled_time: string;
  instructions?: string;
  is_active: boolean;
  doseStatus: "taken" | "missed" | null;
}

interface DashboardViewProps {
  onSelectTab: (tab: TabType) => void;
  medications: DashboardMedication[];
  loadingMedications: boolean;
  onSetDoseStatus: (med: DashboardMedication, status: "taken" | "missed") => Promise<void>;
  onSendReminder: (med: DashboardMedication) => Promise<void>;
  updatingMedId: string | null;
  sendingEmailMedId: string | null;
  appointments: Appointment[];
  notifications: NotificationItem[];
  caregiverActivity: CaregiverActivity[];
  caregiversCount: number;
}

export default function DashboardView({
  onSelectTab,
  medications,
  loadingMedications,
  onSetDoseStatus,
  onSendReminder,
  updatingMedId,
  sendingEmailMedId,
  appointments,
  notifications,
  caregiverActivity,
  caregiversCount,
}: DashboardViewProps) {
  const totalMeds = medications.length;
  const completedMeds = medications.filter((m) => m.doseStatus === "taken").length;
  const missedMeds = medications.filter((m) => m.doseStatus === "missed").length;
  const remainingMeds = Math.max(0, totalMeds - completedMeds - missedMeds);

  const adherenceRate =
    totalMeds > 0 ? Math.round((completedMeds / totalMeds) * 100) : 100;

  // Next upcoming appointment
  const nextAppointment = appointments.find((a) => a.status === "scheduled");

  // Format weekly dummy/real chart data
  const weeklyData = [
    { day: "Mon", rate: 100 },
    { day: "Tue", rate: 85 },
    { day: "Wed", rate: 100 },
    { day: "Thu", rate: 90 },
    { day: "Fri", rate: 95 },
    { day: "Sat", rate: 100 },
    { day: "Sun", rate: adherenceRate },
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* 1. MAIN HERO CARD: DAILY CARE SNAPSHOT                        */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1c5344] via-[#246755] to-[#133c32] p-7 md:p-10 text-white shadow-xl shadow-[#194539]/20 border border-[#2e7964]">
        {/* Subtle decorative background circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-48 h-60 w-60 rounded-full bg-[#52d3a8]/10 blur-xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#98f2d5] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#52d3a8] animate-ping" />
              Daily Care Snapshot
            </div>

            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {adherenceRate === 100 && totalMeds > 0
                ? "Outstanding! All doses completed today."
                : totalMeds === 0
                  ? "Welcome! Add your medications to start tracking."
                  : `${completedMeds} of ${totalMeds} scheduled doses completed today.`}
            </h2>

            <p className="mt-3 text-sm md:text-base text-[#d4ebe2] leading-relaxed max-w-xl">
              Keep up the steady routine. Everyday consistency helps maintain vitality and peace of mind for you and your family.
            </p>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onSelectTab("medications")}
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#174639] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#ebf8f2] active:scale-[0.98]"
              >
                <Pill size={17} className="text-[#2b866c]" />
                Manage All Medicines
              </button>

              <button
                type="button"
                onClick={() => onSelectTab("reports")}
                className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Activity size={17} className="text-[#8ef2d3]" />
                View Adherence Report
              </button>
            </div>
          </div>

          {/* Right Progress Ring & Stats */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-3xl bg-white/10 p-6 md:p-8 backdrop-blur-lg border border-white/15 text-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-white/20 bg-white/5 shadow-inner">
              <div className="text-center">
                <span className="text-4xl font-black text-white">{adherenceRate}%</span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#98f2d5]">
                  Adherence
                </span>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-6 w-full max-w-xs">
              <div className="flex justify-between text-xs font-semibold text-[#d4ebe2] mb-1.5">
                <span>Completed: {completedMeds}</span>
                <span>Remaining: {remainingMeds}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full rounded-full bg-[#52d3a8] transition-all duration-500 shadow-sm"
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 1B. 3D CARE ORBIT INTERACTIVE CENTERPIECE                     */}
      {/* ============================================================== */}
      <section className="rounded-[2.5rem] bg-gradient-to-b from-[#0a231d] to-[#071713] p-5 sm:p-7 text-white shadow-xl border border-teal-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-teal-900/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
              <Sparkles size={13} className="text-teal-400" />
              <span>Interactive Care Ecosystem</span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">Live Patient Care Orbit</h3>
            <p className="text-xs text-teal-200/70">
              Hover or click any node to jump directly to medications, appointments, or the care circle.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("orbit")}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl bg-teal-600/80 hover:bg-teal-600 px-3.5 py-2 text-xs font-bold text-white transition border border-teal-400/30 shadow-md"
          >
            <Maximize2 size={13} />
            <span>Full 360° Studio</span>
          </button>
        </div>

        <CareOrbitCanvas
          variant="hero"
          patientName="Eleanor Vance"
          adherenceRate={adherenceRate}
          activeMedsCount={medications.length}
          nextAppointmentStr={
            nextAppointment
              ? `${nextAppointment.doctor_name} (${nextAppointment.specialty || "Clinical"})`
              : "All appointments clear"
          }
          caregiversCount={caregiversCount}
          unreadAlertsCount={notifications.filter((n) => !n.is_read).length}
          onSelectNode={(tab) => onSelectTab(tab)}
        />
      </section>

      {/* ============================================================== */}
      {/* 2. DASHBOARD STATISTICS CARDS (4 METRICS)                      */}
      {/* ============================================================== */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Doses Taken */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#e6eee9] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71877e]">
              Doses Taken
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e6f7ef] text-[#2c8d6e]">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e483d]">{completedMeds}</span>
            <span className="text-xs font-semibold text-[#71877e]">
              of {totalMeds} doses
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#3aa686]">
            {completedMeds > 0 ? "Daily routine on track" : "Awaiting first dose"}
          </p>
        </div>

        {/* Card 2: Remaining Today */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#e6eee9] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71877e]">
              Remaining Today
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff2df] text-[#d48c3b]">
              <Clock3 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e483d]">{remainingMeds}</span>
            <span className="text-xs font-semibold text-[#71877e]">pending</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#bd8037]">
            {remainingMeds === 0 ? "All scheduled completed" : "Scheduled for today"}
          </p>
        </div>

        {/* Card 3: Upcoming Doctor Visits */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#e6eee9] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71877e]">
              Upcoming Visits
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebf1ff] text-[#486ecc]">
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-[#1e483d] truncate block">
              {nextAppointment ? nextAppointment.doctor_name : "None scheduled"}
            </span>
            <span className="text-xs font-semibold text-[#71877e] truncate block">
              {nextAppointment ? nextAppointment.clinic_name : "Routine checkups"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("appointments")}
            className="mt-2 text-xs font-bold text-[#486ecc] hover:underline"
          >
            {nextAppointment ? "View details →" : "+ Schedule appointment"}
          </button>
        </div>

        {/* Card 4: Care Network */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#e6eee9] transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71877e]">
              Care Network
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5eaff] text-[#9352c9]">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1e483d]">{caregiversCount || 2}</span>
            <span className="text-xs font-semibold text-[#71877e]">active caregivers</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#9352c9]">
            Family circle connected
          </p>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. DASHBOARD LOWER SECTION: SCHEDULE & ACTIVITY               */}
      {/* ============================================================== */}
      <div className="grid gap-7 lg:grid-cols-12">
        {/* Left Column (8 cols): Today's Schedule + Weekly Trend */}
        <div className="lg:col-span-8 space-y-7">
          {/* Today's Medication Schedule */}
          <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-[#e6eee9]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#1d443a]">
                  Today's Medication Schedule
                </h3>
                <p className="text-xs text-[#71877e] mt-1">
                  Click the green check to record taken, red alert for missed, or blue envelope for email reminder.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectTab("medications")}
                className="flex items-center gap-1.5 text-xs font-bold text-[#2a8369] hover:underline"
              >
                <Plus size={15} />
                Add Medication
              </button>
            </div>

            {loadingMedications ? (
              <div className="flex min-h-48 items-center justify-center gap-3 text-[#71877e]">
                <Loader2 size={24} className="animate-spin text-[#2b866c]" />
                <span className="font-semibold text-sm">Loading today's schedule...</span>
              </div>
            ) : medications.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#deebe4] rounded-2xl">
                <Pill size={36} className="text-[#a4ccbb]" />
                <p className="mt-3 font-bold text-[#2b574a]">No medications scheduled</p>
                <p className="text-xs text-[#7f948b] mt-1 max-w-sm">
                  Add your daily medications to organize doses and automate reminders.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectTab("medications")}
                  className="mt-4 rounded-xl bg-[#257c64] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a5f4d] transition"
                >
                  Create Medication
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                      med.doseStatus === "taken"
                        ? "border-[#c4e8d8] bg-[#f5fbf8]"
                        : med.doseStatus === "missed"
                          ? "border-red-200 bg-red-50/50"
                          : "border-[#e5eee9] bg-white hover:border-[#b4dbcc]"
                    }`}
                  >
                    {/* Medication Details */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`rounded-2xl p-3 shrink-0 ${
                          med.doseStatus === "taken"
                            ? "bg-[#257c64] text-white"
                            : med.doseStatus === "missed"
                              ? "bg-red-600 text-white"
                              : "bg-[#eaf6f0] text-[#2b856b]"
                        }`}
                      >
                        <Pill size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#1a4439] truncate text-base">
                            {med.name}
                          </h4>
                          {med.doseStatus === "taken" && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                              TAKEN
                            </span>
                          )}
                          {med.doseStatus === "missed" && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-800">
                              MISSED
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#71877e] mt-0.5">
                          <strong>Dosage:</strong> {med.dosage}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#71877e]">
                          <span className="flex items-center gap-1 font-semibold text-[#1e483d]">
                            <Clock3 size={13} className="text-[#3aa686]" />
                            {med.scheduled_time.slice(0, 5)}
                          </span>
                          {med.instructions && (
                            <span className="italic text-[#83978f] truncate max-w-[200px]">
                              "{med.instructions}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Mark Taken Button */}
                      <button
                        type="button"
                        disabled={updatingMedId === med.id || sendingEmailMedId === med.id}
                        onClick={() => void onSetDoseStatus(med, "taken")}
                        aria-label={`Mark ${med.name} as taken`}
                        title="Record as Taken"
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 ${
                          med.doseStatus === "taken"
                            ? "bg-[#257c64] text-white shadow-sm"
                            : "bg-[#eaf6f0] text-[#2b856b] hover:bg-[#d6efe3]"
                        }`}
                      >
                        {updatingMedId === med.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        <span>Taken</span>
                      </button>

                      {/* Mark Missed Button */}
                      <button
                        type="button"
                        disabled={updatingMedId === med.id || sendingEmailMedId === med.id}
                        onClick={() => void onSetDoseStatus(med, "missed")}
                        aria-label={`Mark ${med.name} as missed`}
                        title="Record as Missed"
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                          med.doseStatus === "missed"
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                      >
                        <AlertCircle size={15} />
                        <span className="hidden sm:inline">Missed</span>
                      </button>

                      {/* Send Email Reminder Button */}
                      <button
                        type="button"
                        disabled={updatingMedId === med.id || sendingEmailMedId === med.id}
                        onClick={() => void onSendReminder(med)}
                        aria-label={`Send email reminder for ${med.name}`}
                        title="Send Email Reminder Now via Resend"
                        className="flex items-center justify-center rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                      >
                        {sendingEmailMedId === med.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Mail size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Adherence Summary Mini-Chart */}
          <div className="rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-[#e6eee9]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1d443a]">
                  Weekly Adherence Summary
                </h3>
                <p className="text-xs text-[#71877e] mt-0.5">
                  7-day consistency rate across all scheduled medication times
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab("reports")}
                className="text-xs font-bold text-[#2a8369] hover:underline"
              >
                Full Analytics →
              </button>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis
                    dataKey="day"
                    stroke="#71877e"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#163a31",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                      border: "none",
                    }}
                    formatter={(val: any) => [`${val}%`, "Adherence"]}
                  />
                  <Bar
                    dataKey="rate"
                    fill="#3aa686"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Appointments, Caregiver Feed, Notifications */}
        <div className="lg:col-span-4 space-y-7">
          {/* Upcoming Appointments Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#e6eee9]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1d443a]">
                <CalendarDays size={18} className="text-[#3aa686]" />
                Upcoming Visits
              </div>
              <button
                onClick={() => onSelectTab("appointments")}
                className="text-xs font-bold text-[#2a8369] hover:underline"
              >
                View all
              </button>
            </div>

            {appointments.length === 0 ? (
              <p className="text-xs text-[#82938b] py-4 text-center">
                No doctor visits scheduled. Keep your medical checkups organized here.
              </p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 2).map((app) => (
                  <div
                    key={app.id}
                    className="rounded-2xl bg-[#f8fbf9] p-3.5 border border-[#e8f1ec]"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-xs text-[#1e483d]">
                        {app.doctor_name}
                      </p>
                      <span className="rounded-full bg-[#e8f6f0] px-2 py-0.5 text-[10px] font-bold text-[#2a8369]">
                        {app.specialty || "Checkup"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71877e] mt-1">
                      {app.clinic_name}
                    </p>
                    <p className="text-[11px] font-bold text-[#3aa686] mt-2 flex items-center gap-1">
                      <Clock3 size={11} />
                      {new Date(app.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caregiver Activity Feed */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#e6eee9]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1d443a]">
                <HeartHandshake size={18} className="text-[#3aa686]" />
                Caregiver Activity
              </div>
              <button
                onClick={() => onSelectTab("caregivers")}
                className="text-xs font-bold text-[#2a8369] hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {caregiverActivity.slice(0, 3).map((act) => (
                <div key={act.id} className="text-xs border-l-2 border-[#3aa686] pl-3 py-1">
                  <div className="flex justify-between text-[#1e483d] font-bold">
                    <span>{act.caregiver_name}</span>
                    <span className="text-[10px] text-[#869991]">
                      {new Date(act.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#556e64] mt-0.5 font-medium">{act.action}</p>
                  {act.note && (
                    <p className="text-[11px] text-[#71877e] italic mt-0.5">"{act.note}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notifications Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#e6eee9]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#1d443a]">Recent Alerts</h4>
              <button
                onClick={() => onSelectTab("notifications")}
                className="text-xs font-bold text-[#2a8369] hover:underline"
              >
                Inbox
              </button>
            </div>

            <div className="space-y-2.5">
              {notifications.slice(0, 2).map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl p-2.5 bg-[#fbfdfc] border border-gray-100 text-xs"
                >
                  <p className="font-bold text-[#1e483d] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3aa686]" />
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[#71877e] mt-1 line-clamp-2">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
