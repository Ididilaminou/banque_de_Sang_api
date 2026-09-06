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
  nodeEnv: process.env.NODE_ENV || "development",
};

module.exports = env;
