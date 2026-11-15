import { useState, useEffect, useCallback } from "react";
import AuthGate, { type DemoUser } from "./components/AuthGate";
import Sidebar, { type TabType } from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView, { type DashboardMedication } from "./components/DashboardView";
import MedicationsView from "./components/MedicationsView";
import AppointmentsView from "./components/AppointmentsView";
import CaregiversView from "./components/CaregiversView";
import ReportsView from "./components/ReportsView";
import ProfileView from "./components/ProfileView";
import NotificationsView from "./components/NotificationsView";
import EmergencySosModal from "./components/EmergencySosModal";
import { supabase } from "./lib/supabase";
import {
  getAppointments,
  getCaregivers,
  getCaregiverActivity,
  getNotifications,
  getPatientProfile,
  sendMedicationReminder,
  type Appointment,
  type Caregiver,
  type CaregiverActivity,
  type NotificationItem,
  type PatientProfile,
} from "./services/api";
import { ShieldAlert, Sparkles, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

interface AppShellProps {
  token: string | null;
  userEmail: string;
  isDemo: boolean;
  demoUser: DemoUser | null;
  onSignOut: () => Promise<void>;
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AppShell({ token, userEmail, isDemo, demoUser, onSignOut }: AppShellProps) {
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  // Core Data States
  const [medications, setMedications] = useState<DashboardMedication[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [updatingMedId, setUpdatingMedId] = useState<string | null>(null);
  const [sendingEmailMedId, setSendingEmailMedId] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [caregiverActivity, setCaregiverActivity] = useState<CaregiverActivity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  const [globalNotice, setGlobalNotice] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load Medications
  const loadMedications = useCallback(async () => {
    setLoadingMeds(true);

    if (isDemo || !token) {
      setMedications([
        {
          id: "demo-med-1",
          name: "Lisinopril",
          dosage: "10 mg",
          scheduled_time: "08:30",
          instructions: "Take every morning with full glass of water. Monitor blood pressure.",
          is_active: true,
          doseStatus: "taken",
        },
        {
          id: "demo-med-2",
          name: "Metformin ER",
          dosage: "500 mg",
          scheduled_time: "09:00",
          instructions: "Take with breakfast meal to avoid stomach upset.",
          is_active: true,
          doseStatus: "taken",
        },
        {
          id: "demo-med-3",
          name: "Atorvastatin",
          dosage: "20 mg",
          scheduled_time: "19:00",
          instructions: "Take after dinner. Avoid grapefruit juice.",
          is_active: true,
          doseStatus: null,
        },
        {
          id: "demo-med-4",
          name: "Amlodipine Besylate",
          dosage: "5 mg",
          scheduled_time: "20:00",
          instructions: "Take before bedtime for blood pressure management.",
          is_active: true,
          doseStatus: null,
        },
      ]);
      setLoadingMeds(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingMeds(false);
        return;
      }

      const today = getLocalDateString();

      const { data: medData, error: medError } = await supabase
        .from("medications")
        .select("id, name, dosage, scheduled_time, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("scheduled_time");

      if (medError) throw medError;

      const { data: logData, error: logError } = await supabase
        .from("medication_dose_logs")
        .select("medication_id, status")
        .eq("user_id", user.id)
        .eq("scheduled_date", today);

      if (logError) throw logError;

      const logMap = new Map<string, "taken" | "missed">();
      (logData || []).forEach((log) => {
        if (log.status === "taken" || log.status === "missed") {
          logMap.set(log.medication_id, log.status);
        }
      });

      setMedications(
        (medData || []).map((m) => ({
          ...m,
          doseStatus: logMap.get(m.id) ?? null,
        })),
      );
    } catch (err: any) {
      console.warn("Could not load medications from Supabase:", err);
    } finally {
      setLoadingMeds(false);
    }
  }, [isDemo, token]);

  // Load Auxiliary Data (Appointments, Caregivers, Notifications, Profile)
  const loadAuxiliaryData = useCallback(async () => {
    if (isDemo || !token) {
      setAppointments([
        {
          id: "demo-apt-1",
          doctor_name: "Dr. Evelyn Vance",
          specialty: "Cardiologist",
          clinic_name: "Metro Heart & Vascular Center, Suite 410",
          scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
          notes: "Routine quarterly hypertension review. Bring current medication list.",
          status: "scheduled",
        },
        {
          id: "demo-apt-2",
          doctor_name: "Dr. Marcus Reed",
          specialty: "Ophthalmologist",
          clinic_name: "St. Jude Eye Care Clinic",
          scheduled_at: new Date(Date.now() + 86400000 * 6).toISOString(),
          notes: "Annual glaucoma screening and prescription glasses renewal.",
          status: "scheduled",
        },
      ]);

      setCaregivers([
        {
          id: "demo-cg-1",
          name: "Sarah Jenkins",
          relationship: "Daughter (Primary Guardian)",
          phone: "(555) 234-8901",
          email: "sarah.jenkins@example.com",
          is_primary: true,
        },
        {
          id: "demo-cg-2",
          name: "Michael Jenkins",
          relationship: "Son",
          phone: "(555) 876-5432",
          email: "m.jenkins@example.com",
          is_primary: false,
        },
      ]);

      setCaregiverActivity([
        {
          id: "act-1",
          caregiver_name: "Sarah Jenkins",
          action: "Morning Health & Dose Check",
          note: "Confirmed morning Lisinopril and Metformin taken on time. Refilled fresh water.",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "act-2",
          caregiver_name: "Elena Rostova, RN",
          action: "Clinical Vitals Review",
          note: "Blood pressure 124/82 mmHg, resting pulse 71 bpm. Lungs clear. Next visit Thursday.",
          created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
        },
      ]);

      setNotifications([
        {
          id: "notif-1",
          title: "Morning Medication Due",
          message: "Time to take Lisinopril (10mg) with a glass of water.",
          type: "medication",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: "notif-2",
          title: "Upcoming Doctor Appointment",
          message: "Consultation with Dr. Evelyn Vance in 2 days.",
          type: "appointment",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
      ]);

      setProfile({
        id: "demo-profile-1",
        email: userEmail,
        full_name: demoUser?.full_name || "Eleanor Vance",
        role: demoUser?.role || "patient",
        dob: "1948-06-14",
        blood_type: "A+",
        allergies: "Penicillin, Sulfa medications, Shellfish",
        medical_notes: "Hypertension (controlled), Type 2 Diabetes, Mild Osteoarthritis.",
        emergency_contact_name: "Sarah Jenkins",
        emergency_contact_phone: "(555) 234-8901",
        emergency_contact_email: "sarah.jenkins@example.com",
      });

      return;
    }

    try {
      const [aptRes, cgRes, actRes, notifRes, profRes] = await Promise.allSettled([
        getAppointments(token),
        getCaregivers(token),
        getCaregiverActivity(token),
        getNotifications(token),
        getPatientProfile(token),
      ]);

      if (aptRes.status === "fulfilled") setAppointments(aptRes.value);
      if (cgRes.status === "fulfilled") setCaregivers(cgRes.value);
      if (actRes.status === "fulfilled") setCaregiverActivity(actRes.value);
      if (notifRes.status === "fulfilled") setNotifications(notifRes.value);
      if (profRes.status === "fulfilled") setProfile(profRes.value);
    } catch (err) {
      console.warn("Could not load backend auxiliary data:", err);
    }
  }, [isDemo, token, userEmail, demoUser]);

  useEffect(() => {
    loadMedications();
    loadAuxiliaryData();
  }, [loadMedications, loadAuxiliaryData]);

  // Set Dose Status Action (used in Dashboard & Medications views)
  const handleSetDoseStatus = async (
    med: DashboardMedication,
    status: "taken" | "missed",
  ) => {
    setUpdatingMedId(med.id);
    setGlobalError(null);

    try {
      if (!isDemo && token) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const today = getLocalDateString();
          await supabase.from("medication_dose_logs").upsert(
            {
              medication_id: med.id,
              user_id: user.id,
              scheduled_date: today,
              status,
              recorded_at: new Date().toISOString(),
            },
            { onConflict: "medication_id,scheduled_date" },
          );
        }
      }

      setMedications((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, doseStatus: status } : m)),
      );

      setGlobalNotice(
        status === "taken"
          ? `✓ Great job! Marked ${med.name} (${med.dosage}) as taken.`
          : `Recorded ${med.name} as missed for today.`,
      );
      setTimeout(() => setGlobalNotice(null), 4000);
    } catch (err: any) {
      setGlobalError(err.message || "Failed to update dose status.");
    } finally {
      setUpdatingMedId(null);
    }
  };

  // Send Email Reminder Action (used in Dashboard & Medications views)
  const handleSendReminder = async (med: DashboardMedication) => {
    setSendingEmailMedId(med.id);
    setGlobalError(null);
    setGlobalNotice(null);

    try {
      if (isDemo || !token) {
        await new Promise((r) => setTimeout(r, 600));
        setGlobalNotice(`Demo reminder email triggered for ${med.name} (${med.dosage}).`);
        setTimeout(() => setGlobalNotice(null), 4000);
        return;
      }

      const res = await sendMedicationReminder(token, med.id, "due");
      setGlobalNotice(res.message || `Reminder email dispatched successfully for ${med.name}.`);
      setTimeout(() => setGlobalNotice(null), 5000);
    } catch (err: any) {
      setGlobalError(err.message || "Could not dispatch email reminder.");
    } finally {
      setSendingEmailMedId(null);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;
  const completedMeds = medications.filter((m) => m.doseStatus === "taken").length;
  const totalMeds = medications.length;
  const adherencePercentage =
    totalMeds > 0 ? Math.round((completedMeds / totalMeds) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col antialiased selection:bg-teal-500 selection:text-white">
      {/* Demonstration Mode Notice Banner */}
      {isDemo && (
        <div className="sticky top-0 z-[60] flex items-center justify-between bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-4 py-2 text-xs font-bold text-white shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
            <span>
              Demonstration Mode Active:{" "}
              <span className="font-extrabold underline">
                {demoUser?.full_name} ({demoUser?.role === "patient" ? "Senior / Patient" : "Family Caregiver"})
              </span>
              . Interactive sandbox enabled.
            </span>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-1 text-[11px] font-bold text-white hover:bg-black/30 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit Demo
          </button>
        </div>
      )}

      {/* Global Alerts Banner */}
      {globalNotice && (
        <div className="fixed bottom-6 left-6 z-[70] flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          <span>{globalNotice}</span>
        </div>
      )}

      {globalError && (
        <div className="fixed bottom-6 left-6 z-[70] flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-600 px-5 py-3.5 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-white" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Main Shell Layout */}
      <div className="flex flex-1">
        {/* Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenSos={() => setIsSosModalOpen(true)}
          onSignOut={onSignOut}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          userEmail={userEmail}
          role={profile?.role || "patient"}
        />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-72">
          {/* Top Header */}
          <Header
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onSelectTab={setCurrentTab}
            userName={profile?.full_name || demoUser?.full_name || "Eleanor Vance"}
            userEmail={userEmail}
            role={profile?.role || "patient"}
            unreadCount={unreadNotificationsCount}
            adherencePercentage={adherencePercentage}
            totalMeds={totalMeds}
            completedMeds={completedMeds}
            onSignOut={onSignOut}
          />

          {/* Main View Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {currentTab === "dashboard" && (
              <DashboardView
                onSelectTab={setCurrentTab}
                medications={medications}
                loadingMedications={loadingMeds}
                onSetDoseStatus={handleSetDoseStatus}
                onSendReminder={handleSendReminder}
                updatingMedId={updatingMedId}
                sendingEmailMedId={sendingEmailMedId}
                appointments={appointments}
                notifications={notifications}
                caregiverActivity={caregiverActivity}
                caregiversCount={caregivers.length}
              />
            )}

            {currentTab === "medications" && (
              <MedicationsView token={token} userEmail={userEmail} />
            )}

            {currentTab === "appointments" && (
              <AppointmentsView
                token={token}
                onNavigateToMedications={() => setCurrentTab("medications")}
              />
            )}

            {currentTab === "caregivers" && <CaregiversView token={token} />}

            {currentTab === "reports" && <ReportsView token={token} />}

            {currentTab === "profile" && <ProfileView token={token} />}

            {currentTab === "notifications" && <NotificationsView token={token} />}
          </main>
        </div>
      </div>

      {/* Floating Emergency SOS Pill for Quick Senior Access */}
      <button
        onClick={() => setIsSosModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-rose-600 px-6 py-4 text-base font-black text-white shadow-2xl shadow-rose-600/50 hover:bg-rose-700 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-rose-300"
        title="Emergency SOS Alert (Hold to trigger)"
      >
        <ShieldAlert className="h-6 w-6 animate-pulse" />
        <span className="tracking-wide">EMERGENCY SOS</span>
      </button>

      {/* Emergency SOS Modal */}
      <EmergencySosModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        token={token || undefined}
        patientName={profile?.full_name || demoUser?.full_name || "Eleanor Vance"}
        emergencyContactName={profile?.emergency_contact_name || "Sarah Jenkins"}
        emergencyContactEmail={profile?.emergency_contact_email || "sarah.jenkins@example.com"}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      {({ demoUser, isDemo, token, userEmail, onSignOut }) => (
        <AppShell
          token={token}
          userEmail={userEmail}
          isDemo={isDemo}
          demoUser={demoUser}
          onSignOut={onSignOut}
        />
      )}
    </AuthGate>
  );
}
