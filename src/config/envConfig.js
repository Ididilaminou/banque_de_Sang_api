const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  // Clé utilisée uniquement pour créer le tout premier administrateur.
  cleInstallation: process.env.CLE_INSTALLATION,
  // Paramètres Gmail SMTP utilisés par le service d'envoi des emails.
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUtilisateur: process.env.SMTP_UTILISATEUR,
  smtpMotDePasse: process.env.SMTP_MOT_DE_PASSE,
  adresseExpediteur: process.env.ADRESSE_EXPEDITEUR,
  urlApplication: process.env.URL_APPLICATION || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};

function estValeurPlaceholder(valeur) {
  if (!valeur) return true;

  const valeurNormalisee = valeur.toLowerCase();
  return [
    "change-moi",
    "remplacer",
    "ta-cle",
    "mot-de-passe",
    "ma-cle-secrete",
  ].some((placeholder) => valeurNormalisee.includes(placeholder));
}

function validerConfiguration({ stricte = env.nodeEnv === "production" } = {}) {
  const erreurs = [];

  if (!env.databaseUrl) erreurs.push("DATABASE_URL");
  if (!env.jwtSecret || (stricte && (env.jwtSecret.length < 32 || estValeurPlaceholder(env.jwtSecret)))) {
    erreurs.push("JWT_SECRET");
  }
  if (!env.cleInstallation || (stricte && estValeurPlaceholder(env.cleInstallation))) {
    erreurs.push("CLE_INSTALLATION");
  }

  try {
    if (env.databaseUrl) new URL(env.databaseUrl);
  } catch (_erreur) {
    erreurs.push("DATABASE_URL_FORMAT");
  }

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    erreurs.push("PORT");
  }

  if (stricte) {
    if (!env.smtpUtilisateur || !env.smtpMotDePasse || !env.adresseExpediteur) {
      erreurs.push("SMTP");
    }
    if (!env.openaiApiKey || estValeurPlaceholder(env.openaiApiKey)) {
      erreurs.push("OPENAI_API_KEY");
    }
    try {
      new URL(env.urlApplication);
    } catch (_erreur) {
      erreurs.push("URL_APPLICATION");
    }
  }

  if (erreurs.length > 0) {
    throw new Error(`Configuration invalide : ${erreurs.join(", ")}.`);
  }
}

env.validerConfiguration = validerConfiguration;

module.exports = env;
