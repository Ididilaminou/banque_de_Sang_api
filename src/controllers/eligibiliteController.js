const donneur = require("../models/donneurModel");
const eligibilite = require("../models/eligibiliteModel");

const reponsesBooleennes = [
  "fievreRecente",
  "maladieEnCours",
  "prendAntibiotiques",
  "grossesseOuAllaitement",
  "tatouageRecent",
  "transfusionRecente",
];

function calculerResultat(donnees) {
  const motifs = [];

  if (donnees.age < 18 || donnees.age > 65) {
    motifs.push("L'âge doit être compris entre 18 et 65 ans.");
  }
  if (donnees.poidsKg < 50) {
    motifs.push("Le poids déclaré est inférieur à 50 kg.");
  }
  if (donnees.fievreRecente) motifs.push("Fièvre récente déclarée.");
  if (donnees.maladieEnCours) motifs.push("Maladie en cours déclarée.");
  if (donnees.prendAntibiotiques) motifs.push("Prise récente d'antibiotiques.");
  if (donnees.grossesseOuAllaitement) motifs.push("Grossesse ou allaitement déclaré.");
  if (donnees.tatouageRecent) motifs.push("Tatouage ou piercing récent déclaré.");
  if (donnees.transfusionRecente) motifs.push("Transfusion récente déclarée.");

  if (motifs.length > 0) {
    return { resultat: "NON_ELIGIBLE", motif: motifs.join(" ") };
  }

  if (donnees.dernierDonDate) {
    const joursDepuisDon = (Date.now() - donnees.dernierDonDate.getTime()) / 86400000;
    if (joursDepuisDon < 90) {
      return {
        resultat: "A_VALIDER",
        motif: "Le dernier don date de moins de 90 jours. Une banque doit confirmer la prochaine date autorisée.",
      };
    }
  }

  return {
    resultat: "ELIGIBLE",
    motif: "Questionnaire favorable, sous réserve de la validation médicale.",
  };
}

// Évalue un questionnaire préliminaire sans remplacer l'examen médical.
async function tester(req, res, next) {
  const donnees = req.body;
  const age = Number(donnees.age);
  const poidsKg = Number(donnees.poidsKg);

  if (!Number.isInteger(age) || !Number.isFinite(poidsKg) || poidsKg <= 0) {
    return res.status(400).json({
      ok: false,
      message: "L'âge et le poids doivent être valides.",
    });
  }

  for (const champ of reponsesBooleennes) {
    if (typeof donnees[champ] !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: `La réponse ${champ} doit être un booléen.`,
      });
    }
  }

  let dernierDonDate = null;
  if (donnees.dernierDonDate !== undefined && donnees.dernierDonDate !== null) {
    dernierDonDate = new Date(donnees.dernierDonDate);
    if (Number.isNaN(dernierDonDate.getTime()) || dernierDonDate > new Date()) {
      return res.status(400).json({
        ok: false,
        message: "La date du dernier don est invalide.",
      });
    }
  }

  try {
    const profil = await donneur.trouverParUtilisateurAvecIdentifiant(
      req.utilisateur.identifiant,
    );
    if (!profil) {
      return res.status(404).json({
        ok: false,
        message: "Créez d'abord votre profil donneur.",
      });
    }

    const questionnaire = {
      donneurIdentifiant: profil.identifiant,
      age,
      poidsKg,
      fievreRecente: donnees.fievreRecente,
      maladieEnCours: donnees.maladieEnCours,
      prendAntibiotiques: donnees.prendAntibiotiques,
      grossesseOuAllaitement: donnees.grossesseOuAllaitement,
      tatouageRecent: donnees.tatouageRecent,
      transfusionRecente: donnees.transfusionRecente,
      dernierDonDate,
    };
    const decision = calculerResultat(questionnaire);
    const test = await eligibilite.creer({
      ...questionnaire,
      ...decision,
    });

    return res.status(201).json({
      ok: true,
      message: "Test d'éligibilité enregistré. Une validation médicale reste nécessaire.",
      test,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

async function historique(req, res, next) {
  try {
    const profil = await donneur.trouverParUtilisateurAvecIdentifiant(
      req.utilisateur.identifiant,
    );
    if (!profil) {
      return res.status(404).json({
        ok: false,
        message: "Profil donneur introuvable.",
      });
    }

    const tests = await eligibilite.listerPourDonneur(profil.identifiant);
    return res.json({ ok: true, nombre: tests.length, tests });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { tester, historique };
