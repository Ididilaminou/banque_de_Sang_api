const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "API banque-sang opérationnelle",
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route introuvable : ${req.method} ${req.path}`,
  });
});

module.exports = app;
