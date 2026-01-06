# Habit Tracker (Google Sheets Sync)

Browser-based habit tracker with local persistence, vice handling, rich analytics, and optional Google Sheets synchronization.

## Features
- Sticky-grid monthly habit log with quick toggles
- Positive habits earn XP; names prefixed with `~` are vices and deduct XP
- Auto-calculated totals for XP, completion rate, and top performer
- Six live dashboards (Chart.js):
  - 📈 Daily XP Trend
  - 📊 Consistency Bars
  - 🎯 Habit Completion Rate
  - 💰 XP Distribution (good habits vs. vices)
  - 📅 Weekly Progress
  - 🔥 Habit Streak Analysis
- Modal-based Google Sheets setup with pull, push, and smart merge actions
- Modal-based Google Sheets setup with pull, push, and smart merge actions
- Cloud sync toggle with input validation (rejects malformed API keys)
- Token reuse (~50 minutes) with automatic refresh before expiry

## Getting Started
1. Clone or download the project.
2. Open `index.html` in a modern browser (Chrome recommended).
3. Habits, logs, and API credentials persist automatically in `localStorage`.

### Supporting Pages
- `about.html`: project story, principles, and roadmap.
- `privacy.html`: data usage and control details.
- `contact.html`: channels for support, ideas, and issue reports.

## Google Sheets Setup
1. In Google Cloud Console:
   - Create a project
   - Enable **Google Sheets API**
   - Create OAuth 2.0 Client ID (Web) and an API key
   - Add the app origin to **Authorized JavaScript origins**
2. Open **Settings ⚙️** in the app and fill:
   - API Key
   - Client ID
   - Spreadsheet ID (from the sheet URL)
3. Click **Connect & Sync**, approve the OAuth prompt, then use:
   - ↓ Pull from Sheets
   - ↑ Push to Sheets
   - ⟳ Smart Merge Sync

> Tip: Maintain separate spreadsheets per month and switch IDs via the settings modal.

## Usage Notes
- Add habits normally (e.g., `Exercise`); add vices with a leading `~` (e.g., `~Smoking`).
- Habit names must be unique (case-insensitive, ignoring the optional `~` prefix); duplicates are blocked with a friendly alert.
- The analytics tiles and charts refresh after every change or sync.
- Removing a habit will also clear its historical logs and the corresponding row in Google Sheets on the next push.
- **Clear All Logs** wipes the current month locally and syncs the blank state if connected.

## Tech Stack
- Tailwind CSS
- Vanilla JS + Chart.js
- Google API Client & Identity Services (OAuth 2.0)
