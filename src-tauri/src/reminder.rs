//! Per-habit daily reminders.
//!
//! Preferences live in each person's encrypted Jazz account. The frontend
//! sends this process only the enabled schedule and display names, so Circle
//! habits remain shared while their alarm times remain private.
//!
//! Scheduling lives in Rust rather than a JS `setTimeout`: hidden webviews can
//! have their timers throttled or suspended, while the tray process stays up.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use chrono::{Duration as ChronoDuration, Local, NaiveDate};
use serde::Deserialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

/// How often the thread wakes to compare the clock against the targets.
const TICK: Duration = Duration::from_secs(15);

/// How late a fire may be before it's treated as missed. Covers a laptop that
/// was asleep at the appointed minute without firing 8am's alarm at 9pm.
const GRACE_MINUTES: i64 = 5;

#[derive(Default)]
pub struct Reminders {
    inner: Mutex<Vec<Schedule>>,
}

#[derive(Clone, PartialEq, Eq)]
struct Schedule {
    id: String,
    habit_name: String,
    hour: u32,
    minute: u32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitReminderInput {
    id: String,
    habit_name: String,
    hour: u32,
    minute: u32,
}

/// Replace the complete reminder schedule for the signed-in account.
#[tauri::command]
pub fn set_habit_reminders(app: AppHandle, reminders: Vec<HabitReminderInput>) {
    let mut next = reminders
        .into_iter()
        .filter(|reminder| {
            reminder.hour < 24
                && reminder.minute < 60
                && !reminder.id.trim().is_empty()
                && !reminder.habit_name.trim().is_empty()
        })
        .map(|reminder| Schedule {
            id: reminder.id,
            habit_name: reminder.habit_name,
            hour: reminder.hour,
            minute: reminder.minute,
        })
        .collect::<Vec<_>>();
    next.sort_by(|a, b| a.id.cmp(&b.id));
    next.dedup_by(|a, b| a.id == b.id);

    let state = app.state::<Reminders>();
    let mut current = state.inner.lock().expect("reminder state poisoned");
    if *current == next {
        return;
    }
    *current = next;
    eprintln!("{} habit reminder(s) armed", current.len());
}

fn notify(app: &AppHandle, habit_name: &str) {
    let result = app
        .notification()
        .builder()
        .title("Habits")
        .body(format!("Time for {habit_name}."))
        .show();
    if let Err(error) = result {
        eprintln!("reminder notification failed: {error}");
    }
}

pub fn spawn(app: AppHandle) {
    std::thread::spawn(move || {
        // The time is part of the receipt: editing a reminder to a later time
        // on the same day should allow the new alarm to fire once.
        let mut settled: HashMap<String, (NaiveDate, u32, u32)> = HashMap::new();

        loop {
            std::thread::sleep(TICK);

            let schedules = {
                let state = app.state::<Reminders>();
                let guard = state.inner.lock().expect("reminder state poisoned");
                guard.clone()
            };
            settled.retain(|id, _| schedules.iter().any(|schedule| &schedule.id == id));

            for schedule in schedules {
                let now = Local::now();
                let today = now.date_naive();
                let receipt = (today, schedule.hour, schedule.minute);
                if settled.get(&schedule.id) == Some(&receipt) {
                    continue;
                }
                let Some(target) = today.and_hms_opt(schedule.hour, schedule.minute, 0) else {
                    continue;
                };

                let late = now.naive_local() - target;
                if late < ChronoDuration::zero() {
                    continue;
                }
                if late < ChronoDuration::minutes(GRACE_MINUTES) {
                    eprintln!("reminder firing for {} on {today}", schedule.id);
                    notify(&app, &schedule.habit_name);
                } else {
                    eprintln!("reminder missed for {} on {today}", schedule.id);
                }
                // Either fired or missed the window — today is settled.
                settled.insert(schedule.id, receipt);
            }
        }
    });
}
