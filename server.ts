import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Setup SQLite Database
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new Database(path.join(dbDir, "database.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    host_name TEXT NOT NULL,
    game_name TEXT NOT NULL,
    player_count_preference TEXT NOT NULL,
    dates_available TEXT NOT NULL,
    game_source TEXT NOT NULL DEFAULT '自己帶game',
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 99,
    host_whatsapp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    dates_available TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

// Add game_source column to existing databases
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN game_source TEXT NOT NULL DEFAULT '自己帶game'`);
} catch (e) {
  // Column likely already exists
}

try {
  db.exec(`ALTER TABLE sessions ADD COLUMN min_players INTEGER NOT NULL DEFAULT 2`);
} catch (e) {
  // Column likely already exists
}

try {
  db.exec(`ALTER TABLE sessions ADD COLUMN max_players INTEGER NOT NULL DEFAULT 99`);
} catch (e) {
  // Column likely already exists
}

try {
  db.exec(`ALTER TABLE sessions ADD COLUMN host_whatsapp TEXT`);
} catch (e) {
  // Column likely already exists
}

// API Routes
app.post("/api/sessions", (req, res) => {
  const { host_name, host_whatsapp, game_name, player_count_preference, dates_available, game_source, min_players, max_players } = req.body;
  if (!host_name || !game_name || !player_count_preference || !dates_available || !Array.isArray(dates_available)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO sessions (id, host_name, host_whatsapp, game_name, player_count_preference, dates_available, game_source, min_players, max_players)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, host_name, host_whatsapp || null, game_name, player_count_preference, JSON.stringify(dates_available), game_source || '自己帶game', min_players || 2, max_players || 99);
  res.json({ id });
});

app.get("/api/sessions", (req, res) => {
  const stmt = db.prepare("SELECT * FROM sessions ORDER BY created_at DESC");
  const sessions = stmt.all();
  
  const responsesStmt = db.prepare("SELECT session_id, dates_available FROM responses");
  const allResponses = responsesStmt.all();

  const formattedSessions = sessions.map((s: any) => {
    const dates_available = JSON.parse(s.dates_available);
    const sessionResponses = allResponses
      .filter((r: any) => r.session_id === s.id)
      .map((r: any) => ({
        dates_available: JSON.parse(r.dates_available)
      }));
    
    const availabilityCounts = dates_available.reduce((acc: any, date: string) => {
      acc[date] = sessionResponses.filter((r: any) => r.dates_available.includes(date)).length;
      return acc;
    }, {} as Record<string, number>);
    
    let maxAvailability = 0;
    let bestDate = dates_available[0];

    for (const date of dates_available) {
      const count = availabilityCounts[date] + 1; // +1 for host
      if (count > maxAvailability) {
        maxAvailability = count;
        bestDate = date;
      }
    }
    
    return {
      ...s,
      dates_available,
      max_available_count: maxAvailability,
      best_date: bestDate
    };
  });

  res.json(formattedSessions);
});

app.delete("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM responses WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  const sessionStmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
  const session = sessionStmt.get(id) as any;
  
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const responsesStmt = db.prepare("SELECT * FROM responses WHERE session_id = ? ORDER BY created_at ASC");
  const responses = responsesStmt.all(id).map((r: any) => ({
    ...r,
    dates_available: JSON.parse(r.dates_available)
  }));

  res.json({
    ...session,
    dates_available: JSON.parse(session.dates_available),
    responses
  });
});

app.post("/api/sessions/:id/responses", (req, res) => {
  const { id: session_id } = req.params;
  const { player_name, dates_available } = req.body;

  if (!player_name || !dates_available || !Array.isArray(dates_available)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO responses (id, session_id, player_name, dates_available)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, session_id, player_name, JSON.stringify(dates_available));
  res.json({ id });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
