import {
  ArrowRight,
  Bell,
  Check,
  Code2,
  Clock3,
  Download,
  Laptop,
  LockKeyhole,
  MonitorDown,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { RELEASES_URL, REPOSITORY_URL } from "@/lib/links";

const punchStates = [
  "idle",
  "done",
  "done",
  "idle",
  "done",
  "done",
  "done",
  "idle",
  "done",
  "done",
  "done",
  "done",
  "idle",
  "done",
] as const;

export function Landing() {
  return (
    <div className="landing-page min-h-dvh overflow-hidden bg-background text-foreground">
      <header className="border-line relative z-20 border-b-2 bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 font-black tracking-[-0.03em]">
            <span className="border-line bg-primary flex size-8 items-center justify-center rounded-lg border-2 text-primary-foreground">
              <Check className="size-5" strokeWidth={3.5} />
            </span>
            HABITS
          </a>
          <nav aria-label="Landing page" className="ml-auto flex items-center gap-2 sm:gap-5">
            <a
              href="#why"
              className="text-muted-foreground hidden text-sm font-bold hover:text-foreground sm:block"
            >
              Why Habits
            </a>
            <a
              href="#download"
              className="text-muted-foreground hidden text-sm font-bold hover:text-foreground sm:block"
            >
              Download
            </a>
            <a
              href="/app"
              className="stock stock-press active:stock-press-active flex h-9 items-center gap-1.5 rounded-lg bg-card px-3 text-xs font-extrabold"
            >
              Open web app <ArrowRight className="size-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="landing-orbit landing-orbit-one" aria-hidden />
          <div className="landing-orbit landing-orbit-two" aria-hidden />
          <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-line bg-chart-4 px-3 py-1.5 text-xs font-extrabold text-primary-foreground">
                <LockKeyhole className="size-3.5" />
                Local-first. End-to-end encrypted.
              </p>
              <h1 className="max-w-[12ch] text-[clamp(3.25rem,8vw,6rem)] leading-[0.9] font-black tracking-[-0.04em] text-balance">
                Keep the promise. Together.
              </h1>
              <p className="text-muted-foreground mt-6 max-w-[60ch] text-lg leading-relaxed text-pretty sm:text-xl">
                A private habit tracker for the promises you make to yourself—and the
                small circle that helps you keep them.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/app"
                  className="stock stock-press active:stock-press-active flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-primary-foreground"
                >
                  Start in your browser <ArrowRight className="size-4" />
                </a>
                <a
                  href={RELEASES_URL}
                  className="stock stock-press active:stock-press-active flex h-12 items-center gap-2 rounded-lg bg-card px-5 text-sm font-black"
                >
                  <Download className="size-4" /> Download desktop
                </a>
              </div>
              <p className="text-muted-foreground mt-4 text-xs font-semibold">
                Free to start · No ads in the app · macOS, Windows, and web
              </p>
            </div>

            <HeroPunchCard />
          </div>
        </section>

        <section className="border-line border-y-2 bg-foreground text-background">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-4 px-4 py-5 text-sm font-extrabold sm:px-6 lg:px-8">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-chart-4" /> Your data stays encrypted
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-4 text-chart-2" /> Circles stay small and human
            </span>
            <span className="flex items-center gap-2">
              <Laptop className="size-4 text-chart-1" /> Works offline, syncs later
            </span>
          </div>
        </section>

        <section id="why" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-8">
              <h2 className="max-w-[11ch] text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] font-black tracking-[-0.04em] text-balance">
                Accountability without the leaderboard.
              </h2>
              <p className="text-muted-foreground mt-5 max-w-[52ch] text-lg leading-relaxed text-pretty">
                Circles show who checked in, how the group is moving, and the quiet
                honors people have earned. Nobody loses points. Nobody gets ranked.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <section className="stock overflow-hidden rounded-xl">
                <div className="bg-chart-3 text-primary-foreground flex items-center gap-3 border-b-2 border-line p-4">
                  <span className="text-3xl">🤝</span>
                  <div>
                    <h3 className="text-xl font-black">Weekend crew</h3>
                    <p className="text-sm font-bold">3 people · 2 shared habits</p>
                  </div>
                  <span className="ml-auto rotate-2 rounded-md border-2 border-line bg-chart-4 px-2 py-1 text-xs font-black">
                    ALL IN
                  </span>
                </div>
                <div className="grid gap-0 sm:grid-cols-2">
                  <div className="border-line p-5 sm:border-r-2">
                    <p className="text-muted-foreground text-xs font-bold">Shared streak</p>
                    <p className="tnum mt-1 text-4xl font-black">
                      12 <span className="text-sm">due days</span>
                    </p>
                    <div className="mt-5 flex -space-x-2">
                      {["BO", "MA", "AL"].map((initials, index) => (
                        <span
                          key={initials}
                          className="border-line flex size-10 items-center justify-center rounded-full border-2 text-xs font-black"
                          style={{
                            backgroundColor: [
                              "var(--chart-1)",
                              "var(--chart-2)",
                              "var(--chart-4)",
                            ][index],
                            color: "var(--on-hue)",
                          }}
                        >
                          {initials}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="tear p-5 sm:border-t-0">
                    <p className="text-muted-foreground text-xs font-bold">
                      Rolling honors
                    </p>
                    <ul className="mt-3 space-y-3 text-sm font-extrabold">
                      <li className="flex items-center gap-2">
                        <Sparkles className="size-4 text-chart-3" /> Consistency · Maya
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="size-4 text-chart-1" /> All-in · Everyone
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock3 className="size-4 text-chart-2" /> Early Finisher · Alex
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 sm:grid-cols-2">
                <article className="bg-chart-4 border-line rounded-xl border-2 p-6 text-primary-foreground shadow-[4px_4px_0_var(--stock-shadow)]">
                  <Bell className="size-6" />
                  <h3 className="mt-8 text-2xl font-black tracking-[-0.03em]">
                    Notice the effort.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed font-semibold">
                    Native desktop alerts make every check-in visible without turning
                    support into pressure.
                  </p>
                </article>
                <article className="bg-chart-1 border-line rounded-xl border-2 p-6 text-primary-foreground shadow-[4px_4px_0_var(--stock-shadow)]">
                  <LockKeyhole className="size-6" />
                  <h3 className="mt-8 text-2xl font-black tracking-[-0.03em]">
                    Private by design.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed font-semibold">
                    Check-ins live on your devices and sync as encrypted data the
                    server cannot read.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="border-line border-y-2 bg-card">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
            <InsightPreview />
            <div className="max-w-xl">
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] font-black tracking-[-0.04em] text-balance">
                See your pattern. Keep your pace.
              </h2>
              <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty">
                Insights turns completed opportunities, partial progress, streaks, and
                Circle honors into honest momentum—without pretending every day is the
                same.
              </p>
              <ul className="mt-7 space-y-3 text-sm font-extrabold">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary-strong" /> Cadence-aware completion
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary-strong" /> 7, 14, and 30-day views
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary-strong" /> Endless milestones,
                  never penalties
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="download" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="stock relative overflow-hidden rounded-xl bg-primary p-7 text-primary-foreground sm:p-12">
            <div className="landing-download-dots" aria-hidden />
            <div className="relative z-10 max-w-3xl">
              <MonitorDown className="size-8" />
              <h2 className="mt-8 text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] font-black tracking-[-0.04em] text-balance">
                Put your habits where your day already lives.
              </h2>
              <p className="mt-5 max-w-[58ch] text-lg leading-relaxed font-semibold">
                The desktop app adds a tray check-in panel, timers that stop on time,
                native Circle alerts, and quiet launch at login.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={RELEASES_URL}
                  className="stock stock-press active:stock-press-active flex h-12 items-center gap-2 rounded-lg bg-card px-5 text-sm font-black text-foreground"
                >
                  <Download className="size-4" /> macOS downloads
                </a>
                <a
                  href={RELEASES_URL}
                  className="stock stock-press active:stock-press-active flex h-12 items-center gap-2 rounded-lg bg-card px-5 text-sm font-black text-foreground"
                >
                  <Download className="size-4" /> Windows downloads
                </a>
              </div>
              <p className="mt-3 text-xs font-bold">
                Apple Silicon, Intel Mac, and Windows 10/11 installers are published
                with each GitHub Release.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-line border-t-2">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="font-black">HABITS · habit-tracker.fun</p>
          <p className="text-muted-foreground sm:ml-auto">
            Built for private progress and real people.
          </p>
          <a
            href={REPOSITORY_URL}
            className="flex items-center gap-1.5 font-bold hover:text-primary-strong"
          >
            <Code2 className="size-4" /> Source
          </a>
        </div>
      </footer>
    </div>
  );
}

function HeroPunchCard() {
  return (
    <div className="relative mx-auto w-full max-w-[42rem] lg:mr-0">
      <div className="landing-note absolute -top-8 right-0 z-10 hidden rotate-3 border-2 border-line bg-chart-4 px-4 py-3 text-xs font-black text-primary-foreground shadow-[4px_4px_0_var(--stock-shadow)] sm:block">
        MAYA JUST CHECKED IN ✦
      </div>
      <div className="stock relative rotate-[-1.5deg] overflow-hidden rounded-xl bg-card">
        <div className="flex items-center gap-3 border-b-2 border-line bg-chart-1 p-4 text-primary-foreground sm:p-5">
          <div>
            <p className="text-2xl font-black tracking-[-0.03em]">Today</p>
            <p className="text-sm font-bold">Two promises kept. One in motion.</p>
          </div>
          <p className="tnum ml-auto text-3xl font-black">2 / 3</p>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <HabitMock emoji="🌱" name="Walk outside" detail="Every day" action="DONE" hue="var(--chart-4)" />
          <HabitMock emoji="📚" name="Read" detail="12 of 20 pages" action="+1" hue="var(--chart-2)" />
          <HabitMock emoji="🧘" name="Meditate" detail="8m of 10m" action="2:00" hue="var(--chart-3)" />
        </div>
        <div className="tear p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">30-day consistency</p>
              <p className="text-muted-foreground text-xs">One punch per opportunity</p>
            </div>
            <p className="tnum text-xl font-black">86%</p>
          </div>
          <div
            className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5"
            aria-hidden
          >
            {[...punchStates, ...punchStates].map((state, index) => (
              <span
                key={index}
                className="aspect-square rounded-[3px] border-2 border-line"
                style={{
                  backgroundColor:
                    state === "done" ? "var(--chart-1)" : "var(--well)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="stock absolute -bottom-9 -left-3 flex rotate-2 items-center gap-3 rounded-lg bg-card px-4 py-3 sm:-left-8">
        <div className="flex -space-x-2">
          {["BO", "MA", "AL"].map((name, index) => (
            <span
              key={name}
              className="border-line flex size-8 items-center justify-center rounded-full border-2 text-[10px] font-black"
              style={{
                backgroundColor: ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"][
                  index
                ],
                color: "var(--on-hue)",
              }}
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-xs font-black">YOUR CIRCLE IS MOVING</p>
      </div>
    </div>
  );
}

function HabitMock({
  emoji,
  name,
  detail,
  action,
  hue,
}: {
  emoji: string;
  name: string;
  detail: string;
  action: string;
  hue: string;
}) {
  return (
    <div className="border-line flex items-center gap-3 rounded-lg border-2 p-3">
      <span className="text-2xl">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{name}</p>
        <p className="text-muted-foreground truncate text-xs font-semibold">{detail}</p>
      </div>
      <span
        className="border-line rounded-md border-2 px-3 py-2 text-xs font-black"
        style={{ backgroundColor: hue, color: "var(--on-hue)" }}
      >
        {action}
      </span>
    </div>
  );
}

function InsightPreview() {
  const bars = [72, 48, 92, 61];
  return (
    <div className="stock rotate-1 rounded-xl p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div>
          <p className="text-sm font-black">INSIGHTS</p>
          <p className="text-muted-foreground text-xs">Latest 30 days</p>
        </div>
        <span className="ml-auto rounded-full border-2 border-line bg-chart-4 px-3 py-1 text-xs font-black text-primary-foreground">
          STEADY
        </span>
      </div>
      <p className="tnum mt-8 text-6xl font-black tracking-[-0.04em]">82%</p>
      <p className="text-muted-foreground mt-1 text-sm font-bold">
        41 of 50 due goals kept
      </p>
      <div className="tear mt-6 space-y-4 pt-5">
        {["Consistency", "Teamwork", "Encouragement", "Leadership"].map(
          (label, index) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-xs font-extrabold">
                <span>{label}</span>
                <span>Lv {index + 2}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border-2 border-line bg-well">
                <div
                  className="h-full"
                  style={{
                    width: `${bars[index]}%`,
                    backgroundColor: [
                      "var(--chart-1)",
                      "var(--chart-3)",
                      "var(--chart-2)",
                      "var(--chart-4)",
                    ][index],
                  }}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
