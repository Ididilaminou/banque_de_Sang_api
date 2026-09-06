const donneur = require("../../../models/acteurs/donneur/donneurModel");
const eligibilite = require("../../../models/acteurs/donneur/eligibiliteModel");
const eligibiliteIa = require("../../../services/eligibiliteIaService");

const reponsesBooleennes = [
  "fievreRecente",
  "maladieEnCours",
  "prendAntibiotiques",
  "grossesseOuAllaitement",
  "tatouageRecent",
  "transfusionRecente",
  "operationRecente",
  "vaccinationRecente",
  "infectionRecente",
  "voyageRecent",
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
      operationRecente: donnees.operationRecente,
      vaccinationRecente: donnees.vaccinationRecente,
      infectionRecente: donnees.infectionRecente,
      voyageRecent: donnees.voyageRecent,
      dernierDonDate,
    };
    const decisionRegles = calculerResultat(questionnaire);
    let analyse;
    let analyseAutomatiqueDisponible = true;
    try {
      analyse = await eligibiliteIa.analyserQuestionnaire({
        ...questionnaire,
        avertissement: "Analyse préliminaire uniquement; validation médicale obligatoire.",
      });
    } catch (erreurIa) {
      // Le questionnaire reste utilisable si le service IA est indisponible.
      analyseAutomatiqueDisponible = false;
      analyse = {
        resultat: decisionRegles.resultat,
        analyse: "Analyse automatique indisponible. Le résultat repose temporairement sur les règles préliminaires du questionnaire.",
        recommandations: "Une validation par un professionnel de santé est obligatoire avant tout don.",
      };
    }
    const test = await eligibilite.creer({
      ...questionnaire,
      resultat: analyse.resultat,
      motif: decisionRegles.motif,
      analyseIa: analyse.analyse,
      recommandations: analyse.recommandations,
    });

    return res.status(201).json({
      ok: true,
      message: analyseAutomatiqueDisponible
        ? "Analyse IA enregistrée. La décision finale appartient à un professionnel de santé."
        : "Questionnaire enregistré. L'analyse IA est indisponible pour le moment; une validation professionnelle est requise.",
      analyseAutomatiqueDisponible,
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

// Permet à un professionnel autorisé de confirmer ou refuser l'analyse IA.
async function validerParProfessionnel(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  const { valide } = req.body;

  if (!Number.isInteger(identifiant) || typeof valide !== "boolean") {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant ou la validation est invalide.",
    });
  }

  try {
    const test = await eligibilite.validerParProfessionnel(identifiant, valide);
    return res.json({
      ok: true,
      message: valide
        ? "Analyse validée par un professionnel."
        : "Analyse refusée par un professionnel.",
      test,
    });
  } catch (erreur) {
    if (erreur.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Test d'éligibilité introuvable.",
      });
    }
    return next(erreur);
  }
}

module.exports = { tester, historique, validerParProfessionnel };
