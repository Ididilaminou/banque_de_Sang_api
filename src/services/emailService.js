const nodemailer = require("nodemailer");

const env = require("../config/envConfig");

// Envoie un email avec le lien de première connexion du personnel.
async function envoyerAccesPersonnel({ courriel, prenom, motDePasseTemporaire }) {
  if (
    !env.smtpUtilisateur ||
    !env.smtpMotDePasse ||
    !env.adresseExpediteur
  ) {
    throw new Error(
      "La configuration Gmail SMTP est incomplète. Remplissez les variables SMTP.",
    );
  }

  // Le transport décrit la connexion entre notre API et Gmail.
  const transporteur = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUtilisateur,
      pass: env.smtpMotDePasse,
    },
  });

  const lienConnexion = `${env.urlApplication}/authentification/connexion`;

  await transporteur.sendMail({
    from: env.adresseExpediteur,
    to: courriel,
    subject: "Accès à la plateforme Banque de sang",
    text: [
      `Bonjour ${prenom},`,
      "",
      "Un compte personnel vient d'être créé pour vous.",
      `Lien de connexion : ${lienConnexion}`,
      `Courriel : ${courriel}`,
      `Mot de passe temporaire : ${motDePasseTemporaire}`,
      "",
      "Vous devrez modifier ce mot de passe après votre première connexion.",
    ].join("\n"),
  });
}

module.exports = { envoyerAccesPersonnel };
