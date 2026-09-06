const express = require("express");
const cors = require("cors");
const routeurAuthentificationPublique = require("./routes/acteurs/commun/authentificationRoutePublique");
const routeurAuthentificationPrivee = require("./routes/acteurs/commun/authentificationRoutePrivee");
const routeurUtilisateursPrivees = require("./routes/acteurs/commun/utilisateursRoutePrivee");
const routeurDonneursPrivees = require("./routes/acteurs/donneur/donneursRoutePrivee");
const routeurEtablissementsPrivees = require("./routes/acteurs/administrateur/etablissementsRoutePrivee");
const routeurEtablissementsPublique = require("./routes/acteurs/administrateur/etablissementsRoutePublique");
const routeurActivationDonneurPrivee = require("./routes/acteurs/banque/activationDonneurRoutePrivee");
const routeurPersonnelPrivee = require("./routes/acteurs/administrateur/personnelRoutePrivee");
const routeurDonsPrivee = require("./routes/acteurs/banque/donsRoutePrivee");
const routeurStocksPrivee = require("./routes/acteurs/banque/stocksRoutePrivee");
const routeurDemandesSangPrivee = require("./routes/acteurs/hopital/demandesSangRoutePrivee");
const routeurNotificationsPrivee = require("./routes/acteurs/commun/notificationsRoutePrivee");
const routeurEligibilitePrivee = require("./routes/acteurs/donneur/eligibiliteRoutePrivee");
const routeurInstallationPublique = require("./routes/acteurs/administrateur/installationRoutePublique");
const routeurAuditPrivee = require("./routes/acteurs/administrateur/auditRoutePrivee");
const routeurStatistiquesPrivee = require("./routes/acteurs/administrateur/statistiquesRoutePrivee");

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

// Transforme les erreurs en réponses JSON cohérentes pour Postman et le frontend.
// En production, le détail technique n'est jamais exposé au client.
const gestionnaireErreurs = (erreur, _req, res, _next) => {
  console.error(erreur);

  if (erreur instanceof SyntaxError && erreur.status === 400 && erreur.body) {
    return res.status(400).json({
      ok: false,
      message: "Le corps JSON de la requête est invalide.",
    });
  }

  return res.status(500).json({
    ok: false,
    message: "Une erreur interne est survenue.",
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
app.use("/etablissements", routeurEtablissementsPublique);
app.use("/etablissements", routeurEtablissementsPrivees);
app.use("/donneurs", routeurActivationDonneurPrivee);
app.use("/administrateurs/personnel", routeurPersonnelPrivee);
app.use("/dons", routeurDonsPrivee);
app.use("/stocks", routeurStocksPrivee);
app.use("/demandes-sang", routeurDemandesSangPrivee);
app.use("/notifications", routeurNotificationsPrivee);
app.use("/eligibilite", routeurEligibilitePrivee);
app.use("/installation/administrateur", routeurInstallationPublique);
app.use("/audit", routeurAuditPrivee);
app.use("/statistiques", routeurStatistiquesPrivee);

// À placer en dernier pour intercepter les routes manquantes
app.use(routeIntrouvable);

// Doit rester après toutes les routes pour intercepter leurs erreurs.
app.use(gestionnaireErreurs);

// Export de l'application pour qu'elle soit utilisée par le serveur
module.exports = app;
