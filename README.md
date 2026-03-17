# Link Dashboard

Personal new-tab link dashboard.

## Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (`better-sqlite3`) — stored in `data.db`
- **Frontend**: React + Vite

## Setup

```bash
npm install
```

## Development (hot reload)

```bash
npm run dev
```

Frontend: http://localhost:5173
API: http://localhost:3000

## Production

```bash
npm run build   # builds client into client/dist
npm start       # serves everything on http://localhost:3000
```

Set `http://localhost:3000` as your browser's new tab URL.
