import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Loader2,
  X,
  Search,
} from "lucide-react";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type Appointment,
} from "../services/api";

interface AppointmentsViewProps {
  token: string | null;
  onNavigateToMedications?: () => void;
}

export default function AppointmentsView({ token }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("General Physician");
  const [clinicName, setClinicName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const specialties = [
    "General Physician",
    "Cardiologist",
    "Neurologist",
    "Orthopedic",
    "Ophthalmologist",
    "Dentist",
    "Endocrinologist",
    "Physical Therapy",
    "Other",
  ];

  // Load appointments
  const fetchAppointments = async () => {
    if (!token) {
      // Mock data for demo/offline
      setAppointments([
        {
          id: "demo-apt-1",
          doctor_name: "Dr. Evelyn Vance",
          specialty: "Cardiologist",
          clinic_name: "Metro Heart & Vascular Center, Suite 410",
          scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days ahead
          notes: "Routine quarterly hypertension review. Bring current medication list and morning blood pressure log.",
          status: "scheduled",
        },
        {
          id: "demo-apt-2",
          doctor_name: "Dr. Marcus Reed",
          specialty: "Ophthalmologist",
          clinic_name: "St. Jude Eye Care Clinic",
          scheduled_at: new Date(Date.now() + 86400000 * 6).toISOString(), // 6 days ahead
          notes: "Annual glaucoma screening and prescription glasses renewal.",
          status: "scheduled",
        },
        {
          id: "demo-apt-3",
          doctor_name: "Dr. Sarah Lin",
          specialty: "Primary Care",
          clinic_name: "Northside Community Clinic",
          scheduled_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
          notes: "Annual wellness checkup and blood panel review.",
          status: "completed",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAppointments(token);
      setAppointments(data);
    } catch (err: any) {
      console.warn("Could not load appointments from backend:", err);
      setError("Using offline appointment storage.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const resetForm = () => {
    setDoctorName("");
    setSpecialty("General Physician");
    setClinicName("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setAppointmentDate(tomorrow.toISOString().split("T")[0]);
    setAppointmentTime("10:00");
    setNotes("");
    setEditingAppointment(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setDoctorName(apt.doctor_name);
    setSpecialty(apt.specialty || "General Physician");
    setClinicName(apt.clinic_name);
    try {
      const dt = new Date(apt.scheduled_at);
      setAppointmentDate(dt.toISOString().split("T")[0]);
      setAppointmentTime(
        `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
      );
    } catch {
      setAppointmentDate("");
      setAppointmentTime("10:00");
    }
    setNotes(apt.notes || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !clinicName.trim() || !appointmentDate || !appointmentTime) {
      setError("Please fill out the doctor, clinic, date, and time fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const scheduledAt = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

    try {
      if (token) {
        if (editingAppointment) {
          await updateAppointment(token, editingAppointment.id, {
            doctor_name: doctorName.trim(),
            specialty,
            clinic_name: clinicName.trim(),
            scheduled_at: scheduledAt,
            notes: notes.trim(),
          });
          setSuccessNotice("Appointment updated successfully.");
        } else {
          await createAppointment(token, {
            doctor_name: doctorName.trim(),
            specialty,
            clinic_name: clinicName.trim(),
            scheduled_at: scheduledAt,
            notes: notes.trim(),
            status: "scheduled",
          });
          setSuccessNotice("New appointment scheduled.");
        }
        await fetchAppointments();
      } else {
        // Local state update
        if (editingAppointment) {
          setAppointments((prev) =>
            prev.map((item) =>
              item.id === editingAppointment.id
                ? {
                    ...item,
                    doctor_name: doctorName.trim(),
                    specialty,
                    clinic_name: clinicName.trim(),
                    scheduled_at: scheduledAt,
                    notes: notes.trim(),
                  }
                : item,
            ),
          );
          setSuccessNotice("Appointment updated.");
        } else {
          const newApt: Appointment = {
            id: `local-${Date.now()}`,
            doctor_name: doctorName.trim(),
            specialty,
            clinic_name: clinicName.trim(),
            scheduled_at: scheduledAt,
            notes: notes.trim(),
            status: "scheduled",
          };
          setAppointments((prev) => [newApt, ...prev]);
          setSuccessNotice("Appointment scheduled.");
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and remove this appointment?")) return;
    try {
      if (token) {
        await deleteAppointment(token, id);
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setSuccessNotice("Appointment cancelled.");
    } catch (err: any) {
      setError(err.message || "Could not delete appointment.");
    }
  };

  const handleToggleComplete = async (apt: Appointment) => {
    const nextStatus = apt.status === "completed" ? "scheduled" : "completed";
    try {
      if (token) {
        await updateAppointment(token, apt.id, { status: nextStatus });
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, status: nextStatus } : a)),
      );
      setSuccessNotice(
        nextStatus === "completed" ? "Appointment marked as completed." : "Appointment rescheduled.",
      );
    } catch (err: any) {
      setError(err.message || "Could not update appointment status.");
    }
  };

  // Filtered Appointments
  const filtered = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => {
        const aptDate = new Date(a.scheduled_at);
        const isPast = aptDate < now || a.status === "completed";
        if (activeTab === "upcoming") {
          return !isPast;
        } else {
          return isPast;
        }
      })
      .filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.doctor_name.toLowerCase().includes(q) ||
          (a.specialty && a.specialty.toLowerCase().includes(q)) ||
          a.clinic_name.toLowerCase().includes(q) ||
          (a.notes && a.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      });
  }, [appointments, activeTab, searchQuery]);

  const upcomingCount = appointments.filter(
    (a) => new Date(a.scheduled_at) >= new Date() && a.status !== "completed",
  ).length;

  const formatAptDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
        monthDay: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        diffDays: Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      };
    } catch {
      return { weekday: "", monthDay: isoString, time: "", diffDays: 0 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <CalendarDays className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
              Doctor & Care Appointments
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Keep track of doctor consultations, clinical lab visits, and routine senior health check-ups.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Schedule Appointment
        </button>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-amber-600 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successNotice}</p>
          <button onClick={() => setSuccessNotice(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "upcoming"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Upcoming Visits
            {upcomingCount > 0 && (
              <span
                className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "upcoming"
                    ? "bg-teal-900 text-teal-100"
                    : "bg-teal-600 text-white"
                }`}
              >
                {upcomingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === "past"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Past & Completed
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctor or clinic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 font-medium"
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-3 text-sm font-medium">Loading appointments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Calendar className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">
            {activeTab === "upcoming" ? "No upcoming appointments scheduled" : "No past appointments found"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {activeTab === "upcoming"
              ? "Keep your health on track by adding your upcoming clinical or specialist visits."
              : "Completed visits will appear here for your personal health records."}
          </p>
          {activeTab === "upcoming" && (
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Schedule First Visit
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((apt) => {
            const dateInfo = formatAptDate(apt.scheduled_at);
            const isCompleted = apt.status === "completed";

            return (
              <div
                key={apt.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all shadow-sm ${
                  isCompleted
                    ? "border-slate-200 bg-slate-50/60 opacity-80"
                    : "border-slate-100 bg-white hover:border-teal-200 hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top line: Doctor and Status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-black text-base shadow-sm">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                          {apt.doctor_name}
                        </h3>
                        {apt.specialty && (
                          <span className="inline-block rounded-md bg-teal-100/70 px-2 py-0.5 text-xs font-bold text-teal-800 mt-0.5">
                            {apt.specialty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Countdown / Status Tag */}
                    {isCompleted ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                        Completed
                      </span>
                    ) : dateInfo.diffDays === 0 ? (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700 animate-pulse">
                        Today
                      </span>
                    ) : dateInfo.diffDays === 1 ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        Tomorrow
                      </span>
                    ) : dateInfo.diffDays > 1 ? (
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                        In {dateInfo.diffDays} days
                      </span>
                    ) : null}
                  </div>

                  {/* Date, Time & Clinic Info */}
                  <div className="mt-5 space-y-2.5 rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                      <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>
                        {dateInfo.weekday}, {dateInfo.monthDay} at {dateInfo.time}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs font-medium text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{apt.clinic_name}</span>
                    </div>

                    {apt.notes && (
                      <div className="flex items-start gap-2.5 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                        <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic">{apt.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleToggleComplete(apt)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isCompleted ? "Mark Uncompleted" : "Mark as Completed"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(apt)}
                      title="Edit appointment"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(apt.id)}
                      title="Delete appointment"
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

      {/* Schedule / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-teal-50 p-2 text-teal-700">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingAppointment ? "Edit Appointment" : "Schedule New Visit"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Doctor / Provider Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Specialty & Clinic */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Medical Specialty
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  >
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Clinic / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memorial Hospital, Rm 302"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              {/* Clinical Notes / Preparation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preparation & Clinical Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Fasting 8 hours prior. Bring blood glucose logs and insurance card."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {submitting ? "Saving..." : editingAppointment ? "Save Changes" : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
