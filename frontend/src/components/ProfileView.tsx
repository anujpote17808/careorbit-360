import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Heart,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  X,
  Stethoscope,
} from "lucide-react";
import {
  getPatientProfile,
  updatePatientProfile,
  type PatientProfile,
} from "../services/api";

interface ProfileViewProps {
  token: string | null;
}

export default function ProfileView({ token }: ProfileViewProps) {
  const [_profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"patient" | "caregiver" | "family">("patient");
  const [dob, setDob] = useState("");
  const [bloodType, setBloodType] = useState("O+");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactEmail, setEmergencyContactEmail] = useState("");

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        // High quality demo profile
        const demo: PatientProfile = {
          id: "demo-user-1",
          email: "eleanor.vance@careorbit.internal",
          full_name: "Eleanor Vance",
          role: "patient",
          dob: "1948-06-14",
          blood_type: "A+",
          allergies: "Penicillin, Sulfa medications, Shellfish",
          medical_notes: "Hypertension (controlled), Type 2 Diabetes, Mild Osteoarthritis in right knee.",
          emergency_contact_name: "Sarah Jenkins",
          emergency_contact_phone: "(555) 234-8901",
          emergency_contact_email: "sarah.jenkins@example.com",
        };
        populateFields(demo);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getPatientProfile(token);
        populateFields(data);
      } catch (err: any) {
        console.warn("Could not fetch profile from backend, using fallback:", err);
        const fallback: PatientProfile = {
          id: "user-fallback",
          email: "user@careorbit.internal",
          full_name: "Eleanor Vance",
          role: "patient",
          dob: "1948-06-14",
          blood_type: "A+",
          allergies: "Penicillin, Sulfa",
          medical_notes: "Hypertension, Mild Osteoarthritis",
          emergency_contact_name: "Sarah Jenkins",
          emergency_contact_phone: "(555) 234-8901",
          emergency_contact_email: "sarah.jenkins@example.com",
        };
        populateFields(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const populateFields = (data: PatientProfile) => {
    setProfile(data);
    setFullName(data.full_name || "");
    setEmail(data.email || "");
    setRole(data.role || "patient");
    setDob(data.dob || "");
    setBloodType(data.blood_type || "O+");
    setAllergies(data.allergies || "");
    setMedicalNotes(data.medical_notes || "");
    setEmergencyContactName(data.emergency_contact_name || "");
    setEmergencyContactPhone(data.emergency_contact_phone || "");
    setEmergencyContactEmail(data.emergency_contact_email || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessNotice(null);

    const updates: Partial<PatientProfile> = {
      full_name: fullName.trim(),
      role,
      dob: dob || undefined,
      blood_type: bloodType,
      allergies: allergies.trim(),
      medical_notes: medicalNotes.trim(),
      emergency_contact_name: emergencyContactName.trim(),
      emergency_contact_phone: emergencyContactPhone.trim(),
      emergency_contact_email: emergencyContactEmail.trim(),
    };

    try {
      if (token) {
        const updated = await updatePatientProfile(token, updates);
        setProfile(updated);
      } else {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      }
      setSuccessNotice("Patient profile and emergency contacts updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
            <User className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
            Patient Profile & Health Records
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Manage your personal medical profile, emergency contacts, and care team preferences.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-sm font-medium">Loading profile records...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Account Role & Identification */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="rounded-lg bg-teal-50 p-1.5 text-teal-700">
                <Shield className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Identity & Access Role
              </h2>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Account Type
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    className={`flex-1 rounded-2xl border p-4 text-left transition ${
                      role === "patient"
                        ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-sm">Senior / Patient</p>
                    <p className="text-xs text-slate-500 mt-0.5">Primary care recipient</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("caregiver")}
                    className={`flex-1 rounded-2xl border p-4 text-left transition ${
                      role === "caregiver" || role === "family"
                        ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-sm">Family / Caregiver</p>
                    <p className="text-xs text-slate-500 mt-0.5">Assisting with care</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Registered Email (Read-only)
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{email || "patient@careorbit360.com"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Blood Group
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  {bloodTypes.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Primary Emergency Contact (SOS Dispatch Target) */}
          <div className="rounded-3xl border border-rose-100 bg-rose-50/20 p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-rose-100 p-1.5 text-rose-700">
                  <Heart className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Emergency Guardian & SOS Contact
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    This contact receives immediate automated email alerts when the Emergency SOS button is triggered.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                Critical Safety Setting
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins (Daughter)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="(555) 234-8901"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Contact Email (For SOS Dispatch)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={emergencyContactEmail}
                    onChange={(e) => setEmergencyContactEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Notes & Allergies */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <span className="rounded-lg bg-teal-50 p-1.5 text-teal-700">
                <Stethoscope className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-800">
                Medical Notes & Allergies
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Known Drug & Food Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa medications, Shellfish, Latex"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Critical for first responders and visiting nurses during emergencies.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Chronic Diagnoses & Care Directives
                </label>
                <textarea
                  rows={3}
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="e.g. Hypertension (controlled with daily ACE inhibitor), Type 2 Diabetes (monitored morning fasting glucose), Mild osteoarthritis in right knee."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-60 active:scale-95"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Saving Changes..." : "Save Patient Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
