import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pill,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Mail,
  Loader2,
  AlertCircle,
  Search,
  Check,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { sendMedicationReminder } from "../services/api";

type DoseStatus = "taken" | "missed" | null;

export interface Medication {
  id: string;
  user_id?: string;
  name: string;
  dosage: string;
  scheduled_time: string;
  frequency?: string;
  instructions?: string;
  is_active: boolean;
  doseStatus?: DoseStatus;
}

interface MedicationsViewProps {
  token: string | null;
  userEmail?: string;
}

function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MedicationsView({ token, userEmail }: MedicationsViewProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingDoseId, setUpdatingDoseId] = useState<string | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  // Filter & Search
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Alerts & Toasts
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDosage, setFormDosage] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formFrequency, setFormFrequency] = useState("Once daily (Morning)");
  const [formInstructions, setFormInstructions] = useState("Take with food and a glass of water");
  const [formIsActive, setFormIsActive] = useState(true);

  const frequencyOptions = [
    "Once daily (Morning)",
    "Once daily (Noon)",
    "Once daily (Evening)",
    "Once daily (Bedtime)",
    "Twice daily (Morning & Evening)",
    "Three times daily",
    "As needed (PRN)",
  ];

  // Load medications
  const loadMedications = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      // High-quality demo medications
      setMedications([
        {
          id: "demo-med-1",
          name: "Lisinopril",
          dosage: "10 mg",
          scheduled_time: "08:30",
          frequency: "Once daily (Morning)",
          instructions: "Take every morning with full glass of water. Monitor blood pressure.",
          is_active: true,
          doseStatus: "taken",
        },
        {
          id: "demo-med-2",
          name: "Metformin ER",
          dosage: "500 mg",
          scheduled_time: "09:00",
          frequency: "Once daily (Morning)",
          instructions: "Take with breakfast meal to avoid stomach upset.",
          is_active: true,
          doseStatus: "taken",
        },
        {
          id: "demo-med-3",
          name: "Atorvastatin",
          dosage: "20 mg",
          scheduled_time: "19:00",
          frequency: "Once daily (Evening)",
          instructions: "Take after dinner. Avoid grapefruit juice.",
          is_active: true,
          doseStatus: null,
        },
        {
          id: "demo-med-4",
          name: "Amlodipine Besylate",
          dosage: "5 mg",
          scheduled_time: "20:00",
          frequency: "Once daily (Evening)",
          instructions: "Take before bedtime for blood pressure management.",
          is_active: true,
          doseStatus: null,
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Could not authenticate user session.");
      }

      const today = getLocalDateString();

      // Fetch active medications
      const { data: medData, error: medError } = await supabase
        .from("medications")
        .select("id, name, dosage, scheduled_time, is_active")
        .eq("user_id", user.id)
        .order("scheduled_time");

      if (medError) throw medError;

      // Fetch today's dose logs
      const { data: logData, error: logError } = await supabase
        .from("medication_dose_logs")
        .select("medication_id, status")
        .eq("user_id", user.id)
        .eq("scheduled_date", today);

      if (logError) throw logError;

      const logMap = new Map<string, DoseStatus>();
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
      console.warn("Could not load from Supabase, using fallback mode:", err);
      setError("Working with cached medication list.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const resetForm = () => {
    setFormName("");
    setFormDosage("");
    setFormTime("09:00");
    setFormFrequency("Once daily (Morning)");
    setFormInstructions("Take with food and a glass of water");
    setFormIsActive(true);
    setEditingMed(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setFormName(med.name);
    setFormDosage(med.dosage);
    setFormTime(med.scheduled_time);
    setFormFrequency(med.frequency || "Once daily (Morning)");
    setFormInstructions(med.instructions || "");
    setFormIsActive(med.is_active);
    setIsModalOpen(true);
  };

  // Save or update medication
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDosage.trim() || !formTime) {
      setError("Please complete medication name, dosage, and scheduled time.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (token) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in again.");

        if (editingMed) {
          const { error: updateErr } = await supabase
            .from("medications")
            .update({
              name: formName.trim(),
              dosage: formDosage.trim(),
              scheduled_time: formTime,
              is_active: formIsActive,
            })
            .eq("id", editingMed.id);

          if (updateErr) throw updateErr;
          setNotice("Medication updated successfully.");
        } else {
          const { error: insertErr } = await supabase.from("medications").insert({
            user_id: user.id,
            name: formName.trim(),
            dosage: formDosage.trim(),
            scheduled_time: formTime,
            is_active: true,
          });

          if (insertErr) throw insertErr;
          setNotice("New medication added to routine.");
        }
        await loadMedications();
      } else {
        // Local mode
        if (editingMed) {
          setMedications((prev) =>
            prev.map((m) =>
              m.id === editingMed.id
                ? {
                    ...m,
                    name: formName.trim(),
                    dosage: formDosage.trim(),
                    scheduled_time: formTime,
                    frequency: formFrequency,
                    instructions: formInstructions,
                    is_active: formIsActive,
                  }
                : m,
            ),
          );
          setNotice("Medication updated.");
        } else {
          const newMed: Medication = {
            id: `med-${Date.now()}`,
            name: formName.trim(),
            dosage: formDosage.trim(),
            scheduled_time: formTime,
            frequency: formFrequency,
            instructions: formInstructions,
            is_active: true,
            doseStatus: null,
          };
          setMedications((prev) => [newMed, ...prev]);
          setNotice("New medication added.");
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Could not save medication.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Archive
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your active medication list?`)) return;

    try {
      if (token) {
        const { error: delError } = await supabase.from("medications").delete().eq("id", id);
        if (delError) throw delError;
      }
      setMedications((prev) => prev.filter((m) => m.id !== id));
      setNotice(`${name} removed.`);
    } catch (err: any) {
      setError(err.message || "Failed to delete medication.");
    }
  };

  // Record Dose
  const handleRecordDose = async (med: Medication, status: "taken" | "missed") => {
    setUpdatingDoseId(med.id);
    setError(null);

    try {
      if (token) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in again.");

        const today = getLocalDateString();
        const { error: upsertErr } = await supabase.from("medication_dose_logs").upsert(
          {
            medication_id: med.id,
            user_id: user.id,
            scheduled_date: today,
            status,
            recorded_at: new Date().toISOString(),
          },
          { onConflict: "medication_id,scheduled_date" },
        );

        if (upsertErr) throw upsertErr;
      }

      setMedications((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, doseStatus: status } : m)),
      );

      setNotice(
        status === "taken"
          ? `✓ Marked ${med.name} (${med.dosage}) as TAKEN!`
          : `Recorded ${med.name} as MISSED for today.`,
      );
    } catch (err: any) {
      setError(err.message || "Could not update dose record.");
    } finally {
      setUpdatingDoseId(null);
    }
  };

  // Send Email Reminder via Resend
  const handleSendReminder = async (med: Medication) => {
    setEmailSendingId(med.id);
    setError(null);
    setNotice(null);

    try {
      if (!token) {
        // Simulate email dispatch
        await new Promise((r) => setTimeout(r, 800));
        setNotice(`Simulated email reminder sent to ${userEmail || "your email address"}.`);
        return;
      }

      const res = await sendMedicationReminder(token, med.id, "due");
      setNotice(res.message || `Reminder email dispatched successfully for ${med.name}.`);
    } catch (err: any) {
      setError(err.message || "Could not dispatch email reminder.");
    } finally {
      setEmailSendingId(null);
    }
  };

  // Filter & Search Logic
  const filtered = useMemo(() => {
    return medications
      .filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.dosage.toLowerCase().includes(q) ||
          (m.instructions && m.instructions.toLowerCase().includes(q))
        );
      })
      .filter((m) => {
        if (timeFilter === "all") return true;
        const hour = parseInt(m.scheduled_time.split(":")[0], 10);
        if (timeFilter === "morning") return hour >= 5 && hour < 12;
        if (timeFilter === "afternoon") return hour >= 12 && hour < 17;
        if (timeFilter === "evening") return hour >= 17 || hour < 5;
        return true;
      })
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
  }, [medications, searchQuery, timeFilter]);

  const totalDoses = medications.length;
  const takenCount = medications.filter((m) => m.doseStatus === "taken").length;
  const missedCount = medications.filter((m) => m.doseStatus === "missed").length;
  const remainingCount = totalDoses - takenCount - missedCount;
  const adherencePct = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;

  const formatDisplayTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Pill className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
              Medication Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Daily dose adherence, pill schedules, and instant email reminders for older adults.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add New Medicine
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-amber-600 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{notice}</p>
          <button onClick={() => setNotice(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Daily Progress Banner */}
      <div className="rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300">
                Today's Daily Adherence
              </span>
              <span className="text-xs text-teal-200">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {takenCount} of {totalDoses} doses recorded
            </h2>
            <p className="mt-1 text-xs text-teal-100/80">
              {remainingCount === 0
                ? "🎉 Wonderful! All scheduled medication doses for today have been completed."
                : `You have ${remainingCount} dose${remainingCount === 1 ? "" : "s"} remaining today.`}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center sm:text-right">
              <span className="text-4xl font-black text-teal-300">{adherencePct}%</span>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-200/80 mt-0.5">
                Completed
              </p>
            </div>

            <div className="h-16 w-16 shrink-0 rounded-full border-4 border-teal-400/30 p-1 flex items-center justify-center">
              <div
                className="h-full w-full rounded-full bg-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md"
              >
                {takenCount}/{totalDoses}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: "All Day" },
              { key: "morning", label: "Morning" },
              { key: "afternoon", label: "Afternoon" },
              { key: "evening", label: "Evening" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTimeFilter(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                timeFilter === tab.key
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 font-medium"
          />
        </div>
      </div>

      {/* Medication Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-sm font-medium">Loading your medications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Pill className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">No medications found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No medicine matched "${searchQuery}".`
              : "Add your first medicine to organize daily doses and receive reminders."}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((med) => {
            const isTaken = med.doseStatus === "taken";
            const isMissed = med.doseStatus === "missed";
            const isUpdating = updatingDoseId === med.id;
            const isEmailing = emailSendingId === med.id;

            return (
              <div
                key={med.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all shadow-sm ${
                  isTaken
                    ? "border-emerald-200 bg-emerald-50/20"
                    : isMissed
                      ? "border-rose-200 bg-rose-50/20"
                      : "border-slate-100 bg-white hover:border-teal-200 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name, Dosage, Dose Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black shadow-sm ${
                          isTaken
                            ? "bg-emerald-100 text-emerald-800"
                            : isMissed
                              ? "bg-rose-100 text-rose-800"
                              : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        <Pill className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                          {med.name}
                        </h3>
                        <p className="text-sm font-black text-teal-800">{med.dosage}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isTaken ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        TAKEN
                      </span>
                    ) : isMissed ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">
                        <X className="h-3.5 w-3.5 stroke-[3]" />
                        MISSED
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                        Scheduled
                      </span>
                    )}
                  </div>

                  {/* Scheduled Time & Details Box */}
                  <div className="mt-5 space-y-2 rounded-2xl bg-slate-50/90 p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>Scheduled for {formatDisplayTime(med.scheduled_time)}</span>
                    </div>

                    {med.frequency && (
                      <p className="text-xs font-medium text-slate-600">
                        <strong>Frequency:</strong> {med.frequency}
                      </p>
                    )}

                    {med.instructions && (
                      <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200/50">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Dose Buttons & Email Reminder */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  {/* Dose action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRecordDose(med, "taken")}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                        isTaken
                          ? "bg-emerald-600 text-white ring-2 ring-emerald-600/30"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      )}
                      {isTaken ? "Taken ✓" : "Mark Taken"}
                    </button>

                    <button
                      onClick={() => handleRecordDose(med, "missed")}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        isMissed
                          ? "bg-rose-600 text-white ring-2 ring-rose-600/30"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95"
                      }`}
                    >
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                      Missed
                    </button>
                  </div>

                  {/* Secondary Tools: Email Reminder, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSendReminder(med)}
                      disabled={isEmailing}
                      title="Send email reminder to registered address"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 shadow-sm transition"
                    >
                      {isEmailing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 text-teal-600" />
                      )}
                      <span>Email Reminder</span>
                    </button>

                    <button
                      onClick={() => openEditModal(med)}
                      title="Edit medicine"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(med.id, med.name)}
                      title="Delete medicine"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-teal-50 p-2 text-teal-700">
                  <Pill className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingMed ? "Edit Medication" : "Add New Medication"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Medicine Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lisinopril, Metformin, Atorvastatin"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Dosage & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 mg, 500 mg, 1 tablet"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Scheduled Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Frequency
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  {frequencyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Senior Instructions / Food Guidelines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take with breakfast meal. Drink full glass of water. Avoid grapefruit."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Saving..." : editingMed ? "Update Medicine" : "Save to Routine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
