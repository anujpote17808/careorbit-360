import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  Pill,
  Calendar,
  AlertTriangle,
  HeartHandshake,
  Info,
  CheckCheck,
  Loader2,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from "../services/api";

interface NotificationsViewProps {
  token: string | null;
}

export default function NotificationsView({ token }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!token) {
      // Mock notifications for demo mode
      setNotifications([
        {
          id: "notif-1",
          title: "Morning Medication Due",
          message: "Time to take Lisinopril (10mg) with a glass of water.",
          type: "medication",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        },
        {
          id: "notif-2",
          title: "Upcoming Doctor Appointment",
          message: "Consultation with Dr. Evelyn Vance (Cardiologist) in 2 days at Metro Heart Center.",
          type: "appointment",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        },
        {
          id: "notif-3",
          title: "Caregiver Visit Logged",
          message: "Sarah Jenkins logged a dose confirmation and blood pressure check.",
          type: "caregiver",
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
        },
        {
          id: "notif-4",
          title: "Weekly Adherence Milestone",
          message: "Great work! You achieved a 91% adherence rate this week.",
          type: "system",
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getNotifications(token);
      setNotifications(data);
    } catch (err) {
      console.warn("Could not fetch notifications from backend:", err);
      // Fallback notifications
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
          message: "Consultation with Dr. Evelyn Vance (Cardiologist) in 2 days at Metro Heart Center.",
          type: "appointment",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      if (token) {
        await markNotificationAsRead(token, id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      if (token) {
        await markAllNotificationsAsRead(token);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.is_read);
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medication":
        return <Pill className="h-5 w-5 text-teal-600" />;
      case "appointment":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "emergency":
        return <AlertTriangle className="h-5 w-5 text-rose-600" />;
      case "caregiver":
        return <HeartHandshake className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-slate-600" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "medication":
        return "bg-teal-50";
      case "appointment":
        return "bg-blue-50";
      case "emergency":
        return "bg-rose-50";
      case "caregiver":
        return "bg-amber-50";
      default:
        return "bg-slate-100";
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const diffMinutes = Math.round((Date.now() - d.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.round(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Bell className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight sm:text-3xl">
              Notifications & Alerts
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Real-time updates regarding your medication schedule, appointments, and care circle.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <CheckCheck className="h-4 w-4 text-teal-600" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
            filter === "all"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilter("unread")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition flex items-center gap-2 ${
            filter === "unread"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-black ${
                filter === "unread" ? "bg-teal-900 text-teal-100" : "bg-rose-500 text-white"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-sm font-medium">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-800">
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {filter === "unread"
              ? "You have marked all notifications as read."
              : "Medication alerts and caregiver updates will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.is_read && handleMarkAsRead(item.id)}
              className={`group flex items-start gap-4 rounded-3xl border p-5 transition cursor-pointer shadow-sm ${
                item.is_read
                  ? "border-slate-100 bg-white/70 hover:border-slate-200"
                  : "border-teal-200 bg-teal-50/20 hover:border-teal-300"
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${getTypeBg(
                  item.type,
                )}`}
              >
                {getTypeIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {formatTimestamp(item.created_at)}
                    </span>
                    {!item.is_read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                    )}
                  </div>
                </div>

                <p className="mt-1 text-sm text-slate-600 font-medium leading-relaxed">
                  {item.message}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {item.type}
                  </span>

                  {!item.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
