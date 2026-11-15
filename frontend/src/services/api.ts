// CareOrbit 360 Frontend API Client
// Handles authenticated communication with the backend API

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  environment: string;
}

export interface Appointment {
  id: string;
  user_id?: string;
  doctor_name: string;
  specialty?: string;
  clinic_name: string;
  scheduled_at: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at?: string;
}

export interface Caregiver {
  id: string;
  patient_id?: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  created_at?: string;
}

export interface CaregiverActivity {
  id: string;
  patient_id?: string;
  caregiver_name: string;
  action: string;
  note?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: "medication" | "appointment" | "emergency" | "caregiver" | "system";
  is_read: boolean;
  created_at: string;
}

export interface PatientProfile {
  id: string;
  email: string;
  full_name: string;
  role: "patient" | "caregiver" | "family";
  dob?: string;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  updated_at?: string;
}

export interface AdherenceAnalytics {
  today: {
    total: number;
    completed: number;
    missed: number;
    remaining: number;
    adherencePercentage: number;
  };
  sevenDay: {
    overallRate: number;
    totalTaken: number;
    totalMissed: number;
    trend: Array<{
      date: string;
      day: string;
      taken: number;
      missed: number;
      total: number;
      rate: number;
    }>;
  };
}

// 1. Health check
export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.status}`);
  }
  return response.json() as Promise<HealthResponse>;
}

// Helper for authenticated requests
async function authFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "Invalid response format" };
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// 2. Appointments API
export async function getAppointments(token: string): Promise<Appointment[]> {
  const res = await authFetch<{ success: boolean; data: Appointment[] }>("/api/appointments", token);
  return res.data || [];
}

export async function createAppointment(
  token: string,
  appointment: Omit<Appointment, "id" | "created_at">,
): Promise<Appointment> {
  const res = await authFetch<{ success: boolean; data: Appointment }>("/api/appointments", token, {
    method: "POST",
    body: JSON.stringify(appointment),
  });
  return res.data;
}

export async function updateAppointment(
  token: string,
  id: string,
  updates: Partial<Appointment>,
): Promise<Appointment> {
  const res = await authFetch<{ success: boolean; data: Appointment }>(`/api/appointments/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return res.data;
}

export async function deleteAppointment(token: string, id: string): Promise<void> {
  await authFetch(`/api/appointments/${id}`, token, { method: "DELETE" });
}

// 3. Caregivers API
export async function getCaregivers(token: string): Promise<Caregiver[]> {
  const res = await authFetch<{ success: boolean; data: Caregiver[] }>("/api/caregivers", token);
  return res.data || [];
}

export async function createCaregiver(
  token: string,
  caregiver: Omit<Caregiver, "id" | "created_at">,
): Promise<Caregiver> {
  const res = await authFetch<{ success: boolean; data: Caregiver }>("/api/caregivers", token, {
    method: "POST",
    body: JSON.stringify(caregiver),
  });
  return res.data;
}

export async function deleteCaregiver(token: string, id: string): Promise<void> {
  await authFetch(`/api/caregivers/${id}`, token, { method: "DELETE" });
}

export async function getCaregiverActivity(token: string): Promise<CaregiverActivity[]> {
  const res = await authFetch<{ success: boolean; data: CaregiverActivity[] }>("/api/caregivers/activity", token);
  return res.data || [];
}

export async function logCaregiverCheckin(
  token: string,
  caregiverName: string,
  note: string,
): Promise<CaregiverActivity> {
  const res = await authFetch<{ success: boolean; data: CaregiverActivity }>("/api/caregivers/checkin", token, {
    method: "POST",
    body: JSON.stringify({ caregiver_name: caregiverName, note }),
  });
  return res.data;
}

// 4. Notifications API
export async function getNotifications(token: string): Promise<NotificationItem[]> {
  const res = await authFetch<{ success: boolean; data: NotificationItem[] }>("/api/notifications", token);
  return res.data || [];
}

export async function markNotificationAsRead(token: string, id: string): Promise<void> {
  await authFetch(`/api/notifications/${id}/read`, token, { method: "PATCH" });
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  await authFetch("/api/notifications/mark-all-read", token, { method: "POST" });
}

// 5. Patient Profile API
export async function getPatientProfile(token: string): Promise<PatientProfile> {
  const res = await authFetch<{ success: boolean; data: PatientProfile }>("/api/profile", token);
  return res.data;
}

export async function updatePatientProfile(
  token: string,
  profile: Partial<PatientProfile>,
): Promise<PatientProfile> {
  const res = await authFetch<{ success: boolean; data: PatientProfile }>("/api/profile", token, {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return res.data;
}

// 6. Emergency SOS Alert API
export async function triggerEmergencyAlert(
  token: string,
  payload: { notes?: string; contact_email?: string; contact_name?: string },
): Promise<{ success: boolean; message: string; alertId: string; timestamp: string }> {
  return authFetch("/api/emergency/alert", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 7. Adherence Analytics API
export async function getAdherenceAnalytics(token: string): Promise<AdherenceAnalytics> {
  const res = await authFetch<{ success: boolean; data: AdherenceAnalytics }>("/api/analytics/adherence", token);
  return res.data;
}

// 8. Medication Reminder API
export async function sendMedicationReminder(
  token: string,
  medicationId: string,
  reminderType: "upcoming" | "due" | "followup" = "due",
): Promise<{ success: boolean; message: string; data?: any }> {
  return authFetch("/api/reminders/send", token, {
    method: "POST",
    body: JSON.stringify({ medicationId, reminderType }),
  });
}

// 9. Passcode-Based Caregiver Invitation System
export interface CaregiverInvitation {
  id: string;
  patient_id: string;
  passcode: string;
  recipient_name?: string;
  recipient_email?: string;
  relationship: string;
  can_manage_medications: boolean;
  can_view_records: boolean;
  expires_at: string;
  is_redeemed: boolean;
  is_revoked: boolean;
  created_at: string;
}

export async function createCaregiverInvitation(
  token: string,
  data: {
    recipient_name?: string;
    recipient_email?: string;
    relationship: string;
    can_manage_medications?: boolean;
    can_view_records?: boolean;
  },
): Promise<CaregiverInvitation> {
  const res = await authFetch<{ success: boolean; data: CaregiverInvitation }>(
    "/api/caregivers/invitations",
    token,
    { method: "POST", body: JSON.stringify(data) },
  );
  return res.data;
}

export async function getCaregiverInvitations(token: string): Promise<CaregiverInvitation[]> {
  const res = await authFetch<{ success: boolean; data: CaregiverInvitation[] }>(
    "/api/caregivers/invitations",
    token,
  );
  return res.data;
}

export async function revokeCaregiverInvitation(token: string, id: string): Promise<void> {
  await authFetch(`/api/caregivers/invitations/${id}`, token, { method: "DELETE" });
}

export async function acceptCaregiverInvitation(
  token: string,
  passcode: string,
): Promise<{ success: boolean; message: string; data?: any }> {
  return authFetch("/api/caregivers/invitations/accept", token, {
    method: "POST",
    body: JSON.stringify({ passcode }),
  });
}

// 10. Automated Proactive Reminder Cron Engine
export interface ProactiveReminderReport {
  timestamp: string;
  upcomingRemindersSent: number;
  missedRemindersSent: number;
  appointmentRemindersSent: number;
  details: any[];
}

export async function runProactiveScheduler(): Promise<ProactiveReminderReport> {
  const res = await fetch(`${API_BASE_URL}/api/reminders/process-cron`, { method: "POST" });
  const data = await res.json();
  return data.report;
}
