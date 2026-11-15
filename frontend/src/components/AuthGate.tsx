import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  LockKeyhole,
  Mail,
  Heart,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface DemoUser {
  id: string;
  email: string;
  role: "patient" | "caregiver";
  full_name: string;
}

type AuthGateProps = {
  children: (props: {
    session: Session | null;
    demoUser: DemoUser | null;
    isDemo: boolean;
    token: string | null;
    userEmail: string;
    onSignOut: () => Promise<void>;
  }) => ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [selectedRole, setSelectedRole] = useState<"patient" | "caregiver">("patient");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    // Check if demo user was saved in sessionStorage
    const savedDemo = sessionStorage.getItem("careorbit_demo_user");
    if (savedDemo) {
      try {
        setDemoUser(JSON.parse(savedDemo));
      } catch {
        sessionStorage.removeItem("careorbit_demo_user");
      }
    }

    supabase.auth.getSession().then(({ data, error: sessionErr }) => {
      if (!mounted) return;
      if (sessionErr) setError(sessionErr.message);
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        setDemoUser(null);
        sessionStorage.removeItem("careorbit_demo_user");
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Please enter your email to receive a password reset link.");
        return;
      }
      setSubmitting(true);
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetErr) throw resetErr;
        setMessage("Password reset email sent! Please check your inbox.");
      } catch (err: any) {
        setError(err.message || "Failed to request password reset.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email.trim() || password.length < 8) {
      setError("Please provide a valid email and a password of at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              role: selectedRole,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setMessage("Account created successfully. Welcome to CareOrbit 360!");
        } else {
          setMessage("Account created. Please check your email to verify your address, then sign in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    sessionStorage.removeItem("careorbit_demo_user");
    setDemoUser(null);
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) setError(signOutErr.message);
  }

  // Demo account quick switch
  const enterDemoMode = (role: "patient" | "caregiver") => {
    const demo: DemoUser = {
      id: role === "patient" ? "demo-patient-89" : "demo-caregiver-42",
      email: role === "patient" ? "eleanor.vance@demo.careorbit.internal" : "sarah.jenkins@demo.careorbit.internal",
      role,
      full_name: role === "patient" ? "Eleanor Vance" : "Sarah Jenkins",
    };
    sessionStorage.setItem("careorbit_demo_user", JSON.stringify(demo));
    setDemoUser(demo);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-600 text-white shadow-xl shadow-teal-600/20">
          <Heart size={32} fill="white" className="animate-pulse" />
        </div>
        <p className="mt-4 text-base font-extrabold text-slate-800 tracking-tight">CareOrbit 360</p>
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          <span>Restoring secure session...</span>
        </div>
      </div>
    );
  }

  // If authenticated via Supabase session or active demo mode
  if (session || demoUser) {
    const token = session?.access_token || null;
    const userEmail = session?.user?.email || demoUser?.email || "patient@careorbit.internal";

    return (
      <>
        {children({
          session,
          demoUser,
          isDemo: !!demoUser,
          token,
          userEmail,
          onSignOut: handleSignOut,
        })}
      </>
    );
  }

  // Sign In / Register Screen
  return (
    <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-600 text-white shadow-xl shadow-teal-600/25">
            <Heart size={32} fill="white" />
          </div>
          <p className="mt-4 text-xs font-black tracking-[.25em] text-teal-700 uppercase">
            CAREORBIT 360 HEALTHCARE
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
            {mode === "signin"
              ? "Welcome to CareOrbit 360"
              : mode === "signup"
                ? "Join Your Care Network"
                : "Reset Your Password"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium max-w-md mx-auto">
            {mode === "signin"
              ? "The unified medication tracker, doctor calendar, and caregiver coordination platform."
              : mode === "signup"
                ? "Create an account to organize daily medicines and share real-time updates."
                : "Enter your registered email to receive password recovery instructions."}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
          {/* Role Selector (visible during Signup) */}
          {mode === "signup" && (
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("patient")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3.5 text-center transition ${
                    selectedRole === "patient"
                      ? "border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <UserCheck className="h-5 w-5 text-teal-600" />
                  <span className="text-xs">Senior / Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("caregiver")}
                  className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3.5 text-center transition ${
                    selectedRole === "caregiver"
                      ? "border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <Users className="h-5 w-5 text-teal-600" />
                  <span className="text-xs">Family / Caregiver</span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@careorbit360.com"
                  className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setMessage("");
                      }}
                      className="text-xs font-bold text-teal-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-2xl border border-slate-200 pl-10 pr-11 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{message}</span>
              </div>
            )}

            {/* Primary Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 disabled:opacity-60 active:scale-95"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? "Processing..."
                : mode === "signin"
                  ? "Sign In to Care Space"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Password Reset"}
            </button>
          </form>

          {/* Toggle Modes */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            {mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                  className="font-bold text-teal-700 hover:underline"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setMessage("");
                  }}
                  className="font-bold text-teal-700 hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          {/* Dedicated Instant Demonstration Experience */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Instant Hackathon Demonstration
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Explore the full healthcare platform immediately without typing credentials:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => enterDemoMode("patient")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/60 p-3 text-xs font-bold text-teal-900 transition hover:bg-teal-100"
              >
                <span>👴</span>
                <span>Try Demo Patient</span>
              </button>

              <button
                type="button"
                onClick={() => enterDemoMode("caregiver")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-teal-50/60 p-3 text-xs font-bold text-teal-900 transition hover:bg-teal-100"
              >
                <span>👩‍⚕️</span>
                <span>Try Demo Caregiver</span>
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
          CareOrbit 360 is an assistive care coordination platform. It does not replace professional emergency services. In a medical emergency, always dial 911 immediately.
        </p>
      </div>
    </main>
  );
}
