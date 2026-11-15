import {
  Heart,
  Pill,
  CalendarDays,
  Users,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Play,
  Activity,
  Clock,
  ShieldAlert,
} from "lucide-react";
import CareOrbitCanvas from "./CareOrbitCanvas";

interface LandingPageProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onEnterDemo: (role: "patient" | "caregiver") => void;
}

export default function LandingPage({ onOpenAuth, onEnterDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {/* ============================================================== */}
      {/* 1. TOP NAVBAR                                                  */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
              <Heart size={22} fill="white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">
                CareOrbit
              </span>
              <span className="text-[10px] font-bold tracking-[.25em] text-teal-700 uppercase">
                360 Healthcare
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-600">
            <a href="#care-orbit" className="hover:text-teal-700 transition">
              3D Care Orbit
            </a>
            <a href="#features" className="hover:text-teal-700 transition">
              Capabilities
            </a>
            <a href="#benefits" className="hover:text-teal-700 transition">
              Family & Seniors
            </a>
            <a href="#security" className="hover:text-teal-700 transition">
              Security
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onEnterDemo("patient")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/80 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100/90 transition shadow-sm"
            >
              <Play size={13} className="text-teal-600 fill-teal-600" />
              <span>Instant Demo</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth("signin")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-md shadow-teal-600/20"
            >
              <span>Sign In / Join</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION WITH 3D CARE ORBIT CANVAS                      */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Tagline */}
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/80 px-4 py-1.5 text-xs font-bold text-teal-900 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="tracking-wide">Care Coordination & Medication Adherence</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Connected Care. <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Confident Living.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              One intelligent care ecosystem connecting daily medication routines, family caregivers,
              doctor appointments, and real-time adherence insights.
            </p>

            {/* Quick Launch Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => onEnterDemo("patient")}
                className="flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-teal-600/25 hover:bg-teal-700 transition transform hover:-translate-y-0.5"
              >
                <Play size={16} fill="white" />
                <span>Explore Live Demo as Patient</span>
              </button>

              <button
                type="button"
                onClick={() => onEnterDemo("caregiver")}
                className="flex items-center gap-2 rounded-2xl border-2 border-teal-600 bg-white px-6 py-3.5 text-sm font-extrabold text-teal-800 shadow-sm hover:bg-teal-50 transition transform hover:-translate-y-0.5"
              >
                <Users size={16} className="text-teal-600" />
                <span>Explore as Family Caregiver</span>
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500">
              No sign-up required for demo • Full Supabase Auth available for permanent profiles
            </p>
          </div>

          {/* 3D Care Orbit Canvas Highlight */}
          <div id="care-orbit" className="mt-12 sm:mt-16">
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#0a231d] to-[#071713] p-4 sm:p-8 shadow-2xl border border-teal-900/50">
              {/* Top Banner inside Orbit */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-teal-900/60 pb-4 text-white">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles size={18} className="text-teal-400" />
                    <span>The Live Care Orbit™ Experience</span>
                  </h2>
                  <p className="text-xs text-teal-300/80">
                    Interact directly with the WebGL 3D model: hover nodes, inspect care pillars, and explore.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
                    3D Simulation Active
                  </span>
                </div>
              </div>

              {/* Canvas */}
              <CareOrbitCanvas
                variant="landing"
                patientName="Eleanor Vance"
                adherenceRate={95}
                activeMedsCount={4}
                nextAppointmentStr="Cardiology Consult (Nov 18)"
                caregiversCount={2}
                unreadAlertsCount={1}
                onSelectNode={() => {
                  onEnterDemo("patient");
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. PROBLEM VS SOLUTION SECTION                                 */}
      {/* ============================================================== */}
      <section className="border-y border-slate-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-[.25em] text-teal-700">
              The Senior Care Crisis
            </h2>
            <p className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Why Traditional Medication Tracking Fails Older Adults
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* The Old Way */}
            <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-6 font-bold">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold text-rose-950">The Fragmented Experience</h3>
              <ul className="mt-6 space-y-4 text-sm font-medium text-rose-900/80">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Paper charts and pillboxes with zero accountability or verification.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Anxious family caregivers calling daily to verify if morning medicines were taken.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Forgotten clinic visits and misplaced instructions from multi-doctor specialists.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Complex apps designed for tech-savvy youngsters, unreadable for senior eyes.</span>
                </li>
              </ul>
            </div>

            {/* The CareOrbit 360 Way */}
            <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white mb-6">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-teal-950">The CareOrbit 360 Solution</h3>
              <ul className="mt-6 space-y-4 text-sm font-medium text-teal-950/80">
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>High-contrast senior typography with one-touch dose confirmation and sound feedback.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>Shared Care Circle where adult children and nurses see live dose updates automatically.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>Consolidated clinical appointment agenda with preparation notes and reminder emails.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">✓</span>
                  <span>One-click Emergency SOS alert system with safety countdown to eliminate false alarms.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CORE CAPABILITIES (FEATURES)                                */}
      {/* ============================================================== */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-[.25em] text-teal-700">
              Complete Coordination
            </h2>
            <p className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
              Five Connected Care Pillars
            </p>
            <p className="mt-4 text-base text-slate-600">
              Designed according to modern accessibility guidelines with high contrast, large targets, and instant feedback.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Medication Routine */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Pill size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Medication Management</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Full prescription management with exact dosage, timing schedules, intake instructions, and duplicate dose prevention.
              </p>
            </div>

            {/* 2. Appointments */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
                <CalendarDays size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Doctor Visits & Calendar</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Keep track of specialist consultations, clinic locations, and appointment preparation notes in one organized agenda.
              </p>
            </div>

            {/* 3. Care Circle */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-md shadow-purple-500/20">
                <Users size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Family Care Circle</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Connect family members, authorized caregivers, and visiting nurses to keep everyone aligned without endless texting.
              </p>
            </div>

            {/* 4. Adherence Analytics */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
                <BarChart3 size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Adherence Analytics</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Visual 7-day and 30-day compliance tracking with interactive charts, streak calculations, and clinical report exports.
              </p>
            </div>

            {/* 5. Emergency SOS */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
                <ShieldAlert size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Emergency SOS Safety Net</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                High-visibility urgent assistance trigger with audible countdown, instant guardian broadcast, and zero false-alarm friction.
              </p>
            </div>

            {/* 6. Email Notifications */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
                <Activity size={24} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Resend Email Alerts</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Automated medication reminders and caregiver updates delivered straight to inboxes via high-reliability Resend API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECURITY & PRIVACY POSITIONING                              */}
      {/* ============================================================== */}
      <section id="security" className="border-t border-slate-200/80 bg-slate-900 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3.5 py-1.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                <Lock size={14} />
                <span>Enterprise Security & Data Isolation</span>
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl text-white">
                Built on Zero-Trust Architecture
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
                Senior health data is private. CareOrbit 360 secures your data using Supabase Authentication,
                PostgreSQL Row Level Security (RLS), and verified JWT verification on every single backend API request.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 text-sm">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                  <ShieldCheck size={20} className="text-teal-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white">Row Level Security</h4>
                    <p className="text-xs text-slate-400 mt-1">Users can only query and mutate their own medical records at the database level.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-800/80 p-4 border border-slate-700">
                  <ShieldCheck size={20} className="text-teal-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-white">Encrypted Sessions</h4>
                    <p className="text-xs text-slate-400 mt-1">All auth tokens are verified via Supabase SDK; passwords never touch our servers.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-3xl border border-teal-800/60 bg-gradient-to-br from-teal-950/60 to-slate-900 p-6 shadow-xl">
                <h3 className="text-base font-bold text-teal-300">Ready to Experience CareOrbit 360?</h3>
                <p className="mt-2 text-xs text-slate-300">
                  Test the complete platform right now with realistic demo data, or create an authenticated account.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => onEnterDemo("patient")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-bold text-slate-950 hover:bg-teal-400 transition shadow-lg shadow-teal-500/20"
                  >
                    <span>Launch Interactive Demo</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth("signup")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-bold text-white hover:bg-slate-700 transition"
                  >
                    <span>Create Full Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. FOOTER                                                      */}
      {/* ============================================================== */}
      <footer className="border-t border-slate-200/80 bg-white py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
              <Heart size={14} fill="white" />
            </div>
            <span className="font-extrabold text-slate-800">CareOrbit 360</span>
            <span>— Prompt Wars Winning Edition</span>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-400">
            CareOrbit 360 is a coordination tool and does not provide clinical diagnoses or replace 911 emergency services.
          </p>
        </div>
      </footer>
    </div>
  );
}
