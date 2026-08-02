import {
  ArrowLeft,
  Check,
  Cpu,
  Download,
  ExternalLink,
  FolderInput,
  MonitorDown,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { RELEASES_URL, REPOSITORY_URL } from "@/lib/links";

const releaseFiles = [
  {
    title: "Apple Silicon",
    detail: "M1, M2, M3, M4, or newer Apple chips",
    file: "Habits_2.1.0_aarch64.dmg",
    color: "bg-chart-1",
  },
  {
    title: "Intel Mac",
    detail: "Macs that show an Intel processor",
    file: "Habits_2.1.0_x64.dmg",
    color: "bg-chart-3",
  },
] as const;

export function InstallGuide() {
  return (
    <div className="landing-page min-h-dvh bg-background text-foreground">
      <header className="border-line border-b-2 bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-2 font-black tracking-[-0.03em]"
          >
            <span className="border-line bg-primary flex size-8 items-center justify-center rounded-lg border-2 text-primary-foreground">
              <Check className="size-5" strokeWidth={3.5} />
            </span>
            HABITS
          </a>
          <a
            href="/"
            className="text-muted-foreground ml-auto flex items-center gap-1.5 text-sm font-extrabold hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <section>
          <p className="bg-chart-4 border-line inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-black text-primary-foreground">
            <MonitorDown className="size-4" /> Desktop installation guide
          </p>
          <h1 className="mt-6 max-w-[13ch] text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] font-black tracking-[-0.045em] text-balance">
            Install Habits without the mystery.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-[62ch] text-lg leading-relaxed text-pretty">
            Habits is distributed directly from GitHub. macOS and Windows may ask you
            to confirm the first launch because the desktop installers are not yet
            notarized or code-signed for public distribution.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={RELEASES_URL}
              className="stock stock-press active:stock-press-active flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-primary-foreground"
            >
              <Download className="size-4" /> Open desktop downloads
            </a>
            <a
              href="#first-launch"
              className="stock stock-press active:stock-press-active flex h-12 items-center gap-2 rounded-lg bg-card px-5 text-sm font-black"
            >
              First-launch help
            </a>
          </div>
        </section>

        <section className="mt-20">
          <div className="mb-6">
            <p className="text-primary-strong text-xs font-black tracking-[0.12em] uppercase">
              Step 1
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">
              Choose the right installer
            </h2>
            <p className="text-muted-foreground mt-2 font-semibold">
              Mac users can check Apple menu → About This Mac. Windows users need the
              x64 setup file.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {releaseFiles.map((release) => (
              <article key={release.title} className="stock overflow-hidden rounded-xl">
                <div
                  className={`${release.color} border-line flex items-center gap-3 border-b-2 p-5 text-primary-foreground`}
                >
                  <Cpu className="size-6" />
                  <h3 className="text-2xl font-black">{release.title}</h3>
                </div>
                <div className="p-5">
                  <p className="font-bold">{release.detail}</p>
                  <code className="bg-muted border-line mt-5 block overflow-x-auto rounded-lg border-2 p-3 text-xs font-bold">
                    {release.file}
                  </code>
                </div>
              </article>
            ))}
          </div>
          <article className="stock mt-5 overflow-hidden rounded-xl">
            <div className="bg-chart-2 border-line flex items-center gap-3 border-b-2 p-5 text-primary-foreground">
              <MonitorDown className="size-6" />
              <div>
                <h3 className="text-2xl font-black">Windows 10/11 · x64</h3>
                <p className="text-sm font-bold">Native Windows installer</p>
              </div>
            </div>
            <div className="p-5">
              <p className="font-bold">64-bit Intel or AMD computers</p>
              <code className="bg-muted border-line mt-5 block overflow-x-auto rounded-lg border-2 p-3 text-xs font-bold">
                Habits_2.1.0_x64-setup.exe
              </code>
            </div>
          </article>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          <InstallStep
            number="2"
            icon={<Download className="size-6" />}
            title="Open the DMG"
            detail="Double-click the downloaded DMG after it finishes."
          />
          <InstallStep
            number="3"
            icon={<FolderInput className="size-6" />}
            title="Move Habits"
            detail="Drag Habits into the Applications folder, then eject the DMG."
          />
          <InstallStep
            number="4"
            icon={<ShieldCheck className="size-6" />}
            title="Confirm once"
            detail="Use the safe first-launch steps below if macOS blocks it."
          />
        </section>

        <section
          id="first-launch"
          className="stock mt-16 scroll-mt-6 overflow-hidden rounded-xl"
        >
          <div className="bg-chart-3 border-line border-b-2 p-6 text-primary-foreground sm:p-8">
            <ShieldCheck className="size-8" />
            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em]">
              If macOS says it cannot verify the developer
            </h2>
          </div>
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-black">Try this first</p>
              <ol className="mt-4 space-y-4 text-sm font-semibold">
                <li className="flex gap-3">
                  <StepNumber>1</StepNumber>
                  Open Finder → Applications.
                </li>
                <li className="flex gap-3">
                  <StepNumber>2</StepNumber>
                  Control-click Habits, then choose Open.
                </li>
                <li className="flex gap-3">
                  <StepNumber>3</StepNumber>
                  Choose Open again in the confirmation dialog.
                </li>
              </ol>
            </div>
            <div>
              <p className="text-sm font-black">If it is still blocked</p>
              <ol className="mt-4 space-y-4 text-sm font-semibold">
                <li className="flex gap-3">
                  <StepNumber>1</StepNumber>
                  <span>
                    Open <strong>System Settings → Privacy &amp; Security</strong>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <StepNumber>2</StepNumber>
                  Scroll to Security and choose Open Anyway for Habits.
                </li>
                <li className="flex gap-3">
                  <StepNumber>3</StepNumber>
                  Confirm with your Mac password or Touch ID.
                </li>
              </ol>
            </div>
          </div>
          <div className="tear bg-muted px-6 py-5 text-sm font-extrabold sm:px-8">
            Do not disable Gatekeeper and do not run random Terminal commands. Only open
            a DMG from the official release page, and compare its SHA-256 checksum with
            the attached <code>SHA256SUMS.txt</code> file.
          </div>
        </section>

        <section className="stock mt-16 overflow-hidden rounded-xl">
          <div className="bg-chart-2 border-line border-b-2 p-6 text-primary-foreground sm:p-8">
            <MonitorDown className="size-8" />
            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em]">
              Installing on Windows
            </h2>
          </div>
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-black">Normal installation</p>
              <ol className="mt-4 space-y-4 text-sm font-semibold">
                <li className="flex gap-3">
                  <StepNumber>1</StepNumber>
                  Download the x64 setup file from the official GitHub Release.
                </li>
                <li className="flex gap-3">
                  <StepNumber>2</StepNumber>
                  Compare its SHA-256 checksum with the attached SHA256SUMS file.
                </li>
                <li className="flex gap-3">
                  <StepNumber>3</StepNumber>
                  Open the setup file and follow the installer.
                </li>
              </ol>
            </div>
            <div>
              <p className="text-sm font-black">If SmartScreen appears</p>
              <ol className="mt-4 space-y-4 text-sm font-semibold">
                <li className="flex gap-3">
                  <StepNumber>1</StepNumber>
                  Confirm the publisher warning is for the Habits installer you just
                  verified.
                </li>
                <li className="flex gap-3">
                  <StepNumber>2</StepNumber>
                  Choose More info, then Run anyway.
                </li>
                <li className="flex gap-3">
                  <StepNumber>3</StepNumber>
                  Approve the Windows security prompt to finish.
                </li>
              </ol>
            </div>
          </div>
          <div className="tear bg-muted px-6 py-5 text-sm font-extrabold sm:px-8">
            Never disable Windows SmartScreen globally. If the file name or checksum
            does not match the official release, delete it.
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2">
          <article className="stock-flat rounded-xl p-6">
            <Settings className="size-6 text-primary-strong" />
            <h2 className="mt-5 text-xl font-black">Updating later</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed font-semibold">
              The desktop app downloads signed updates automatically. Restart from the
              update banner or Settings when an update is ready.
            </p>
          </article>
          <article className="stock-flat rounded-xl p-6">
            <ShieldCheck className="size-6 text-primary-strong" />
            <h2 className="mt-5 text-xl font-black">Verify the source</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed font-semibold">
              Habits is open source. Review the code and release tag before installing.
            </p>
            <a
              href={REPOSITORY_URL}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-primary-strong hover:underline"
            >
              View source <ExternalLink className="size-4" />
            </a>
          </article>
        </section>
      </main>
    </div>
  );
}

function InstallStep({
  number,
  icon,
  title,
  detail,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <article className="stock-flat rounded-xl p-5">
      <div className="flex items-center justify-between">
        {icon}
        <span className="tnum text-muted-foreground text-4xl font-black">{number}</span>
      </div>
      <h3 className="mt-8 text-xl font-black">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed font-semibold">
        {detail}
      </p>
    </article>
  );
}

function StepNumber({ children }: { children: ReactNode }) {
  return (
    <span className="border-line bg-primary flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black text-primary-foreground">
      {children}
    </span>
  );
}
