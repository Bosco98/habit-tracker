import type { CSSProperties } from "react";
import type { HabitInsightView } from "./types";

const CHART_SIZE = 240;
const CENTER = CHART_SIZE / 2;
const RADIUS = 74;
const MAX_DAYS = 30;

function point(index: number, axes: number, value = 1, radius = RADIUS) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / axes;
  return {
    x: CENTER + Math.cos(angle) * radius * value,
    y: CENTER + Math.sin(angle) * radius * value,
  };
}

function polygon(values: readonly number[], axes: number, radius = RADIUS) {
  return values
    .map((value, index) => {
      const position = point(index, axes, value, radius);
      return `${position.x},${position.y}`;
    })
    .join(" ");
}

export function HabitSpiderChart({ rows }: { rows: HabitInsightView[] }) {
  const habits = rows
    .map((row) => ({
      row,
      completed: row.heatmap.filter((cell) => row.series.doneDays.has(cell.day))
        .length,
      due: row.heatmap.filter((cell) => cell.due > 0).length,
    }))
    .sort((a, b) => b.completed - a.completed || a.row.index - b.row.index)
    .slice(0, 10);
  // A radar needs at least three spokes. Empty spokes carry no data and are
  // only used when a new account has one or two habits.
  const axes = Math.max(3, habits.length);
  const completedValues = [
    ...habits.map((habit) => habit.completed / MAX_DAYS),
    ...Array(axes - habits.length).fill(0),
  ];
  const dueValues = [
    ...habits.map((habit) => habit.due / MAX_DAYS),
    ...Array(axes - habits.length).fill(0),
  ];
  const detail = habits
    .map(
      ({ row, completed, due }) =>
        `${row.entry.habit.name}: ${completed} of 30 punches, due on ${due} days`,
    )
    .join(". ");

  return (
    <section className="stock flex h-full flex-col gap-3 rounded-xl p-4 md:col-span-2">
      <div>
        <h2 className="text-sm font-extrabold">30-day habit spider</h2>
        <p className="text-muted-foreground text-xs">
          Top habits by punches. The outer ring is 30 days.
        </p>
      </div>

      <div className="grid flex-1 items-center gap-3 md:grid-cols-2 md:gap-6">
        <svg
          viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
          role="img"
          aria-label={`Thirty-day habit spider chart. Blue is completed punches and pink is due days. ${detail}.`}
          className="mx-auto aspect-square w-full max-w-60 overflow-visible"
        >
          {[1 / 3, 2 / 3, 1].map((level) => (
            <polygon
              key={level}
              points={polygon(Array(axes).fill(level), axes)}
              fill="none"
              stroke="var(--line-soft)"
              strokeWidth={level === 1 ? 1.5 : 1}
            />
          ))}

          {Array.from({ length: axes }, (_, index) => {
            const edge = point(index, axes);
            const label = point(index, axes, 1, RADIUS + 18);
            const habit = habits[index];
            return (
              <g key={habit?.row.entry.habit.$jazz.id ?? `empty-${index}`}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="var(--line-soft)"
                  strokeWidth="1"
                />
                <text
                  x={label.x}
                  y={label.y}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill={habit ? "var(--foreground)" : "transparent"}
                  fontSize="10"
                  fontWeight="800"
                >
                  {habit ? index + 1 : ""}
                </text>
              </g>
            );
          })}

          <polygon
            points={polygon(dueValues, axes)}
            fill="var(--hue-pink)"
            fillOpacity="0.12"
            stroke="var(--hue-pink)"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
          <polygon
            points={polygon(completedValues, axes)}
            fill="var(--hue-blue)"
            fillOpacity="0.32"
            stroke="var(--hue-blue)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {completedValues.slice(0, habits.length).map((value, index) => {
            const position = point(index, axes, value);
            return (
              <circle
                key={habits[index].row.entry.habit.$jazz.id}
                cx={position.x}
                cy={position.y}
                r="3"
                fill="var(--hue-blue)"
                stroke="var(--foreground)"
                strokeWidth="1.5"
              />
            );
          })}

          {[10, 20, 30].map((value) => (
            <text
              key={value}
              x={CENTER + 4}
              y={CENTER - (RADIUS * value) / MAX_DAYS + 3}
              fill="var(--muted-foreground)"
              fontSize="7"
              fontWeight="650"
            >
              {value}
            </text>
          ))}
        </svg>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-[2px] bg-[var(--hue-blue)]" />
              Punches completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-5 border-t-2 border-dashed border-[var(--hue-pink)]" />
              Days due
            </span>
          </div>

          <ol className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {habits.map(({ row, completed, due }, index) => (
              <li
                key={row.entry.habit.$jazz.id}
                className="flex min-w-0 items-center gap-1.5 text-xs"
                title={`${row.entry.habit.name}: ${completed}/30 punches, ${due} days due`}
              >
                <span className="bg-hole border-line flex size-5 shrink-0 items-center justify-center rounded-[3px] border text-[10px] font-extrabold">
                  {index + 1}
                </span>
                <span aria-hidden>{row.entry.habit.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.entry.habit.name}
                </span>
                <span className="tnum text-muted-foreground shrink-0 font-bold">
                  {completed}/30
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function HabitComparisonChart({ rows }: { rows: HabitInsightView[] }) {
  const visible = rows.slice(0, 5);

  return (
    <section className="stock flex h-full flex-col gap-3 rounded-xl p-4">
      <div>
        <h2 className="text-sm font-extrabold">Habit strength</h2>
        <p className="text-muted-foreground text-xs">
          Completion rate for established habits.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3">
        {visible.map((row) => {
          const gathering = row.summary.due < 3;
          const rate = Math.round(row.summary.rate * 100);
          return (
            <div key={row.entry.habit.$jazz.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs">
                <span aria-hidden>{row.entry.habit.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {row.entry.habit.name}
                </span>
                <span className="tnum text-muted-foreground shrink-0 font-semibold">
                  {gathering ? "New" : `${rate}%`}
                </span>
              </div>
              <div
                role="img"
                aria-label={
                  gathering
                    ? `${row.entry.habit.name}: gathering data`
                    : `${row.entry.habit.name}: ${rate}% completion`
                }
                className="bg-hole border-line h-3 overflow-hidden rounded-[3px] border-2"
                style={{ "--bar-hue": row.hue } as CSSProperties}
              >
                <span
                  aria-hidden
                  className="block h-full bg-[var(--bar-hue)]"
                  style={{ width: gathering ? "8%" : `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {rows.length > visible.length && (
        <p className="text-muted-foreground text-[11px]">
          Showing the strongest {visible.length} of {rows.length}.
        </p>
      )}
    </section>
  );
}
