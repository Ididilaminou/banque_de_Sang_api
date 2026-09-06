const express = require("express");
const cors = require("cors");
const routeurAuthentificationPublique = require("./routes/public/authentificationRoutePublique");
const routeurAuthentificationPrivee = require("./routes/privees/authentificationRoutePrivee");
const routeurUtilisateursPrivees = require("./routes/privees/utilisateursRoutePrivee");
const routeurDonneursPrivees = require("./routes/privees/donneursRoutePrivee");

// Création de l'application Express
const app = express();

// Autorise les requêtes provenant d'autres domaines (Frontend, mobile, etc.)
app.use(cors());

// Permet de lire les données JSON envoyées dans le corps des requêtes
app.use(express.json());

// Page d'accueil de l'API : renvoie un message de bienvenue
const acceuil = (_req, res) => {
  res.json({
    ok: true,
    message: "Bienvenu dans le serveur de bang-sang",
  });
};

// Vérification que l'API est bien en ligne et répond correctement
const healthCheck = (_req, res) => {
  res.json({
    ok: true,
    message: "API banque-sang opérationnelle",
  });
};

// Middleware appelé quand aucune route ne correspond à la requête
const routeIntrouvable = (req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route introuvable : ${req.method} ${req.path}`,
  });
};

// Route racine : http://localhost:PORT/
app.get("/", acceuil);

// Route de santé : http://localhost:PORT/health
app.get("/health", healthCheck);

// Préfixe des routes d'authentification
app.use("/authentification", routeurAuthentificationPublique);
app.use("/authentification", routeurAuthentificationPrivee);

// Préfixe des routes utilisateurs
app.use("/utilisateurs", routeurUtilisateursPrivees);
app.use("/donneurs", routeurDonneursPrivees);

// À placer en dernier pour intercepter les routes manquantes
app.use(routeIntrouvable);

// Export de l'application pour qu'elle soit utilisée par le serveur
module.exports = app;
