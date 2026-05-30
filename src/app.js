const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || "./database/database.db";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data_limite TEXT,
      concluida INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.get("/", (req, res) => {
  db.all(
    "SELECT * FROM tarefas ORDER BY concluida ASC, data_limite ASC",
    [],
    (err, tarefas) => {
      if (err) {
        return res.status(500).send(err.message);
      }

      const total = tarefas.length;
      const concluidas = tarefas.filter(t => t.concluida === 1).length;
      const pendentes = total - concluidas;

      res.render("index", {
        tarefas,
        total,
        concluidas,
        pendentes
      });
    }
  );
});

app.post("/tarefas", (req, res) => {
  const { titulo, data_limite } = req.body;

  db.run(
    "INSERT INTO tarefas (titulo, data_limite) VALUES (?, ?)",
    [titulo, data_limite],
    () => res.redirect("/")
  );
});

app.post("/tarefas/:id/concluir", (req, res) => {
  db.run(
    "UPDATE tarefas SET concluida = 1 WHERE id = ?",
    [req.params.id],
    () => res.redirect("/")
  );
});

app.post("/tarefas/:id/reabrir", (req, res) => {
  db.run(
    "UPDATE tarefas SET concluida = 0 WHERE id = ?",
    [req.params.id],
    () => res.redirect("/")
  );
});

app.post("/tarefas/:id/excluir", (req, res) => {
  db.run(
    "DELETE FROM tarefas WHERE id = ?",
    [req.params.id],
    () => res.redirect("/")
  );
});

app.listen(PORT, () => {
  console.log(`TaskFlow rodando na porta ${PORT}`);
});
