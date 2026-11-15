
import AuthGate from "./components/AuthGate";
import MedicationManager from "./components/MedicationManager";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Heart,
  HeartHandshake,
  Menu,
  ShieldCheck,
  Users,
  X,
  Pill,
} from "lucide-react";

function AppContent() {
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const openDashboard = () => {
    setMobileMenu(false);
    setDashboardOpen(true);
  };

  const features = [
    {
      icon: Pill,
      title: "Medication care",
      description:
        "Keep medication schedules organized and make daily adherence easier to track.",
    },
    {
      icon: Users,
      title: "Family connected",
      description:
        "Bring family members and caregivers into one shared care experience.",
    },
    {
      icon: CalendarDays,
      title: "Appointment planning",
      description:
        "Keep upcoming doctor visits and important care dates in one place.",
    },
    {
      icon: Activity,
      title: "Care insights",
      description:
        "Understand medication adherence patterns and stay informed about missed doses.",
    },
  ];

  // Dashboard view
  if (dashboardOpen) {
    return (
      <main className="min-h-screen bg-[#f5f9f7] p-5 md:p-10">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => setDashboardOpen(false)}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-[#287b69] transition hover:gap-3"
          >
            <ArrowRight className="rotate-180" size={17} />
            Back to home
          </button>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-widest text-[#439b83]">
                CAREORBIT 360
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-[#193b3b] md:text-4xl">
                Your care dashboard
              </h1>

              <p className="mt-2 text-[#718581]">
                A simple overview of your family's care.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#43b58c]" />
              <span className="text-sm font-semibold text-[#45645c]">
                Your care space
              </span>
            </div>
          </div>

          {/* Dashboard summary cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Pill,
                label: "Today's medications",
                value: "Live tracker",
                color: "bg-[#e4f5ed]",
              },
              {
                icon: CalendarDays,
                label: "Upcoming appointments",
                value: "Coming soon",
                color: "bg-[#e9efff]",
              },
              {
                icon: Users,
                label: "Care circle members",
                value: "1 account",
                color: "bg-[#fff2df]",
              },
              {
                icon: Activity,
                label: "Adherence overview",
                value: "Track doses below",
                color: "bg-[#f2eaff]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl bg-white p-6 shadow-sm"
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}
                >
                  <item.icon size={21} />
                </div>

                <p className="text-sm text-[#7b8e88]">{item.label}</p>

                <p className="mt-2 text-lg font-extrabold text-[#24443d]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Medication management */}
          <section className="mt-8">
            <MedicationManager />
          </section>

          {/* Care circle information */}
          <div className="mt-7 rounded-3xl bg-[#214b43] p-7 text-white shadow-sm">
            <HeartHandshake size={30} className="text-[#a8e4cf]" />

            <h2 className="mt-5 text-xl font-bold">
              Care works better together.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#d0e5dc]">
              Family coordination and appointment management are planned
              for the next CareOrbit 360 milestones.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Landing page
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fbf9]">
      {/* Navigation */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#267e69] text-white shadow-lg shadow-[#267e69]/20">
            <Heart size={23} fill="white" />
          </div>

          <div>
            <p className="text-xl font-extrabold tracking-tight text-[#21453d]">
              CareOrbit
            </p>
            <p className="-mt-1 text-[10px] font-bold tracking-[.25em] text-[#72a795]">
              360 HEALTHCARE
            </p>
          </div>
        </a>

        <div className="hidden items-center gap-9 text-sm font-semibold text-[#60766e] md:flex">
          <a
            href="#features"
            className="transition hover:text-[#267e69]"
          >
            Features
          </a>

          <a
            href="#about"
            className="transition hover:text-[#267e69]"
          >
            Our approach
          </a>

          <button
            onClick={openDashboard}
            className="rounded-full bg-[#267e69] px-6 py-3 text-white shadow-lg shadow-[#267e69]/20 transition hover:-translate-y-0.5 hover:bg-[#1c6655]"
          >
            Open dashboard
            <ArrowRight className="ml-2 inline" size={16} />
          </button>
        </div>

        {/* Mobile navigation button */}
        <button
          className="rounded-xl p-2 text-[#285448] md:hidden"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="relative z-30 mx-5 rounded-2xl bg-white p-5 shadow-xl md:hidden">
          <a
            onClick={() => setMobileMenu(false)}
            href="#features"
            className="block py-3 font-semibold"
          >
            Features
          </a>

          <a
            onClick={() => setMobileMenu(false)}
            href="#about"
            className="block py-3 font-semibold"
          >
            Our approach
          </a>

          <button
            onClick={openDashboard}
            className="mt-2 w-full rounded-xl bg-[#267e69] p-3 font-bold text-white"
          >
            Open dashboard
          </button>
        </div>
      )}

      {/* Hero section */}
      <section className="hero-glow relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-12 lg:grid-cols-2 lg:px-10 lg:pb-32 lg:pt-20">
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8eee4] bg-white/80 px-4 py-2 text-xs font-bold tracking-wide text-[#39836e]"
            >
              <span className="h-2 w-2 rounded-full bg-[#55bd94]" />
              A NEW WAY TO EXPERIENCE FAMILY CARE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="max-w-2xl text-5xl font-extrabold leading-[1.08] tracking-tight text-[#1e403a] sm:text-6xl lg:text-[68px]"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Every moment of care,{" "}
              <span className="text-[#46a88a]">connected.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-7 max-w-xl text-lg leading-8 text-[#72877e]"
            >
              One thoughtful space for medication routines, family
              coordination, appointments, and the everyday moments that make
              care meaningful.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={openDashboard}
                className="rounded-full bg-[#267e69] px-7 py-4 font-bold text-white shadow-xl shadow-[#267e69]/20 transition hover:-translate-y-1 hover:bg-[#1c6655]"
              >
                Explore your care space
                <ArrowRight className="ml-2 inline" size={18} />
              </button>

              <a
                href="#features"
                className="rounded-full border border-[#dce9e2] bg-white/80 px-7 py-4 font-bold text-[#42665a] transition hover:bg-white"
              >
                Discover features
              </a>
            </motion.div>

            <div className="mt-12 flex flex-wrap gap-7 text-sm text-[#71877e]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-[#4aa486]" />
                Privacy-minded design
              </div>

              <div className="flex items-center gap-2">
                <Heart size={17} className="text-[#4aa486]" />
                Family-centered care
              </div>
            </div>
          </div>

          {/* Hero illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative mx-auto flex min-h-[450px] w-full max-w-[550px] items-center justify-center"
          >
            <div className="absolute h-[390px] w-[390px] rounded-full border border-dashed border-[#a9d9c6] orbit sm:h-[470px] sm:w-[470px]" />

            <div className="absolute h-[300px] w-[300px] rounded-full border border-[#d1e9de] sm:h-[370px] sm:w-[370px]" />

            <div className="absolute h-[245px] w-[245px] rounded-full bg-gradient-to-br from-[#d6f3e5] to-[#b5e1d1] shadow-[0_30px_90px_rgba(53,148,119,.2)] sm:h-[300px] sm:w-[300px]" />

            <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-[#3ca886] to-[#1e6858] text-white shadow-2xl shadow-[#267e69]/30 sm:h-48 sm:w-48">
              <div className="text-center">
                <Heart size={54} strokeWidth={1.5} className="mx-auto" />
                <p className="mt-3 text-lg font-extrabold tracking-wide">
                  CareOrbit
                </p>
                <p className="text-xs tracking-[.3em] text-[#c9f0df]">
                  360
                </p>
              </div>
            </div>

            <div className="glass float absolute left-0 top-12 z-20 rounded-2xl p-4 sm:left-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#e1f5eb] p-3 text-[#399b79]">
                  <Pill size={22} />
                </div>
                <div>
                  <p className="text-xs text-[#82948c]">Daily routine</p>
                  <p className="font-bold text-[#31564a]">Medication care</p>
                </div>
                <Check size={17} className="ml-2 text-[#48a681]" />
              </div>
            </div>

            <div className="glass float absolute right-0 top-28 z-20 rounded-2xl p-4 [animation-delay:1s] sm:right-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#e9edff] p-3 text-[#667cbd]">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-xs text-[#82948c]">Together</p>
                  <p className="font-bold text-[#31564a]">
                    Family care circle
                  </p>
                </div>
              </div>
            </div>

            <div className="glass float absolute bottom-12 left-1 z-20 rounded-2xl p-4 [animation-delay:2s] sm:left-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#fff0df] p-3 text-[#d18d45]">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <p className="text-xs text-[#82948c]">Stay organized</p>
                  <p className="font-bold text-[#31564a]">
                    Care appointments
                  </p>
                </div>
              </div>
            </div>

            <div className="glass absolute bottom-9 right-0 z-20 rounded-2xl p-4 sm:right-1">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#f4e9ff] p-3 text-[#9564b9]">
                  <Bell size={21} />
                </div>
                <div>
                  <p className="text-xs text-[#82948c]">Stay informed</p>
                  <p className="font-bold text-[#31564a]">
                    Helpful reminders
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute right-[20%] top-[4%] h-4 w-4 rounded-full bg-[#e6bd77] shadow-lg" />
            <div className="absolute bottom-[8%] right-[24%] h-3 w-3 rounded-full bg-[#79b8d0]" />
          </motion.div>
        </div>
      </section>

      {/* Platform highlights */}
      <section className="border-y border-[#e8f0eb] bg-white/70 py-7">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-14 gap-y-5 px-6 text-sm font-semibold text-[#6f887d]">
          <span className="flex items-center gap-2">
            <Pill size={17} />
            Medication routines
          </span>

          <span className="flex items-center gap-2">
            <Users size={17} />
            Family coordination
          </span>

          <span className="flex items-center gap-2">
            <CalendarDays size={17} />
            Appointment planning
          </span>

          <span className="flex items-center gap-2">
            <Activity size={17} />
            Adherence insights
          </span>
        </div>
      </section>

      {/* Features section */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold tracking-[.25em] text-[#49a486]">
            ONE CONNECTED CARE EXPERIENCE
          </p>

          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[#21453d] md:text-5xl">
            Care that comes together.
          </h2>

          <p className="mt-5 leading-7 text-[#7b8f86]">
            Less fragmentation. More clarity. A shared place for the people
            and routines that matter.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-3xl border border-[#eaf1ec] bg-white p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-xl hover:shadow-[#315d4b]/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6ef] text-[#369477] transition group-hover:bg-[#267e69] group-hover:text-white">
                <feature.icon size={25} />
              </div>

              <h3 className="mt-7 text-lg font-extrabold text-[#284c41]">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#82938b]">
                {feature.description}
              </p>

              <button
                type="button"
                onClick={openDashboard}
                className="mt-6 flex items-center gap-2 text-sm font-bold text-[#4a9c80] transition hover:gap-3"
              >
                Explore feature
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About section */}
      <section
        id="about"
        className="bg-[#214b43] px-6 py-20 text-white"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold tracking-[.25em] text-[#a9e2c9]">
              THE CAREORBIT APPROACH
            </p>

            <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
              More confidence in every day of care.
            </h2>
          </div>

          <div>
            <p className="leading-8 text-[#d1e5db]">
              CareOrbit 360 is designed to make everyday healthcare
              coordination simpler for older adults, families, and caregivers.
              Organize routines, share information, and keep important
              reminders in view.
            </p>

            <button
              onClick={openDashboard}
              className="mt-7 rounded-full bg-[#b9ead2] px-7 py-4 font-extrabold text-[#214b43] transition hover:-translate-y-1 hover:bg-white"
            >
              Enter CareOrbit 360
              <ArrowRight className="ml-2 inline" size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-4 bg-[#193d36] px-6 py-8 text-sm text-[#c2d8ce] md:px-10">
        <p className="font-bold tracking-wide">CareOrbit 360</p>
        <p>Connected care. More thoughtful days.</p>
        <p className="text-xs text-[#9bb9aa]">
          A care coordination platform, not a medical diagnosis service.
        </p>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}
