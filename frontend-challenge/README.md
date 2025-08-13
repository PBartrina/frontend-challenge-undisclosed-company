# Documents app – solution overview

This project implements a vanilla JS web app that displays account documents in list or grid view, receives real-time notifications for newly created documents, allows creating new documents on the client, and supports sorting and relative dates, following the constraints of the original challenge.

### Tech and constraints
- No frameworks: plain HTML/CSS/JS modules.
- Real-time via native `WebSocket`.
- Data over HTTP `GET /documents` and `ws://.../notifications` from the provided Go server.
- New document creation is client-only (in-memory), as specified.

### Key features implemented
- List and grid views with a toggle; list has column headers.
- Per-line rendering of contributors and attachments.
- Real-time toast + bell counter when a new doc is created elsewhere; upon each notification the list refreshes and unions new server docs with local ones (non-destructive).
- Sorting by name, version (semver aware) and creation date.
- Relative creation dates (e.g., “1 day ago”).

### Project structure
```
frontend-challenge/
  app/           # frontend (HTML/CSS/JS modules)
  server/        # Go server exposing /documents and /notifications
  test/          # Node tests (utils + rendering)
  assets/        # challenge screenshots
  CHALLENGE.md   # original brief preserved
```

### Run the app
1) Start the server (requires Go):
```pwsh
cd server
go run server.go
```

2) Serve the frontend (any static server):
```pwsh
cd app
npx --yes http-server -p 3001 -a localhost -c-1
```
Open `http://localhost:3001` in the browser. The app expects the server at `http://localhost:8080` (default). If you change the server port, update the fetch/WebSocket URLs accordingly.

### Create a document
Use the “+ Add document” button. The new document is inserted into memory and shown immediately, and will remain on refresh during the session.

### Sorting
Use the “Sort by” selector to sort by name, semver version, or creation date.

### Tests
Run with Node’s built-in test runner:
```pwsh
cd frontend-challenge
npm test
```
What’s covered:
- `utils`: `compareSemver`, `formatVersion`, `formatRelativeDate`, and `uuid`.
- UI: verifies list view headers/rows rendering and that grid cards render contributors/attachments per-line.

Tests are isolated and fast. WebSockets are disabled under test to avoid flakiness.

### Reasoning and trade-offs
- Kept architecture small and modular: `services` (I/O), `renderers` (pure DOM), `main` (state + orchestration), `utils` (pure helpers). This enables testing without a framework.
- On notification we do not inject fake items; we refresh and merge server data to ensure full information while preserving locally created docs.
- Minimal CSS aims to match the mockups closely while remaining readable.

### Original brief
The original challenge instructions have been moved to `CHALLENGE.md` to keep this README focused on the solution.
