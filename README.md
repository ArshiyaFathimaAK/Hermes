# 🌍 Hermes

> **Developers and AI agents: start with [AGENTS.md](AGENTS.md).** It explains how the app, the
> server and Supabase fit together.

## How to run Hermes

The app runs on its own with built-in sample data. **Steps 1–3 are all you need to use it.**
The server (step 5) is optional.

### 1. Install Node.js

Install the **LTS** version of **Node.js** from https://nodejs.org (version 22, 24 or 26).
Check it with:

```bash
node --version
```

### 2. Get the code and install

```bash
git clone https://github.com/ArshiyaFathimaAK/Hermes.git
cd Hermes/hermes
npm install
```

`npm install` takes a few minutes the first time. Warnings about "install scripts" are expected.

### 3. Start the app

From the `Hermes/hermes` folder:

```bash
npx expo start
```

When the QR code appears, choose one:

- **In a web browser (easiest):** press `w`. The app opens at http://localhost:8081. Narrow the
  window or use the browser's phone view; it's laid out for phones.
- **On a phone:** install **Expo Go** from the App Store or Google Play, connect the phone to the
  same Wi-Fi as the computer, then scan the QR code (iPhone: with the Camera app; Android: from
  inside Expo Go). If the phone can't connect, stop with `Ctrl+C` and run
  `npx expo start --tunnel` instead.

Leave the terminal open while you use the app. Press `Ctrl+C` to stop.

### 4. Try it

- **Search:** type "Lis" on Explore and open Lisbon. Things to do, filters, places to stay and the
  date picker all work. Kyoto has sample data too.
- **Trips need an account.** Open the **Account** tab, tap **Sign in or create an account**, then
  **Skip with a demo account**. This signs in a sample traveler with a Lisbon trip.
- **Trips tab:** the plan by day. Tap an item to schedule or reorder it, tap the date chip to change
  dates, and use the share button to see a shared, read-only view.
- **Account:** switch between light and dark mode, and °F and °C.

All data is sample data, kept in memory, so restarting the app resets it.

### 5. Optional: the server

The Python server provides live place data to the app as each use case is built. Today it serves the
same sample data. To run it, install **Python 3.11 or newer**, then from the `Hermes/server` folder:

With [uv](https://docs.astral.sh/uv/getting-started/installation/):

```bash
uv sync
uv run uvicorn hermes_api.main:app --reload --port 8000
```

Without uv, on macOS or Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e . --group dev
uvicorn hermes_api.main:app --reload --port 8000
```

Without uv, on Windows (PowerShell):

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e . --group dev
uvicorn hermes_api.main:app --reload --port 8000
```

Then open http://localhost:8000/docs to see and try every endpoint.

### 6. Optional: run the tests

```bash
cd hermes && npm test
```

```bash
cd server && uv run pytest
```

(Without uv, run `pytest` with the virtual environment active.)

### If something goes wrong

| Problem | Fix |
| --- | --- |
| `npx expo start` says a port is in use | Another copy is running. Close it, or answer **Yes** to use another port. |
| The browser shows an error or a blank page | Stop with `Ctrl+C`, run `npx expo start --clear`, press `w` again. |
| Expo Go says the project needs a different SDK | Update Expo Go from the app store, or use the web browser instead. |
| The phone can't reach the computer | Use `npx expo start --tunnel`, or the web browser. |
| `npm install` fails | Check `node --version` shows 22, 24 or 26 (the LTS versions), then try again. |
| `pip install ... --group dev` is not recognized | Upgrade pip first: `python -m pip install --upgrade pip`. |

Your all in one website for travel!

The app that makes traveling easier, and takes the planning off your shoulders!

Your travel calendar simplified.

**Hermes** is a travel platform concept designed to simplify trip planning, accommodation booking, and exploring local landmarks. 

> ⚠️ **Note:** This project is currently in early development. All features, architecture, and tech choices listed below are subject to change as the platform evolves. A full demo is projected for **December 2026**.

---

## 🔮 Planned & Concept Features

- 🏨 **Stays & Accommodations:** Easy browsing and booking options for local stays.
- 📍 **Landmark & Attraction Discovery:** Tools to explore top sights, hidden gems, and nearby points of interest.
- 🗺️ **Interactive Travel Tools:** Dynamic views to help travelers navigate destinations effortlessly.
- 💭 **Built in Planner:** Calendars, weather reports, and more to ensure a smooth trip.
