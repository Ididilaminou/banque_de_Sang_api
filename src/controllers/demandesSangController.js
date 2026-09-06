const demandeSang = require("../models/demandeSangModel");
const notification = require("../models/notificationModel");

const produitsAutorises = new Set([
  "SANG_TOTAL",
  "GLOBULES_ROUGES",
  "PLAQUETTES",
  "PLASMA",
]);
const groupesAutorises = new Set(["A", "B", "AB", "O"]);
const rhesusAutorises = new Set(["POSITIF", "NEGATIF"]);
const statutsAutorises = new Set([
  "EN_ATTENTE",
  "EN_COURS",
  "ACCEPTEE",
  "REJETEE",
  "LIVREE",
  "ANNULEE",
]);

// Permet à un hôpital de signaler un besoin en produits sanguins.
async function creer(req, res, next) {
  const {
    etablissementDemandeurId,
    produit,
    groupeSanguin,
    rhesus,
    quantite,
    urgence = false,
    motif,
  } = req.body;

  if (
    !Number.isInteger(Number(etablissementDemandeurId)) ||
    !produitsAutorises.has(produit) ||
    !groupesAutorises.has(groupeSanguin) ||
    !rhesusAutorises.has(rhesus) ||
    !Number.isInteger(quantite) ||
    quantite <= 0 ||
    typeof urgence !== "boolean" ||
    typeof motif !== "string" ||
    !motif.trim()
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les informations de la demande sont invalides.",
    });
  }

  try {
    const resultat = await demandeSang.creer({
      etablissementDemandeurId: Number(etablissementDemandeurId),
      produit,
      groupeSanguin,
      rhesus,
      quantite,
      urgence,
      motif: motif.trim(),
    });

    await notification.notifierRoles({
      roles: ["PERSONNEL_BANQUE", "ADMINISTRATEUR"],
      demandeSangIdentifiant: resultat.identifiant,
      type: "DEMANDE_SANG_CREEE",
      titre: urgence ? "Nouvelle demande urgente" : "Nouvelle demande de sang",
      message: `Une demande de ${quantite} unité(s) de ${produit} a été créée.`,
    });

    return res.status(201).json({
      ok: true,
      message: "Demande de sang créée.",
      demande: resultat,
    });
  } catch (erreur) {
    if (erreur.code === "P2003") {
      return res.status(404).json({
        ok: false,
        message: "Établissement demandeur introuvable.",
      });
    }
    return next(erreur);
  }
}

// Retourne les demandes visibles par les acteurs habilités.
async function lister(req, res, next) {
  const { statut, urgence } = req.query;
  const filtres = {};

  if (statut !== undefined) {
    if (!statutsAutorises.has(statut)) {
      return res.status(400).json({
        ok: false,
        message: "Le statut de la demande est invalide.",
      });
    }
    filtres.statut = statut;
  }

  if (urgence !== undefined) {
    if (urgence !== "true" && urgence !== "false") {
      return res.status(400).json({
        ok: false,
        message: "Le filtre urgence doit valoir true ou false.",
      });
    }
    filtres.urgence = urgence === "true";
  }

  try {
    const resultats = await demandeSang.lister(filtres);
    return res.json({
      ok: true,
      nombre: resultats.length,
      demandes: resultats,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

// Met à jour le traitement d'une demande par la banque ou l'administrateur.
async function modifier(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  const { statut, etablissementDestinataireId } = req.body;

  if (
    !Number.isInteger(identifiant) ||
    !statutsAutorises.has(statut) ||
    (etablissementDestinataireId !== undefined &&
      !Number.isInteger(Number(etablissementDestinataireId)))
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les informations de mise à jour sont invalides.",
    });
  }

  try {
    const resultat = await demandeSang.modifier(identifiant, {
      statut,
      etablissementDestinataireId:
        etablissementDestinataireId === undefined
          ? undefined
          : Number(etablissementDestinataireId),
    });

    await notification.notifierRoles({
      roles: ["PERSONNEL_HOPITAL", "ADMINISTRATEUR"],
      demandeSangIdentifiant: resultat.identifiant,
      type: "DEMANDE_SANG_MISE_A_JOUR",
      titre: "Mise à jour d'une demande de sang",
      message: `La demande n°${resultat.identifiant} est maintenant ${statut}.`,
    });

    return res.json({
      ok: true,
      message: "Demande de sang mise à jour.",
      demande: resultat,
    });
  } catch (erreur) {
    if (erreur.code === "P2025" || erreur.code === "P2003") {
      return res.status(404).json({
        ok: false,
        message: "Demande ou établissement introuvable.",
      });
    }
    return next(erreur);
  }
}

module.exports = { creer, lister, modifier };
