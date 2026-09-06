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
};

module.exports = env;
