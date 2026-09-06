const express = require("express");
const cors = require("cors");
const routeurAuthentification = require("./routes/authentification");
const routeurUtilisateurs = require("./routes/utilisateurs");

const app = express();

app.use(cors());
app.use(express.json());

const healthCheck = (req, res) => {
  res.json({
    ok: true,
    message: "API banque-sang opérationnelle",
  });
};

app.get("/health", healthCheck);

app.use("/authentification", routeurAuthentification);
app.use("/utilisateurs", routeurUtilisateurs);

const routeIntrouvable = (req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route introuvable : ${req.method} ${req.path}`,
  });
};

app.use(routeIntrouvable);

module.exports = app;
