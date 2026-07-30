import { Crown, Flame, Medal } from "lucide-react";
import type { CirclePulse as CirclePulseData, CircleHonor } from "@/lib/achievements";

interface CirclePulseProps {
  pulse: CirclePulseData;
}

const honorCopy: Record<
  CircleHonor,
  { label: string; description: string; icon: typeof Crown }
> = {
  consistency: {
    label: "Consistency",
    description: "Best weighted completion",
    icon: Medal,
  },
  allIn: {
    label: "All-in",
    description: "Most complete shared days",
    icon: Crown,
  },
  earlyFinisher: {
    label: "Early Finisher",
    description: "First across contested goals",
    icon: Flame,
  },
};

export function CirclePulse({ pulse }: CirclePulseProps) {
  return (
    <section aria-labelledby="circle-pulse-title" className="stock rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="circle-pulse-title" className="text-sm font-extrabold">
            Circle pulse
          </h3>
          <p className="text-muted-foreground text-xs">
            Shared momentum and rolling 30-day honors.
          </p>
        </div>
        {pulse.perfectToday && (
          <span className="border-line bg-chart-4 text-primary-foreground rotate-2 rounded-md border-2 px-2 py-1 text-[11px] font-black uppercase">
            All In
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-well border-line rounded-lg border-2 p-3">
          <dt className="text-muted-foreground text-[11px] font-semibold">
            Shared streak
          </dt>
          <dd className="tnum mt-0.5 text-xl font-black">
            {pulse.currentStreak}
            <span className="ml-1 text-xs font-semibold">due days</span>
          </dd>
        </div>
        <div className="bg-well border-line rounded-lg border-2 p-3">
          <dt className="text-muted-foreground text-[11px] font-semibold">
            Perfect days
          </dt>
          <dd className="tnum mt-0.5 text-xl font-black">
            {pulse.perfectDays.length}
            <span className="ml-1 text-xs font-semibold">of 30</span>
          </dd>
        </div>
      </dl>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(["consistency", "allIn", "earlyFinisher"] as CircleHonor[]).map(
          (honorKey) => {
            const copy = honorCopy[honorKey];
            const honor = pulse.honors.find((item) => item.honor === honorKey);
            const Icon = copy.icon;
            return (
              <article
                key={honorKey}
                className="border-line flex min-w-0 gap-2 rounded-lg border-2 p-3"
              >
                <Icon className="text-primary-strong mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold">{copy.label}</p>
                  <p className="truncate text-sm font-black">
                    {honor
                      ? honor.holders
                          .map((holder) => `${holder.name}${holder.isMe ? " (You)" : ""}`)
                          .join(" · ")
                      : "Gathering data"}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{copy.description}</p>
                </div>
              </article>
            );
          },
        )}
      </div>
    </section>
  );
}
