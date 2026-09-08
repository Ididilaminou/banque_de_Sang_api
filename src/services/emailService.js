
const nodemailer = require("nodemailer");

// ============================================================
// CONFIGURATION DU TRANSPORTEUR EMAIL
// ============================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ============================================================
// VERIFICATION DE LA CONFIGURATION
// ============================================================

async function verifierConnexionEmail() {
  try {
    await transporter.verify();
    console.log("✅ Service email Aidora connecté avec succès.");
    return true;
  } catch (erreur) {
    console.error(
      "❌ Erreur de connexion au service email :",
      erreur.message
    );
    return false;
  }
}

// ============================================================
// ENVOYER UN EMAIL
// ============================================================

async function envoyerEmail({ destinataire, sujet, html, texte }) {
  if (!destinataire) {
    throw new Error("DESTINATAIRE_EMAIL_MANQUANT");
  }

  const resultat = await transporter.sendMail({
    from: `"Aidora" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: destinataire,
    subject: sujet,
    text: texte,
    html,
  });

  console.log(
    `📧 Email envoyé à ${destinataire} — ${resultat.messageId}`
  );

  return resultat;
}

// ============================================================
// ENVOYER LE CODE D'ACTIVATION
// ============================================================

async function envoyerCodeActivation({
  destinataire,
  prenom,
  codeActivation,
  dateExpiration,
}) {
  if (!destinataire) {
    throw new Error("DESTINATAIRE_EMAIL_MANQUANT");
  }

  if (!codeActivation) {
    throw new Error("CODE_ACTIVATION_MANQUANT");
  }

  const nomUtilisateur = prenom
    ? prenom.trim()
    : "Donneur";

  // ----------------------------------------------------------
  // Date d'expiration lisible
  // ----------------------------------------------------------

  const expiration = dateExpiration
    ? new Date(dateExpiration)
    : new Date(Date.now() + 15 * 60 * 1000);

  const expirationTexte = expiration.toLocaleTimeString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // ----------------------------------------------------------
  // Sujet
  // ----------------------------------------------------------

  const sujet = "Votre code d'activation Aidora";

  // ----------------------------------------------------------
  // URL de la page d'activation
  // ----------------------------------------------------------

  const urlActivation =
    process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/activation`
      : "http://localhost:5173/activation";

  // ==========================================================
  // VERSION TEXTE
  // ==========================================================

  const texte = `
Bonjour ${nomUtilisateur},

Bonne nouvelle !

La banque de sang a vérifié votre demande de rattachement
et a confirmé que vous êtes bien enregistré dans son registre.

Votre compte Aidora peut maintenant être activé.

CODE D'ACTIVATION :
${codeActivation}

Ce code est valable jusqu'à ${expirationTexte}.

Pour activer votre compte :
${urlActivation}

Important :
- Ne partagez jamais ce code avec une autre personne.
- Le code est valable pendant 15 minutes.
- Si le code expire, vous pouvez demander un nouveau code
  depuis la page d'activation.

Merci de faire confiance à Aidora.

Aidora
Plateforme numérique de gestion du don de sang

Cet email a été envoyé automatiquement.
Merci de ne pas répondre directement à ce message.
`;

  // ==========================================================
  // VERSION HTML
  // ==========================================================

  const html = `
<!DOCTYPE html>

<html lang="fr">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Activation de votre compte Aidora</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#334155;
  "
>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color:#f1f5f9;padding:30px 15px;"
  >

    <tr>

      <td align="center">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            width:100%;
            background-color:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(15,23,42,0.08);
          "
        >

          <!-- ================================================= -->
          <!-- EN-TÊTE -->
          <!-- ================================================= -->

          <tr>

            <td
              style="
                background:linear-gradient(
                  135deg,
                  #dc2626,
                  #e11d48
                );
                padding:35px 30px;
                text-align:center;
                color:#ffffff;
              "
            >

              <div
                style="
                  width:64px;
                  height:64px;
                  margin:0 auto 15px;
                  background-color:rgba(255,255,255,0.18);
                  border-radius:18px;
                  line-height:64px;
                  font-size:30px;
                  font-weight:bold;
                "
              >
                ♥
              </div>

              <h1
                style="
                  margin:0;
                  font-size:28px;
                  font-weight:700;
                "
              >
                Aidora
              </h1>

              <p
                style="
                  margin:8px 0 0;
                  font-size:15px;
                  color:#fee2e2;
                "
              >
                Plateforme de gestion du don de sang
              </p>

            </td>

          </tr>

          <!-- ================================================= -->
          <!-- CONTENU -->
          <!-- ================================================= -->

          <tr>

            <td style="padding:40px 35px;">

              <p
                style="
                  margin:0 0 12px;
                  font-size:17px;
                  color:#0f172a;
                "
              >
                Bonjour
                <strong>${nomUtilisateur}</strong>,
              </p>

              <p
                style="
                  margin:0 0 25px;
                  font-size:15px;
                  line-height:1.7;
                  color:#475569;
                "
              >
                Bonne nouvelle ! Votre banque de sang a vérifié
                votre demande de rattachement et a confirmé
                votre présence dans son registre.
              </p>

              <!-- ================================================= -->
              <!-- MESSAGE DE VALIDATION -->
              <!-- ================================================= -->

              <div
                style="
                  background-color:#f0fdf4;
                  border:1px solid #bbf7d0;
                  border-radius:14px;
                  padding:18px;
                  margin-bottom:28px;
                "
              >

                <div
                  style="
                    font-size:14px;
                    font-weight:bold;
                    color:#15803d;
                    margin-bottom:5px;
                  "
                >
                  ✓ Demande vérifiée
                </div>

                <div
                  style="
                    font-size:13px;
                    line-height:1.6;
                    color:#166534;
                  "
                >
                  Votre compte peut maintenant être activé.
                </div>

              </div>

              <!-- ================================================= -->
              <!-- CODE -->
              <!-- ================================================= -->

              <div
                style="
                  background-color:#f8fafc;
                  border:2px dashed #fecaca;
                  border-radius:16px;
                  padding:25px 20px;
                  text-align:center;
                  margin-bottom:25px;
                "
              >

                <p
                  style="
                    margin:0 0 10px;
                    font-size:12px;
                    font-weight:bold;
                    letter-spacing:1.5px;
                    color:#64748b;
                    text-transform:uppercase;
                  "
                >
                  Votre code d'activation
                </p>

                <div
                  style="
                    font-size:30px;
                    font-weight:700;
                    letter-spacing:5px;
                    color:#dc2626;
                    margin:8px 0;
                  "
                >
                  ${codeActivation}
                </div>

                <p
                  style="
                    margin:10px 0 0;
                    font-size:13px;
                    color:#64748b;
                  "
                >
                  Valable jusqu'à
                  <strong>${expirationTexte}</strong>
                </p>

              </div>

              <!-- ================================================= -->
              <!-- BOUTON -->
              <!-- ================================================= -->

              <div style="text-align:center;margin:30px 0;">

                <a
                  href="${urlActivation}"
                  style="
                    display:inline-block;
                    background-color:#dc2626;
                    color:#ffffff;
                    text-decoration:none;
                    font-size:15px;
                    font-weight:bold;
                    padding:14px 28px;
                    border-radius:10px;
                  "
                >
                  Activer mon compte
                </a>

              </div>

              <!-- ================================================= -->
              <!-- INFORMATIONS -->
              <!-- ================================================= -->

              <div
                style="
                  background-color:#fff7ed;
                  border:1px solid #fed7aa;
                  border-radius:12px;
                  padding:18px;
                  margin-top:25px;
                "
              >

                <p
                  style="
                    margin:0 0 8px;
                    font-size:14px;
                    font-weight:bold;
                    color:#c2410c;
                  "
                >
                  🔒 Important
                </p>

                <p
                  style="
                    margin:0;
                    font-size:13px;
                    line-height:1.7;
                    color:#9a3412;
                  "
                >
                  Ne partagez jamais ce code avec une autre
                  personne. Pour votre sécurité, ce code expire
                  après 15 minutes.
                </p>

              </div>

              <p
                style="
                  margin:28px 0 0;
                  font-size:14px;
                  line-height:1.7;
                  color:#64748b;
                "
              >
                Si le code arrive à expiration, vous pouvez
                demander un nouveau code depuis la page
                d'activation.
              </p>

            </td>

          </tr>

          <!-- ================================================= -->
          <!-- PIED DE PAGE -->
          <!-- ================================================= -->

          <tr>

            <td
              style="
                background-color:#f8fafc;
                border-top:1px solid #e2e8f0;
                padding:25px 30px;
                text-align:center;
              "
            >

              <p
                style="
                  margin:0 0 8px;
                  font-size:14px;
                  font-weight:bold;
                  color:#334155;
                "
              >
                Aidora
              </p>

              <p
                style="
                  margin:0 0 10px;
                  font-size:12px;
                  color:#94a3b8;
                  line-height:1.6;
                "
              >
                Plateforme numérique de gestion du don de sang
              </p>

              <p
                style="
                  margin:0;
                  font-size:11px;
                  color:#cbd5e1;
                "
              >
                Cet email a été envoyé automatiquement.
                Merci de ne pas répondre directement à ce message.
              </p>

            </td>

          </tr>

        </table>

      </td>

    </tr>

  </table>

</body>

</html>
`;

  // ==========================================================
  // ENVOI
  // ==========================================================

  return envoyerEmail({
    destinataire,
    sujet,
    html,
    texte,
  });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  envoyerEmail,
  envoyerCodeActivation,
  verifierConnexionEmail,
};

