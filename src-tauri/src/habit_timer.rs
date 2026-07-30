//! Hard-stop countdowns for timer habits.
//!
//! The webview owns the visible clock and the encrypted check-in. The shell
//! owns the deadline so a hidden tray popover cannot delay the completion
//! notification when browser timers are throttled.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

#[derive(Default)]
pub struct HabitTimers {
    generations: Mutex<HashMap<String, u64>>,
}

#[tauri::command]
pub fn start_habit_timer(
    app: AppHandle,
    timer_id: String,
    seconds: u64,
    label: String,
) {
    if seconds == 0 {
        return;
    }

    let generation = {
        let state = app.state::<HabitTimers>();
        let mut generations = state
            .generations
            .lock()
            .expect("habit timer state poisoned");
        let generation = generations.entry(timer_id.clone()).or_default();
        *generation = generation.wrapping_add(1);
        *generation
    };

    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(seconds));

        let should_notify = {
            let state = app.state::<HabitTimers>();
            let mut generations = state
                .generations
                .lock()
                .expect("habit timer state poisoned");
            let current = generations.entry(timer_id).or_default();
            if *current != generation {
                false
            } else {
                // Settle this generation before showing anything. Even if the
                // notification API is retried elsewhere, this deadline is done.
                *current = current.wrapping_add(1);
                true
            }
        };

        if !should_notify {
            return;
        }

        let result = app
            .notification()
            .builder()
            .title("Timer complete")
            .body(format!("{label} reached its goal."))
            .sound("default")
            .show();
        if let Err(error) = result {
            eprintln!("timer notification failed: {error}");
        }
    });
}

#[tauri::command]
pub fn cancel_habit_timer(app: AppHandle, timer_id: String) {
    let state = app.state::<HabitTimers>();
    let mut generations = state
        .generations
        .lock()
        .expect("habit timer state poisoned");
    let generation = generations.entry(timer_id).or_default();
    *generation = generation.wrapping_add(1);
}
