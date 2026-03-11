# Sprint Casino

A real-time planning poker app for agile teams. No account required — just create a session, share the link, and start estimating stories together.

**Live app:** [matiaspalomeque.github.io/sprint-casino](https://matiaspalomeque.github.io/sprint-casino/)

## Features

- **Create or join sessions** via a 6-character shareable code or direct URL
- **Vote on user stories** using configurable card decks (Fibonacci, T-shirt sizes, etc.)
- **Reveal votes simultaneously** to avoid anchoring bias
- **See results** with average, consensus indicator, and per-participant breakdown
- **Manage story list** — add, reorder, and track estimation progress across stories
- **No backend** — peer-to-peer via WebRTC (PeerJS); the host's browser is the source of truth
- **English / Spanish (Argentina)** UI support

## Tech Stack

- Angular 21
- PeerJS (WebRTC)
- Tailwind CSS v4
- Deployed to GitHub Pages

## Local Development

```bash
npm install
ng serve
```

Open `http://localhost:4200/`.

