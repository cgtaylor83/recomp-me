# Recomp Me — Google Sheets Setup Guide

## What you're building
A Google Sheet that stores all your meals, workouts, check-ins, and goals.
The app reads and writes to it in real time from any device.

---

## Step 1 — Create the Google Sheet

1. Go to **sheets.google.com**
2. Click **+ Blank** to create a new sheet
3. Name it **Recomp Me** (click "Untitled spreadsheet" at the top)
4. Leave it open — you'll need the URL in Step 3

---

## Step 2 — Open Apps Script

1. In your Google Sheet, click **Extensions** in the top menu
2. Click **Apps Script**
3. A new tab opens with a code editor
4. Delete everything in the editor (Ctrl+A, Delete)
5. Copy the entire contents of **Code.gs** (included in this ZIP)
6. Paste it into the editor
7. Click the **Save** button (floppy disk icon) or Ctrl+S
8. Name the project **Recomp Me** when prompted

---

## Step 3 — Deploy as Web App

1. Click **Deploy** button (top right)
2. Click **New deployment**
3. Click the gear ⚙ next to "Select type" → choose **Web app**
4. Fill in the settings:
   - Description: `Recomp Me v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**
6. Click **Authorize access** → choose your Google account → click **Allow**
7. You'll see a **Web app URL** — it looks like:
   `https://script.google.com/macros/s/XXXXXXXXXX/exec`
8. **Copy this URL** — you need it in the next step

---

## Step 4 — Add the URL to Recomp Me

1. Open your Recomp Me app
2. Tap **Goals** tab
3. Scroll down to **Google Sheets Sync**
4. Paste your Web app URL
5. Tap **Connect**
6. The app will sync all your existing data to the sheet immediately

---

## Step 5 — Verify it's working

1. Go back to your Google Sheet
2. You should see new tabs: Meals, Workouts, Checkins, Goals, Chat
3. Every time you log a meal or workout in the app, it appears in the sheet within seconds

---

## Troubleshooting

**"Authorization required" error:**
Go back to Apps Script → Deploy → Manage deployments → Edit → re-authorize

**Data not syncing:**
Make sure you chose "Anyone" for access (not "Anyone with Google account")

**Wrong URL:**
The URL must start with `https://script.google.com/macros/s/` — not the sheet URL

---

## Your data in Google Sheets

| Tab | What's stored |
|-----|--------------|
| Meals | Every meal logged with date, macros, time |
| Workouts | Every workout with type, calories, duration |
| Checkins | Weight and body fat check-ins |
| Goals | Your daily macro targets and body stats |
| Chat | Last 60 coach messages |

Photos are stored locally on your device only (not in Sheets).
