
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pill,
  Plus,
  CheckCircle2,
  Clock3,
  Trash2,
  CalendarCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type DoseStatus = "taken" | "missed" | null;

type Medication = {
  id: string;
  name: string;
  dosage: string;
  scheduled_time: string;
  is_active: boolean;
  doseStatus: DoseStatus;
};

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function MedicationManager() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("09:00");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const completed = medications.filter(
    (med) => med.doseStatus === "taken",
  ).length;

  const missed = medications.filter(
    (med) => med.doseStatus === "missed",
  ).length;

  const total = medications.length;
  const unrecorded = total - completed - missed;

  const progress = useMemo(
    () => (total === 0 ? 0 : Math.round((completed / total) * 100)),
    [completed, total],
  );

  // Load medications and today's dose history.
  const loadMedications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in again.");
      }

      const today = localDateString();

      const { data: medicationData, error: medicationError } =
        await supabase
          .from("medications")
          .select("id, name, dosage, scheduled_time, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("scheduled_time");

      if (medicationError) throw medicationError;

      const { data: logData, error: logError } = await supabase
        .from("medication_dose_logs")
        .select("medication_id, status")
        .eq("user_id", user.id)
        .eq("scheduled_date", today);

      if (logError) throw logError;

      const statusByMedication = new Map<string, DoseStatus>();

      (logData ?? []).forEach((log) => {
        if (log.status === "taken" || log.status === "missed") {
          statusByMedication.set(log.medication_id, log.status);
        }
      });

      setMedications(
        (medicationData ?? []).map((med) => ({
          ...med,
          doseStatus: statusByMedication.get(med.id) ?? null,
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load medications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedications();
  }, [loadMedications]);

  // Add a medication.
  async function addMedication(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!name.trim() || !dosage.trim() || !time) {
      setError("Please complete all medication fields.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in first.");
      }

      const { error: insertError } = await supabase
        .from("medications")
        .insert({
          user_id: user.id,
          name: name.trim(),
          dosage: dosage.trim(),
          scheduled_time: time,
        });

      if (insertError) throw insertError;

      setName("");
      setDosage("");
      setTime("09:00");
      setNotice("Medication saved successfully.");

      await loadMedications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save medication.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Record a dose as taken or missed.
  async function setDoseStatus(
    medication: Medication,
    status: "taken" | "missed",
  ) {
    setError("");
    setNotice("");
    setUpdatingId(medication.id);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in first.");
      }

      const { error: upsertError } = await supabase
        .from("medication_dose_logs")
        .upsert(
          {
            medication_id: medication.id,
            user_id: user.id,
            scheduled_date: localDateString(),
            status,
            recorded_at: new Date().toISOString(),
          },
          {
            onConflict: "medication_id,scheduled_date",
          },
        );

      if (upsertError) throw upsertError;

      setNotice(
        status === "taken"
          ? "Dose recorded as taken."
          : "Dose recorded as missed.",
      );

      await loadMedications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update dose status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // Send an authenticated reminder through the backend.
  async function sendReminder(medication: Medication) {
    setError("");
    setNotice("");
    setEmailSendingId(medication.id);

    try {
      // 1. Retrieve the current session.
      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      // 2. Proactively refresh if token is missing or near expiry (within 60 seconds)
      const now = Math.floor(Date.now() / 1000);
      const isExpiringSoon = session?.expires_at
        ? session.expires_at - now < 60
        : false;

      if (!session?.access_token || isExpiringSoon) {
        const refreshed = await supabase.auth.refreshSession();

        if (refreshed.data.session) {
          session = refreshed.data.session;
        } else if (!session?.access_token) {
          throw new Error(
            "Your session has expired. Please sign out and sign in again.",
          );
        }
      }

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please sign out and sign in again.",
        );
      }

      // Read backend URL from frontend/.env.
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        throw new Error(
          "Backend API URL is missing. Check frontend/.env.",
        );
      }

      // Helper function to send the reminder request
      const makeRequest = async (accessToken: string) => {
        return fetch(`${apiUrl.replace(/\/+$/, "")}/api/reminders/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            medicationId: medication.id,
            reminderType: "due",
          }),
        });
      };

      // 3. Send reminder request.
      let response = await makeRequest(session.access_token);

      // 4. On 401, attempt one automatic refresh and retry
      if (response.status === 401) {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.data.session?.access_token) {
          session = refreshed.data.session;
          response = await makeRequest(session.access_token);
        }
      }

      // 5. Parse both JSON and plain-text responses safely.
      const responseText = await response.text();

      let result: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = {
          error:
            responseText ||
            "The backend returned an invalid response.",
        };
      }

      // 6. Handle HTTP status codes appropriately.
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "The backend rejected your session. Please sign out and sign in again.",
          );
        }

        if (response.status === 403) {
          throw new Error(
            result.error ||
              "Access forbidden. You do not have permission to send reminders for this medication.",
          );
        }

        if (response.status === 404) {
          throw new Error(
            result.error || "Active medication not found.",
          );
        }

        if (response.status === 429) {
          throw new Error(
            "Too many reminder requests. Please wait before trying again.",
          );
        }

        if (response.status >= 500) {
          throw new Error(
            result.error ||
              "Email service or backend encountered an error. Please try again later.",
          );
        }

        throw new Error(
          result.error ||
            result.message ||
            `Reminder request failed with status ${response.status}.`,
        );
      }

      setNotice(
        result.message ||
          `Reminder email request accepted for ${medication.name}.`,
      );
    } catch (err) {
      console.error("Reminder email error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not send reminder email. Please try again.",
      );
    } finally {
      setEmailSendingId(null);
    }
  }

  // Delete a medication.
  async function deleteMedication(id: string) {
    const confirmed = window.confirm(
      "Delete this medication and its dose history?",
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please sign in first.");
      }

      const { error: deleteError } = await supabase
        .from("medications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setNotice("Medication deleted.");
      await loadMedications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete medication.",
      );
    }
  }

  return (
    <section className="mt-8 space-y-6">
      {/* Section heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-[#42977c]">
            MEDICATION MANAGEMENT
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-[#24483e]">
            Daily medication tracker
          </h2>

          <p className="mt-1 text-sm text-[#82938b]">
            Your schedule is securely saved to your account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMedications()}
          disabled={loading}
          aria-label="Refresh medication list"
          className="rounded-xl bg-white p-3 text-[#389477] shadow-sm transition hover:bg-[#e8f5ee] disabled:opacity-50"
        >
          <RefreshCw
            size={20}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-[#82938b]">
            Scheduled medications
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#24483e]">
            {total}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-[#82938b]">
            Recorded as taken today
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#389477]">
            {completed}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-[#82938b]">
            Recorded as missed today
          </p>
          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {missed}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-[#82938b]">
            Not yet recorded
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#bd8a45]">
            {unrecorded}
          </p>
        </div>
      </div>

      {/* Daily progress */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#315448]">
              Today's progress
            </h3>
            <p className="mt-1 text-sm text-[#82938b]">
              Based on doses recorded as taken today
            </p>
          </div>

          <span className="text-2xl font-extrabold text-[#389477]">
            {progress}%
          </span>
        </div>

        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-[#edf2ef]"
          role="progressbar"
          aria-label="Medication doses recorded as taken today"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[#55b58f] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add medication and schedule */}
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={addMedication}
          className="rounded-3xl bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#e8f5ee] p-3 text-[#399779]">
              <Plus size={20} />
            </div>

            <h3 className="text-lg font-bold text-[#315448]">
              Add medication
            </h3>
          </div>

          <label className="mb-2 block text-sm font-semibold text-[#526d61]">
            Medication name
          </label>

          <input
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Medication name"
            className="mb-4 w-full rounded-xl border border-[#e1ebe5] px-4 py-3 outline-none focus:border-[#55ad8d]"
          />

          <label className="mb-2 block text-sm font-semibold text-[#526d61]">
            Dosage
          </label>

          <input
            required
            maxLength={120}
            value={dosage}
            onChange={(event) => setDosage(event.target.value)}
            placeholder="e.g. 1 tablet"
            className="mb-4 w-full rounded-xl border border-[#e1ebe5] px-4 py-3 outline-none focus:border-[#55ad8d]"
          />

          <label className="mb-2 block text-sm font-semibold text-[#526d61]">
            Scheduled time
          </label>

          <input
            required
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mb-4 w-full rounded-xl border border-[#e1ebe5] px-4 py-3 outline-none focus:border-[#55ad8d]"
          />

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#267e69] py-3 font-bold text-white transition hover:bg-[#1c6655] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            {saving ? "Saving..." : "Save medication"}
          </button>
        </form>

        {/* Medication schedule */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#fff1df] p-3 text-[#bd8a45]">
              <CalendarCheck size={20} />
            </div>

            <h3 className="text-lg font-bold text-[#315448]">
              Medication schedule
            </h3>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-[#71877e]">
              <Loader2 size={20} className="animate-spin" />
              Loading medications...
            </div>
          ) : medications.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Pill size={34} className="text-[#a8c9b8]" />

              <p className="mt-3 font-bold text-[#526d61]">
                No medications added
              </p>

              <p className="mt-1 text-sm text-[#91a198]">
                Add a medication to create your schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#edf2ee] p-4"
                >
                  <div className="rounded-xl bg-[#e8f5ee] p-3 text-[#399779]">
                    <Pill size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#315448]">
                      {med.name}
                    </p>

                    <p className="mt-1 text-xs text-[#82938b]">
                      {med.dosage}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-xs text-[#82938b]">
                      <Clock3 size={13} />
                      {med.scheduled_time.slice(0, 5)}
                    </p>

                    <p
                      className={`mt-1 text-xs font-bold ${
                        med.doseStatus === "taken"
                          ? "text-[#389477]"
                          : med.doseStatus === "missed"
                            ? "text-red-600"
                            : "text-[#bd8a45]"
                      }`}
                    >
                      {med.doseStatus === "taken"
                        ? "Recorded as taken today"
                        : med.doseStatus === "missed"
                          ? "Recorded as missed today"
                          : "Not yet recorded today"}
                    </p>
                  </div>

                  {/* Medication action buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={
                        updatingId === med.id ||
                        emailSendingId === med.id
                      }
                      onClick={() => void setDoseStatus(med, "taken")}
                      aria-label={`Mark ${med.name} as taken`}
                      title="Record as taken"
                      className={`rounded-xl p-2 transition disabled:opacity-50 ${
                        med.doseStatus === "taken"
                          ? "bg-[#267e69] text-white"
                          : "bg-[#e8f5ee] text-[#389477] hover:bg-[#d4ecdf]"
                      }`}
                    >
                      {updatingId === med.id ? (
                        <Loader2 size={19} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={19} />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingId === med.id ||
                        emailSendingId === med.id
                      }
                      onClick={() => void setDoseStatus(med, "missed")}
                      aria-label={`Mark ${med.name} as missed`}
                      title="Record as missed"
                      className={`rounded-xl p-2 transition disabled:opacity-50 ${
                        med.doseStatus === "missed"
                          ? "bg-red-600 text-white"
                          : "bg-red-50 text-red-500 hover:bg-red-100"
                      }`}
                    >
                      <AlertCircle size={19} />
                    </button>

                    {/* Send email reminder */}
                    <button
                      type="button"
                      disabled={
                        emailSendingId === med.id ||
                        updatingId === med.id
                      }
                      onClick={() => void sendReminder(med)}
                      aria-label={`Send email reminder for ${med.name}`}
                      title="Send email reminder"
                      className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      {emailSendingId === med.id ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Mail size={17} />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        updatingId === med.id ||
                        emailSendingId === med.id
                      }
                      onClick={() => void deleteMedication(med.id)}
                      aria-label={`Delete ${med.name}`}
                      title="Delete medication"
                      className="rounded-xl bg-red-50 p-2 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback messages */}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </p>
      )}

      {/* Healthcare disclaimer */}
      <p className="text-xs leading-6 text-[#82938b]">
        This tracker records user-entered schedules and dose confirmations.
        It does not determine whether a medication or dosage is medically
        appropriate. Follow instructions from your healthcare professional.
        A missed status is recorded only when a user explicitly selects it.
        Email reminders are organizational notifications, not medical advice.
      </p>
    </section>
  );
}
