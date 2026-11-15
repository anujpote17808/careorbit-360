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
  KeyRound,
  Lock,
} from "lucide-react";
import {
  getCaregivers,
  createCaregiver,
  deleteCaregiver,
  getCaregiverActivity,
  logCaregiverCheckin,
  createCaregiverInvitation,
  getCaregiverInvitations,
  revokeCaregiverInvitation,
  acceptCaregiverInvitation,
  type Caregiver,
  type CaregiverActivity,
  type CaregiverInvitation,
} from "../services/api";

interface CaregiversViewProps {
  token: string | null;
}

export default function CaregiversView({ token }: CaregiversViewProps) {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [activity, setActivity] = useState<CaregiverActivity[]>([]);
  const [invitations, setInvitations] = useState<CaregiverInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPasscode, setCopiedPasscode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Modals & Submissions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State - Add Direct Caregiver
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Daughter");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Form State - Generate Passcode Invitation
  const [inviteRecipient, setInviteRecipient] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("Daughter");
  const [canManageMeds, setCanManageMeds] = useState(false);
  const [canViewRecords, setCanViewRecords] = useState(true);

  // Form State - Caregiver Redeem Passcode
  const [redeemPasscode, setRedeemPasscode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

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

  const fetchData = async () => {
    if (!token) {
      // Demo mock state
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
          action: "Checked Daily Adherence",
          note: "Confirmed morning Metformin and Lisinopril were taken on schedule.",
          created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        },
        {
          id: "act-2",
          caregiver_name: "Elena Rostova, RN",
          action: "Vitals Check-in Visit",
          note: "Blood pressure reading 124/82 mmHg. Pulse 72 bpm. Medication refill arranged.",
          created_at: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
        },
      ]);
      setInvitations([
        {
          id: "inv-demo-1",
          patient_id: "demo-patient",
          passcode: "ORBIT-84F2A1",
          recipient_name: "Nurse David",
          relationship: "Visiting Nurse",
          can_manage_medications: true,
          can_view_records: true,
          expires_at: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
          is_redeemed: false,
          is_revoked: false,
          created_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [cgData, actData, invData] = await Promise.all([
        getCaregivers(token).catch(() => []),
        getCaregiverActivity(token).catch(() => []),
        getCaregiverInvitations(token).catch(() => []),
      ]);
      setCaregivers(cgData);
      setActivity(actData);
      setInvitations(invData);
    } catch (err: any) {
      setError(err.message || "Failed to load caregiver data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCopyPasscode = (passcode: string) => {
    navigator.clipboard.writeText(passcode);
    setCopiedPasscode(passcode);
    setTimeout(() => setCopiedPasscode(null), 3000);
  };

  // Generate new passcode invitation
  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (token) {
        const inv = await createCaregiverInvitation(token, {
          recipient_name: inviteRecipient.trim() || undefined,
          relationship: inviteRelationship,
          can_manage_medications: canManageMeds,
          can_view_records: canViewRecords,
        });
        setSuccessNotice(`Secure passcode generated: ${inv.passcode}`);
        await fetchData();
      } else {
        const mockPasscode = `ORBIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const mockInv: CaregiverInvitation = {
          id: `inv-${Date.now()}`,
          patient_id: "demo-patient",
          passcode: mockPasscode,
          recipient_name: inviteRecipient.trim() || "Caregiver",
          relationship: inviteRelationship,
          can_manage_medications: canManageMeds,
          can_view_records: canViewRecords,
          expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          is_redeemed: false,
          is_revoked: false,
          created_at: new Date().toISOString(),
        };
        setInvitations((prev) => [mockInv, ...prev]);
        setSuccessNotice(`Secure passcode generated: ${mockPasscode}`);
      }
      setIsInviteModalOpen(false);
      setInviteRecipient("");
    } catch (err: any) {
      setError(err.message || "Could not generate invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  // Revoke an invitation passcode
  const handleRevokeInvitation = async (id: string) => {
    if (!confirm("Revoke this invitation passcode? It can no longer be redeemed.")) return;
    try {
      if (token) {
        await revokeCaregiverInvitation(token, id);
      }
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      setSuccessNotice("Invitation passcode revoked.");
    } catch (err: any) {
      setError(err.message || "Failed to revoke invitation.");
    }
  };

  // Caregiver redeems passcode
  const handleRedeemPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemPasscode.trim()) return;

    setRedeeming(true);
    setError(null);

    try {
      if (token) {
        await acceptCaregiverInvitation(token, redeemPasscode.trim());
        setSuccessNotice("Successfully connected to patient care circle!");
        setRedeemPasscode("");
        await fetchData();
      } else {
        setSuccessNotice(`Passcode ${redeemPasscode.trim().toUpperCase()} accepted in demo mode!`);
        setRedeemPasscode("");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired passcode.");
    } finally {
      setRedeeming(false);
    }
  };

  // Direct add caregiver
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

  // Revoke / Delete Caregiver access
  const handleDelete = async (id: string, cgName: string) => {
    if (!confirm(`Revoke access for ${cgName}? They will no longer be able to view your health data.`)) return;
    try {
      if (token) {
        await deleteCaregiver(token, id);
      }
      setCaregivers((prev) => prev.filter((c) => c.id !== id));
      setSuccessNotice(`Access for ${cgName} has been revoked.`);
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
      if (diffHours === 1) return "1 hour ago";
      if (diffHours < 24) return `${diffHours} hours ago`;
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "Recent";
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl">
              Family & Caregivers (Care Circle)
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Shared, patient-controlled care ecosystem with secure passcode-based access and permissions.
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
            Log Visit Note
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
          >
            <KeyRound className="h-4 w-4" />
            Generate Secure Passcode
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

      {/* ============================================================== */}
      {/* 1. SECURE PASSCODE-BASED ACCESS BANNER                         */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
              <ShieldCheck size={14} />
              <span>Secure Passcode-Based Access Control</span>
            </div>
            <h2 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight">
              Patient-Controlled Caregiver Access
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-2xl">
              Never share static passwords. Generate single-use, 48-hour expiring passcodes to invite adult children, visiting nurses, or legal guardians. You decide whether they can update medications or only view daily adherence telemetry.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-teal-300 transition shadow-md"
              >
                <KeyRound size={15} />
                <span>Create Expiring Passcode</span>
              </button>
            </div>
          </div>

          {/* Caregiver Passcode Acceptance Input */}
          <div className="lg:col-span-4 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/15">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <Lock size={13} />
              <span>Redeem Passcode to Join</span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              Received a passcode from a senior? Enter it below to link your account:
            </p>
            <form onSubmit={handleRedeemPasscode} className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="e.g. ORBIT-9A3F7B"
                value={redeemPasscode}
                onChange={(e) => setRedeemPasscode(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-slate-900/80 px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-teal-200 border border-teal-500/40 focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={redeeming || !redeemPasscode.trim()}
                className="w-full rounded-xl bg-teal-500 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition disabled:opacity-50"
              >
                {redeeming ? "Verifying..." : "Accept & Connect"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. ACTIVE PENDING INVITATIONS                                   */}
      {/* ============================================================== */}
      {invitations.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-teal-600" />
                <span>Pending Invitation Passcodes</span>
              </h2>
              <p className="text-xs text-slate-500">
                These single-use passcodes are awaiting redemption. You can revoke them at any time.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
              {invitations.length} Active
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-2.5 transition hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black tracking-wider text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-lg">
                    {inv.passcode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPasscode(inv.passcode)}
                    className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900"
                  >
                    {copiedPasscode === inv.passcode ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    For: {inv.recipient_name || "Caregiver"} ({inv.relationship})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permissions: {inv.can_manage_medications ? "Manage Prescriptions" : "View Records Only"}
                  </p>
                  <p className="text-[11px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    <span>Expires in 48 hours</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeInvitation(inv.id)}
                  className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-800 pt-2 border-t border-slate-200/70 transition"
                >
                  Revoke Passcode
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CONNECTED CAREGIVERS & PERMISSION TRANSPARENCY               */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-teal-600" />
              <span>Authorized Care Circle Members</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              You maintain full ownership of your data. Revoke access with a single click.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <UserPlus size={14} className="text-teal-600" />
            <span>Add Manual Contact</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="ml-2 text-xs font-semibold">Loading Care Circle...</span>
          </div>
        ) : caregivers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">No Caregivers Connected Yet</p>
            <p className="text-xs text-slate-400 mt-1">Generate a secure passcode above to connect your family.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map((cg) => (
              <div
                key={cg.id}
                className="relative rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:shadow-md hover:border-teal-200"
              >
                {cg.is_primary && (
                  <span className="absolute top-4 right-4 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    Primary Guardian
                  </span>
                )}

                <h3 className="text-base font-extrabold text-slate-900">{cg.name}</h3>
                <span className="inline-block mt-0.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  {cg.relationship}
                </span>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  {cg.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span>{cg.phone}</span>
                    </div>
                  )}
                  {cg.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span>{cg.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    <span>Authorized</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(cg.id, cg.name)}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 transition"
                  >
                    <Trash2 size={12} />
                    <span>Revoke Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. CAREGIVER ACTIVITY TIMELINE                                 */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-teal-600" />
          <span>Care Circle Check-in & Activity Feed</span>
        </h2>

        {activity.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recorded activity notes yet.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-xs">
                  {act.caregiver_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{act.caregiver_name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatActivityTime(act.created_at)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-teal-700 mt-0.5">{act.action}</p>
                  {act.note && <p className="text-xs text-slate-600 mt-1">{act.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: GENERATE SECURE PASSCODE INVITATION                      */}
      {/* ============================================================== */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound size={18} className="text-teal-600" />
                <span>Create Secure Passcode</span>
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateInvitation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins (Daughter)"
                  value={inviteRecipient}
                  onChange={(e) => setInviteRecipient(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Relationship
                </label>
                <select
                  value={inviteRelationship}
                  onChange={(e) => setInviteRelationship(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                >
                  {relationships.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl bg-teal-50/60 p-4 border border-teal-200/70 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  Granular Permissions
                </h4>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={canViewRecords}
                    onChange={(e) => setCanViewRecords(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Allow viewing daily dose schedules and adherence metrics</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={canManageMeds}
                    onChange={(e) => setCanManageMeds(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Allow adding/editing medication regimens and logging doses</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? "Generating..." : "Generate Passcode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DIRECT ADD CAREGIVER                                    */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus size={18} className="text-teal-600" />
                <span>Add Contact to Care Circle</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCaregiver} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Chen or Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                >
                  {relationships.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="caregiver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Set as primary emergency guardian</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add to Circle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG CHECK-IN NOTE                                       */}
      {/* ============================================================== */}
      {isCheckinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-teal-600" />
                <span>Log Visit or Check-in Note</span>
              </h3>
              <button onClick={() => setIsCheckinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogCheckin} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Caregiver Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={selectedCaregiverName}
                  onChange={(e) => setSelectedCaregiverName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Note Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Visited mother this morning. Blood pressure normal, morning dose confirmed."
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
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
