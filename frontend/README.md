# AgriSense — React Frontend

A polished React + Vite + Tailwind CSS frontend for the AgriSense smart agricultural advisor platform.

## Setup

```bash
# Install dependencies
npm install

# Start the development server (runs on http://localhost:5173)
npm run dev
```

> **Note:** The FastAPI backend must be running at `http://localhost:8000` for login and onboarding to work.
> Start it with: `uvicorn api.main:app --reload --port 8000` (from the AgriSense root folder)

## Available Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Login** | `/` (default) | Sign in with phone + password |
| **Onboarding** | Accessible via Login page | Register a new farmer account |
| **Dashboard** | After login | Home screen with crop card, nav bar, and quick actions |

## Tech Stack

- **React 19** — UI rendering
- **Vite 8** — lightning-fast dev server & bundler
- **Tailwind CSS** (`@tailwindcss/vite`) — utility-first styling
- **Unsplash** — hero background and crop photography

## Color Palette

| Role       | Color     | Hex       |
|------------|-----------|-----------|
| Primary    | Olive Green | `#4A5D23` |
| Accent     | Warm Gold   | `#D4A574` |
| Background | Cream       | `#FAF6F0` |
