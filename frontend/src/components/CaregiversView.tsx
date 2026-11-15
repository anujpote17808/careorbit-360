import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  MessageSquare,
  Loader2,
  X,
} from "lucide-react";
import {
  getCaregivers,
  createCaregiver,
  deleteCaregiver,
  getCaregiverActivity,
  logCaregiverCheckin,
  type Caregiver,
  type CaregiverActivity,
} from "../services/api";

interface CaregiversViewProps {
  token: string | null;
}

export default function CaregiversView({ token }: CaregiversViewProps) {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [activity, setActivity] = useState<CaregiverActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State - Add Caregiver
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Daughter");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Form State - Checkin Note
  const [selectedCaregiverName, setSelectedCaregiverName] = useState("");
  const [checkinNote, setCheckinNote] = useState("");

  const relationships = [
    "Daughter",
    "Son",
    "Spouse",
    "Sibling",
    "Home Care Aide",
    "Visiting Nurse",
    "Friend / Neighbor",
    "Legal Guardian",
  ];

  const inviteCode = "CARE-360-ORBIT";

  const fetchData = async () => {
    if (!token) {
      // Mock data for demo
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
        {
          id: "demo-cg-3",
          name: "Elena Rostova, RN",
          relationship: "Visiting Home Health Nurse",
          phone: "(555) 345-6789",
          email: "elena.r@healthlink.org",
          is_primary: false,
        },
      ]);
      setActivity([
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
        {
          id: "act-3",
          caregiver_name: "Michael Jenkins",
          action: "Pharmacy Pickup & Restock",
          note: "Picked up 30-day refill of Atorvastatin from Walgreens. Placed in weekly organizer.",
          created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [cgData, actData] = await Promise.all([
        getCaregivers(token).catch(() => []),
        getCaregiverActivity(token).catch(() => []),
      ]);
      setCaregivers(cgData);
      setActivity(actData);
    } catch (err: any) {
      console.warn("Could not load caregivers from backend:", err);
      setError("Using offline care circle mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setSuccessNotice("Care circle invite code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleAddCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for the caregiver.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (token) {
        await createCaregiver(token, {
          name: name.trim(),
          relationship,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          is_primary: isPrimary,
        });
        setSuccessNotice(`${name.trim()} added to your Care Circle.`);
        await fetchData();
      } else {
        const newCg: Caregiver = {
          id: `cg-${Date.now()}`,
          name: name.trim(),
          relationship,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          is_primary: isPrimary,
        };
        setCaregivers((prev) => [newCg, ...prev]);
        setSuccessNotice(`${name.trim()} added to your Care Circle.`);
      }
      setIsAddModalOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setIsPrimary(false);
    } catch (err: any) {
      setError(err.message || "Could not add caregiver.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, cgName: string) => {
    if (!confirm(`Are you sure you want to remove ${cgName} from your Care Circle?`)) return;
    try {
      if (token) {
        await deleteCaregiver(token, id);
      }
      setCaregivers((prev) => prev.filter((c) => c.id !== id));
      setSuccessNotice(`${cgName} removed from Care Circle.`);
    } catch (err: any) {
      setError(err.message || "Failed to remove caregiver.");
    }
  };

  const handleLogCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaregiverName.trim() || !checkinNote.trim()) {
      setError("Please select a caregiver and write a brief note.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (token) {
        await logCaregiverCheckin(token, selectedCaregiverName, checkinNote.trim());
        setSuccessNotice("Check-in note logged to care activity.");
        await fetchData();
      } else {
        const newAct: CaregiverActivity = {
          id: `act-${Date.now()}`,
          caregiver_name: selectedCaregiverName,
          action: "Caregiver Visit & Check-in",
          note: checkinNote.trim(),
          created_at: new Date().toISOString(),
        };
        setActivity((prev) => [newAct, ...prev]);
        setSuccessNotice("Check-in note logged to care activity.");
      }
      setIsCheckinModalOpen(false);
      setCheckinNote("");
    } catch (err: any) {
      setError(err.message || "Failed to record check-in note.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatActivityTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffHours = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Users className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
              Family & Caregivers
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Connect family guardians, healthcare aides, and emergency contacts to coordinate your daily care.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (caregivers.length > 0) {
                setSelectedCaregiverName(caregivers[0].name);
              }
              setIsCheckinModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 text-teal-600" />
            Log Check-in Note
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Add Caregiver
          </button>
        </div>
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

      {successNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium">{successNotice}</p>
          <button onClick={() => setSuccessNotice(null)} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Invite Code Share Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300">
                Care Circle Invite Code
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              Invite Family & Nurses to Your CareOrbit Circle
            </h2>
            <p className="mt-1 text-xs text-teal-100/80 leading-relaxed">
              Family members can enter this code in their CareOrbit mobile or web app to view medication adherence, receive missed-dose alerts, and assist with emergencies.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/10">
            <span className="px-3 font-mono text-base font-black tracking-widest text-teal-300">
              {inviteCode}
            </span>
            <button
              onClick={copyInviteCode}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-teal-400"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedCode ? "Copied" : "Copy Code"}
            </button>
          </div>
        </div>
      </div>

      {/* Caregiver Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>Active Care Circle</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {caregivers.length} Members
          </span>
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="mt-2 text-sm font-medium">Loading care circle...</p>
          </div>
        ) : caregivers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-800">No Caregivers Added Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Add family members or in-home care aides so they can receive updates and help manage your health.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              <UserPlus className="h-4 w-4" />
              Add First Caregiver
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map((cg) => (
              <div
                key={cg.id}
                className="relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-black text-lg">
                        {cg.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 leading-snug">{cg.name}</h3>
                        <p className="text-xs font-medium text-slate-500">{cg.relationship}</p>
                      </div>
                    </div>

                    {cg.is_primary && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" />
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-700">
                    {cg.phone ? (
                      <div className="flex items-center gap-2 font-medium">
                        <Phone className="h-3.5 w-3.5 text-teal-600" />
                        <span>{cg.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic">
                        <Phone className="h-3.5 w-3.5" />
                        <span>No phone listed</span>
                      </div>
                    )}

                    {cg.email ? (
                      <div className="flex items-center gap-2 font-medium truncate">
                        <Mail className="h-3.5 w-3.5 text-teal-600" />
                        <span className="truncate">{cg.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic">
                        <Mail className="h-3.5 w-3.5" />
                        <span>No email listed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    {cg.phone && (
                      <a
                        href={`tel:${cg.phone.replace(/[^0-9+]/g, "")}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    )}
                    {cg.email && (
                      <a
                        href={`mailto:${cg.email}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(cg.id, cg.name)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Remove caregiver"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caregiver Activity & Check-in Feed */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Clock className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Caregiver Visit & Check-In Log
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Real-time family transparency
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {activity.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No recent caregiver visits logged yet. Use "Log Check-in Note" to record a visit or dose confirmation.
            </p>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-2xl bg-slate-50/70 p-4 border border-slate-100"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm shadow-sm">
                  {item.caregiver_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {item.caregiver_name}
                      <span className="ml-2 font-normal text-xs text-slate-500">
                        {item.action}
                      </span>
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {formatActivityTime(item.created_at)}
                    </span>
                  </div>
                  {item.note && (
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                      "{item.note}"
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Caregiver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Family or Caregiver</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCaregiver} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isPrimaryCheck"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="isPrimaryCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Designate as Primary Emergency Guardian
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Adding..." : "Add to Circle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Checkin Note Modal */}
      {isCheckinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record Caregiver Visit Note</h3>
              <button
                onClick={() => setIsCheckinModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogCheckin} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Caregiver Name *
                </label>
                {caregivers.length > 0 ? (
                  <select
                    value={selectedCaregiverName}
                    onChange={(e) => setSelectedCaregiverName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  >
                    {caregivers.map((cg) => (
                      <option key={cg.id} value={cg.name}>
                        {cg.name} ({cg.relationship})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter caregiver name"
                    value={selectedCaregiverName}
                    onChange={(e) => setSelectedCaregiverName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Visit / Check-in Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Visited in afternoon. Checked blood pressure (122/80), refilled water pitcher, confirmed noon medications were taken."
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Saving..." : "Log Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
