
import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { checkBackendHealth } from "../services/api";

type Status = "checking" | "connected" | "error";

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Checking API connection...");

  useEffect(() => {
    let active = true;

    checkBackendHealth()
      .then((data) => {
        if (!active) return;
        setStatus("connected");
        setMessage(`${data.service} connected`);
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setMessage("Backend unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  const styles = {
    checking: "bg-amber-50 text-amber-700",
    connected: "bg-emerald-50 text-emerald-700",
    error: "bg-red-50 text-red-700",
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${styles[status]}`}>
      {status === "checking" && <Loader2 size={15} className="animate-spin" />}
      {status === "connected" && <CheckCircle2 size={15} />}
      {status === "error" && <AlertCircle size={15} />}
      {status === "checking" && <Activity size={15} />}
      {message}
    </div>
  );
}
