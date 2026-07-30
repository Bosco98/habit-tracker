import { invokeDesktop } from "./platform";

export interface RunningHabitTimer {
  startedAt: number;
  baseSeconds: number;
  targetSeconds: number;
}

const keyFor = (timerId: string) => `habits.timer.${timerId}`;

export function readRunningHabitTimer(timerId: string): RunningHabitTimer | null {
  try {
    const raw = localStorage.getItem(keyFor(timerId));
    if (!raw) return null;
    const timer = JSON.parse(raw) as Partial<RunningHabitTimer>;
    if (
      !Number.isFinite(timer.startedAt) ||
      !Number.isFinite(timer.baseSeconds) ||
      !Number.isFinite(timer.targetSeconds)
    ) {
      return null;
    }
    return timer as RunningHabitTimer;
  } catch {
    return null;
  }
}

export function startHabitTimer(
  timerId: string,
  label: string,
  baseSeconds: number,
  targetSeconds: number,
  startedAt = Date.now(),
): RunningHabitTimer | null {
  const seconds = Math.max(0, Math.ceil(targetSeconds - baseSeconds));
  if (seconds === 0) return null;

  const timer = { startedAt, baseSeconds, targetSeconds };
  localStorage.setItem(keyFor(timerId), JSON.stringify(timer));
  invokeDesktop("start_habit_timer", { timerId, seconds, label });
  return timer;
}

export function resumeHabitTimer(
  timerId: string,
  label: string,
  timer: RunningHabitTimer,
  now = Date.now(),
): void {
  const seconds = runningTimerSecondsLeft(timer, now);
  if (seconds > 0) {
    invokeDesktop("start_habit_timer", { timerId, seconds, label });
  }
}

export function runningTimerSecondsLeft(
  timer: RunningHabitTimer,
  now = Date.now(),
): number {
  const elapsed = Math.max(0, (now - timer.startedAt) / 1000);
  return Math.max(0, Math.ceil(timer.targetSeconds - timer.baseSeconds - elapsed));
}

export function cancelHabitTimer(timerId: string): void {
  localStorage.removeItem(keyFor(timerId));
  invokeDesktop("cancel_habit_timer", { timerId });
}

/** Clear persisted UI state without cancelling the shell's due notification. */
export function finishHabitTimer(timerId: string): void {
  localStorage.removeItem(keyFor(timerId));
}

export function cappedTimerValue(
  loggedSeconds: number,
  elapsedSeconds: number,
  targetSeconds: number,
): number {
  return Math.min(targetSeconds, Math.max(0, loggedSeconds) + Math.max(0, elapsedSeconds));
}
