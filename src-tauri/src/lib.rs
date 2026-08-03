mod habit_timer;
mod reminder;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, Rect, WebviewWindow, WindowEvent,
};
#[cfg(target_os = "macos")]
use tauri_plugin_autostart::MacosLauncher;

const MAIN: &str = "main";
const WIDGET: &str = "widget";

/// Bring the full app forward — the popover's "Open Habits" and the tray menu.
#[tauri::command]
fn open_main(app: AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    if let Some(widget) = app.get_webview_window(WIDGET) {
        let _ = widget.hide();
    }
}

/// The popover and the main window are separate webviews, each running its own
/// Jazz node over the same IndexedDB with no change notification between them —
/// so a check-in in one never reached the other's list. Reloading the peer is
/// the only mechanism available; the frontend waits for IndexedDB to commit
/// and debounces the call.
#[tauri::command]
fn sync_peers(app: AppHandle, from: String) {
    for (label, window) in app.webview_windows() {
        if label != from {
            if let Err(error) = window.reload() {
                eprintln!("failed to reload desktop peer {label}: {error}");
            }
        }
    }
}

/// Anchor the popover to the tray icon, flipping above it when the tray sits
/// at the bottom of the screen (Windows) rather than the top (macOS).
fn place_under_tray(window: &WebviewWindow, icon: Rect) {
    let scale = window.scale_factor().unwrap_or(1.0);
    let icon_pos = icon.position.to_physical::<f64>(scale);
    let icon_size = icon.size.to_physical::<f64>(scale);
    let Ok(win_size) = window.outer_size() else {
        return;
    };

    let gap = 6.0 * scale;
    let mut x = icon_pos.x + icon_size.width / 2.0 - win_size.width as f64 / 2.0;
    let mut y = icon_pos.y + icon_size.height + gap;

    if let Ok(Some(monitor)) = window.current_monitor() {
        let area = monitor.size();
        let origin = monitor.position();
        let left = origin.x as f64 + gap;
        let right = origin.x as f64 + area.width as f64 - win_size.width as f64 - gap;
        x = x.clamp(left, right.max(left));
        // Tray at the bottom of the screen: open upwards instead.
        if y + win_size.height as f64 > origin.y as f64 + area.height as f64 {
            y = icon_pos.y - win_size.height as f64 - gap;
        }
    }

    let _ = window.set_position(PhysicalPosition::new(x, y));
}

fn toggle_widget(app: &AppHandle, icon: Rect) {
    let Some(window) = app.get_webview_window(WIDGET) else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }
    place_under_tray(&window, icon);
    let _ = window.show();
    let _ = window.set_focus();
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open Habits", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    let mut builder = TrayIconBuilder::with_id("habits-tray")
        .tooltip("Habits")
        .menu(&menu)
        // Left click opens the popover; right click still gets the menu.
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => open_main(app.clone()),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                toggle_widget(tray.app_handle(), rect);
            }
        });

    // A dedicated glyph, not the app icon. Template rendering keeps only the
    // alpha channel, and the app icon is an opaque rounded square — every pixel
    // survived and the menubar showed a solid black block. `icons/tray.png` is
    // a check cut out of transparency (see scripts/make-tray-icon.mjs).
    match tauri::image::Image::from_bytes(include_bytes!("../icons/tray.png")) {
        Ok(icon) => builder = builder.icon(icon).icon_as_template(true),
        Err(error) => eprintln!("tray icon failed to decode: {error}"),
    }

    builder.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let autostart = tauri_plugin_autostart::Builder::new();
    #[cfg(target_os = "macos")]
    let autostart = autostart.macos_launcher(MacosLauncher::LaunchAgent);
    let autostart = autostart.args(["--background"]).build();

    tauri::Builder::default()
        // Invite links open in the user's browser rather than hijacking the app window.
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(autostart)
        .manage(habit_timer::HabitTimers::default())
        .manage(reminder::Reminders::default())
        .invoke_handler(tauri::generate_handler![
            open_main,
            sync_peers,
            habit_timer::start_habit_timer,
            habit_timer::cancel_habit_timer,
            reminder::set_habit_reminders
        ])
        .setup(|app| {
            build_tray(app.handle())?;
            reminder::spawn(app.handle().clone());
            // The main window starts hidden to avoid a launch-time flash.
            // Login startup keeps it that way; an ordinary launch reveals it.
            if !std::env::args().any(|arg| arg == "--background") {
                open_main(app.handle().clone());
            }
            Ok(())
        })
        .on_window_event(|window, event| match event {
            // Closing the main window leaves the tray running, the way a
            // menubar app should behave.
            WindowEvent::CloseRequested { api, .. } if window.label() == MAIN => {
                api.prevent_close();
                let _ = window.hide();
            }
            // The popover dismisses itself the moment it loses focus.
            WindowEvent::Focused(false) if window.label() == WIDGET => {
                let _ = window.hide();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running Habits");
}
