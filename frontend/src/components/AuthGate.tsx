
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { LockKeyhole, Mail, Heart, Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setError(error.message);
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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

    if (!email.trim() || password.length < 8) {
      setError("Enter a valid email and a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Account created. Welcome to CareOrbit 360.");
        } else {
          setMessage("Account created. Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f9f7]">
        <Loader2 className="animate-spin text-[#267e69]" size={32} />
        <span className="ml-3 text-sm text-[#526d61]">Loading your care space...</span>
      </div>
    );
  }

  if (session) {
    return (
      <>
        <div className="fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-full border border-[#e1ebe5] bg-white/95 px-4 py-2 shadow-lg">
          <span className="hidden max-w-[180px] truncate text-xs text-[#526d61] sm:block">
            {session.user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-[#267e69] hover:underline"
          >
            Sign out
          </button>
        </div>
        {children}
      </>
    );
  }

  return (
    <main className="hero-glow flex min-h-screen items-center justify-center bg-[#f5f9f7] px-5 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-8 shadow-2xl shadow-[#315d4b]/10 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#267e69] text-white shadow-lg">
          <Heart size={27} fill="white" />
        </div>

        <p className="mt-5 text-center text-xs font-extrabold tracking-[.25em] text-[#42977c]">
          CAREORBIT 360
        </p>
        <h1 className="mt-3 text-center text-3xl font-extrabold text-[#21453d]">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-[#82938b]">
          {mode === "signin"
            ? "Sign in to access your connected care space."
            : "Create an account to start organizing your care."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#526d61]">
              Email address
            </span>
            <span className="flex items-center gap-3 rounded-xl border border-[#e1ebe5] px-4 focus-within:border-[#55ad8d]">
              <Mail size={18} className="text-[#7d9a8c]" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full py-3 outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#526d61]">
              Password
            </span>
            <span className="flex items-center gap-3 rounded-xl border border-[#e1ebe5] px-4 focus-within:border-[#55ad8d]">
              <LockKeyhole size={18} className="text-[#7d9a8c]" />
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full py-3 outline-none"
              />
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#267e69] py-3.5 font-bold text-white transition hover:bg-[#1c6655] disabled:opacity-60"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {submitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#71877e]">
          {mode === "signin" ? "New to CareOrbit 360?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setMessage("");
            }}
            className="font-bold text-[#267e69] hover:underline"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>

        <p className="mt-6 text-center text-xs leading-5 text-[#91a198]">
          Your care information is private to your account. CareOrbit 360 helps
          organize care and reminders; it does not replace professional medical advice.
        </p>
      </section>
    </main>
  );
}
