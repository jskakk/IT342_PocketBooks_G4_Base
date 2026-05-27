# PocketBooks — Expense Tracker (IT342 Group Project)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-local-brightgreen.svg)](#)

A lightweight full-stack expense tracker used for the IT342 course project. PocketBooks helps users record expenses, manage wallets and categories, and provides admin views for inspecting and moderating data.

Key tech:

- Backend: Spring Boot (Java 17), Spring Data JPA
- Frontend: React + Vite
- Mobile: Android (Gradle/Kotlin)
- Dev server: Node.js (frontend) + Maven (backend)

## Features

- Add, edit, and delete expenses
- Wallet and category management
- Admin dashboard with user & expense moderation
- Analytics view with category summaries and totals

## Quick Start (Development)

1. Backend (API)

```powershell
cd backend
.\mvnw spring-boot:run
```

Runs the backend on http://localhost:8080 by default.

2. Frontend (Web)

```bash
cd frontend
npm install
npm run dev
```

Open the app at the URL printed by Vite (usually http://localhost:5173).

3. Mobile (Android)

Open the `mobile` folder in Android Studio and run on an emulator or device.

## Configuration

- API base for the frontend is configured via `VITE_API_BASE_URL` in the `frontend` environment.
- Backend DB settings live in `backend/src/main/resources/application.properties`.

## Admin Pages

Admin pages live under the web app's admin route and communicate with these endpoints:

- `/api/admin/expenses` — admin expense listing and moderation
- `/api/admin/users` — view and change user roles

## Contributing

If you'd like changes or improvements (e.g., CI badges, screenshots, or a demo GIF), tell me which style you prefer and I can update the README and commit the changes.

## Files

- Backend: [backend](backend)
- Frontend: [frontend](frontend)
- Mobile: [mobile](mobile)

