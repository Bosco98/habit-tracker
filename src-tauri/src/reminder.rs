//! The daily reminder.
//!
//! Deliberately a wall-clock alarm, not a notification feed: it fires at the
//! time you set, once a day, whether or not anything interesting happened.
//! Nothing here reads your habits — the shell has no access to the decrypted
//! data, and an alarm that lied about what's left would be worse than a plain
//! one.
//!
//! Scheduling lives in Rust rather than a JS `setTimeout` because the window
//! spends most of its life hidden, and hidden webviews get their timers
//! throttled to minutes or stopped outright. A thread here keeps its promise.

use std::sync::Mutex;
use std::time::Duration;

use chrono::{Duration as ChronoDuration, Local, NaiveDate};
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

/// How often the thread wakes to compare the clock against the target.
const TICK: Duration = Duration::from_secs(15);

/// How late a fire may be before it's treated as missed. Covers a laptop that
/// was asleep at the appointed minute without firing 8am's alarm at 9pm.
const GRACE_MINUTES: i64 = 5;

#[derive(Default)]
pub struct Reminder {
    inner: Mutex<Schedule>,
}

#[derive(Default, Clone, Copy)]
struct Schedule {
    at: Option<(u32, u32)>,
    /// Bumped on every change so the thread knows to forget that it already
    /// fired today — otherwise moving the time forward would be swallowed.
    generation: u64,
}

/// Set or clear the daily reminder. `None` disables it.
#[tauri::command]
pub fn set_reminder(app: AppHandle, hour: Option<u32>, minute: Option<u32>) {
    let at = match (hour, minute) {
        (Some(h), Some(m)) if h < 24 && m < 60 => Some((h, m)),
        _ => None,
    };
    let state = app.state::<Reminder>();
    let mut schedule = state.inner.lock().expect("reminder state poisoned");

    // Idempotent on purpose. Bumping the generation tells the thread to forget
    // that it already rang today, and the frontend pushes the same schedule
    // several times per launch — without this guard a fired alarm re-arms
    // itself and rings again every 15s until the grace window closes.
    if schedule.at == at {
        return;
    }

    schedule.at = at;
    schedule.generation = schedule.generation.wrapping_add(1);
    // A silent scheduler is unfalsifiable — "nothing in the log" has to mean
    // something other than "never armed".
    match at {
        Some((h, m)) => eprintln!("reminder armed for {h:02}:{m:02}"),
        None => eprintln!("reminder cleared"),
    }
}

fn notify(app: &AppHandle) {
    let result = app
        .notification()
        .builder()
        .title("Habits")
        .body("Time to check in.")
        .show();
    if let Err(error) = result {
        eprintln!("reminder notification failed: {error}");
    }
}

pub fn spawn(app: AppHandle) {
    std::thread::spawn(move || {
        let mut fired_on: Option<NaiveDate> = None;
        let mut seen_generation = 0_u64;

        loop {
            std::thread::sleep(TICK);

            let schedule = {
                let state = app.state::<Reminder>();
                let guard = state.inner.lock().expect("reminder state poisoned");
                *guard
            };

            if schedule.generation != seen_generation {
                seen_generation = schedule.generation;
                fired_on = None;
            }

            let Some((hour, minute)) = schedule.at else {
                continue;
            };

            let now = Local::now();
            let today = now.date_naive();
            if fired_on == Some(today) {
                continue;
            }
            let Some(target) = today.and_hms_opt(hour, minute, 0) else {
                continue;
            };

            let late = now.naive_local() - target;
            if late < ChronoDuration::zero() {
                continue; // not yet
            }
            if late < ChronoDuration::minutes(GRACE_MINUTES) {
                eprintln!("reminder firing for {today}");
                notify(&app);
            } else {
                eprintln!("reminder missed for {today} (app was not running)");
            }
            // Either fired or missed the window — today is settled either way.
            fired_on = Some(today);
        }
    });
}
