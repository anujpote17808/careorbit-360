import { useState, useEffect } from "react";
import { AlertTriangle, PhoneCall, ShieldAlert, X, Loader2, CheckCircle2 } from "lucide-react";
import { triggerEmergencyAlert } from "../services/api";

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  patientName?: string;
  emergencyContactName?: string;
  emergencyContactEmail?: string;
}

export default function EmergencySosModal({
  isOpen,
  onClose,
  token,
  patientName,
  emergencyContactName,
  emergencyContactEmail,
}: EmergencySosModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [isCounting, setIsCounting] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [notes, setNotes] = useState("");

  // Countdown timer before dispatching
  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setIsCounting(true);
      setSending(false);
      setSent(false);
      setResultMessage("");
      setNotes("");
      return;
    }

    if (!isCounting) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !sending && !sent) {
      void dispatchAlert();
    }
  }, [isOpen, countdown, isCounting, sending, sent]);

  async function dispatchAlert() {
    setIsCounting(false);
    setSending(true);

    try {
      if (token) {
        const res = await triggerEmergencyAlert(token, {
          notes: notes || "Emergency SOS Button activated from CareOrbit 360 Dashboard.",
          contact_email: emergencyContactEmail,
          contact_name: emergencyContactName,
        });
        setResultMessage(res.message);
      } else {
        // Demo mode fallback
        await new Promise((r) => setTimeout(r, 1200));
        setResultMessage("Emergency SOS alert simulated: Notifications dispatched to configured care contacts.");
      }
      setSent(true);
    } catch (err: any) {
      setResultMessage(err.message || "Failed to dispatch alert.");
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border-2 border-red-500">
        <button
          onClick={onClose}
          aria-label="Close emergency dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <X size={20} />
        </button>

        {!sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 animate-pulse">
              <ShieldAlert size={48} />
            </div>

            <h2 className="mt-4 text-2xl md:text-3xl font-extrabold text-gray-900">
              EMERGENCY SOS ALERT
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              This will notify your designated family caregivers and emergency contacts immediately.
            </p>

            {isCounting && (
              <div className="my-6 rounded-2xl bg-red-50 p-6 border border-red-200">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Sending alert automatically in:
                </p>
                <div className="mt-2 text-5xl font-extrabold text-red-600">
                  {countdown}
                </div>
                <p className="mt-2 text-xs text-red-800">
                  Press cancel below if this button was pressed accidentally.
                </p>
              </div>
            )}

            {sending && (
              <div className="my-6 flex items-center justify-center gap-3 rounded-2xl bg-amber-50 p-6 text-amber-800">
                <Loader2 className="animate-spin" size={24} />
                <span className="font-semibold text-sm">Dispatching priority notifications...</span>
              </div>
            )}

            <div className="mt-4 text-left">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Optional note or location:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. In living room, feeling dizzy"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-red-500"
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-700 hover:bg-gray-100 transition text-sm"
              >
                Cancel / False Alarm
              </button>

              <button
                type="button"
                onClick={() => void dispatchAlert()}
                disabled={sending}
                className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                <AlertTriangle size={18} />
                Send SOS Now
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              Emergency Alert Dispatched
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {resultMessage || "Your configured emergency contacts have been notified."}
            </p>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-left text-xs text-gray-600 space-y-1">
              <p><strong>Patient:</strong> {patientName || "Eleanor Jenkins"}</p>
              {emergencyContactName && (
                <p><strong>Contact Notified:</strong> {emergencyContactName} ({emergencyContactEmail || "email"})</p>
              )}
              <p><strong>Dispatched At:</strong> {new Date().toLocaleTimeString()}</p>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3 font-bold text-white hover:bg-gray-800 transition text-sm"
            >
              Close Window
            </button>
          </div>
        )}

        {/* Essential Medical Disclaimer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-start gap-2 text-left">
          <PhoneCall size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-4 text-gray-500">
            <strong>Medical Emergency Notice:</strong> If you are facing an immediate, life-threatening emergency, please dial <strong>911</strong> or call your regional emergency service immediately. CareOrbit 360 communicates with your personal care contacts and does not replace official dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
