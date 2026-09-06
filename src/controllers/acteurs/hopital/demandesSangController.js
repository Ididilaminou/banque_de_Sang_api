const demandeSang = require("../../../models/acteurs/hopital/demandeSangModel");
const notification = require("../../../models/acteurs/commun/notificationModel");
const stock = require("../../../models/acteurs/banque/stockModel");
const donneur = require("../../../models/acteurs/donneur/donneurModel");
const etablissement = require("../../../models/acteurs/administrateur/etablissementModel");
const { lirePagination } = require("../../../utils/pagination");

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

const transitionsAutorisees = {
  EN_ATTENTE: new Set(["EN_COURS", "ANNULEE", "REJETEE"]),
  EN_COURS: new Set(["ACCEPTEE", "REJETEE", "ANNULEE"]),
  ACCEPTEE: new Set(["LIVREE", "ANNULEE"]),
  REJETEE: new Set(),
  LIVREE: new Set(),
  ANNULEE: new Set(),
};

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
  // L'hôpital demandeur est celui lié au compte connecté.
  const identifiantDemandeur =
    req.utilisateur.role === "ADMINISTRATEUR"
      ? Number(etablissementDemandeurId)
      : req.utilisateur.etablissementIdentifiant;

  if (
    !Number.isInteger(identifiantDemandeur) ||
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
      etablissementDemandeurId: identifiantDemandeur,
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
  const pagination = lirePagination(req.query);
  if (!pagination) return res.status(400).json({ ok: false, message: "La pagination est invalide. Utilisez page >= 1 et limite entre 1 et 100." });

  // Un hôpital ne consulte que les demandes qu'il a lui-même créées.
  if (req.utilisateur.role === "PERSONNEL_HOPITAL") {
    filtres.etablissementDemandeurId = req.utilisateur.etablissementIdentifiant;
  }

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
    const resultats = await demandeSang.lister(filtres, pagination);
    return res.json({
      ok: true,
      nombre: resultats.demandes.length,
      total: resultats.total,
      page: pagination.page,
      limite: pagination.limite,
      demandes: resultats.demandes,
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
    const demandeAvant = await demandeSang.trouverParIdentifiant(identifiant);
    if (!demandeAvant) {
      return res.status(404).json({ ok: false, message: "Demande introuvable." });
    }
    if (!transitionsAutorisees[demandeAvant.statut].has(statut)) {
      return res.status(409).json({
        ok: false,
        message: `Transition impossible : ${demandeAvant.statut} vers ${statut}.`,
      });
    }

    const resultat = await demandeSang.modifier(identifiant, {
      statut,
      etablissementDestinataireId:
        etablissementDestinataireId === undefined
          ? undefined
          : Number(etablissementDestinataireId),
    });
    await demandeSang.creerHistorique({
      demandeSangIdentifiant: identifiant,
      utilisateurIdentifiant: req.utilisateur.identifiant,
      ancienStatut: demandeAvant.statut,
      nouveauStatut: statut,
      commentaire: "Changement de statut effectué par le personnel.",
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

// Retourne la traçabilité complète d'une demande.
async function historique(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  if (!Number.isInteger(identifiant)) {
    return res.status(400).json({ ok: false, message: "Identifiant invalide." });
  }

  try {
    const historiqueDemande = await demandeSang.listerHistorique(identifiant);
    return res.json({
      ok: true,
      nombre: historiqueDemande.length,
      historique: historiqueDemande,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

// Recommande des donneurs compatibles lorsque le stock de la banque est insuffisant.
async function recommanderDonneurs(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  // La banque utilisatrice ne peut recommander qu'avec son propre stock.
  const etablissementIdentifiant =
    req.utilisateur.role === "ADMINISTRATEUR"
      ? Number(req.body.etablissementIdentifiant)
      : req.utilisateur.etablissementIdentifiant;

  if (!Number.isInteger(identifiant) || !Number.isInteger(etablissementIdentifiant)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant de la demande ou de l'établissement est invalide.",
    });
  }

  try {
    const banque = await etablissement.trouverBanqueAutorisee(etablissementIdentifiant);

    if (!banque) {
      return res.status(404).json({
        ok: false,
        message: "Banque de sang autorisée introuvable.",
      });
    }

    const demande = await demandeSang.trouverParIdentifiant(identifiant);

    if (!demande) {
      return res.status(404).json({
        ok: false,
        message: "Demande de sang introuvable.",
      });
    }

    if (["LIVREE", "ANNULEE", "REJETEE"].includes(demande.statut)) {
      return res.status(409).json({
        ok: false,
        message: "Cette demande ne peut plus recevoir de recommandation.",
      });
    }

    const stockDisponible = await stock.trouverQuantite(
      etablissementIdentifiant,
      demande.produit,
      demande.groupeSanguin,
      demande.rhesus,
    );
    const quantiteDisponible = stockDisponible ? stockDisponible.quantite : 0;

    if (quantiteDisponible >= demande.quantite) {
      return res.status(409).json({
        ok: false,
        message: "Le stock disponible suffit pour cette demande.",
      });
    }

    const donneurs = await donneur.rechercherDisponiblesCompatibles(
      demande.groupeSanguin,
      demande.rhesus,
    );

    await demandeSang.enregistrerRecommandations(demande.identifiant, donneurs);
    await notification.notifierDonneurs({
      donneurs,
      demandeSangIdentifiant: demande.identifiant,
      titre: "Besoin urgent de don compatible",
      message: `Une demande nécessite du ${demande.produit} de groupe ${demande.groupeSanguin} ${demande.rhesus}. Votre disponibilité peut aider.`,
    });

    return res.json({
      ok: true,
      message: donneurs.length
        ? "Les donneurs compatibles ont été notifiés."
        : "Aucun donneur compatible et disponible n'a été trouvé.",
      nombreDonneursNotifies: donneurs.length,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

// Permet au donneur d'accepter ou de refuser une recommandation reçue.
async function repondreRecommandation(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  const { accepter } = req.body;

  if (!Number.isInteger(identifiant) || typeof accepter !== "boolean") {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant ou la réponse du donneur est invalide.",
    });
  }

  try {
    const profil = await donneur.trouverParUtilisateurAvecIdentifiant(
      req.utilisateur.identifiant,
    );
    const recommandation = profil
      ? await demandeSang.trouverRecommandationPourDonneur(identifiant, profil.identifiant)
      : null;

    if (!recommandation) {
      return res.status(404).json({
        ok: false,
        message: "Cette recommandation n'existe pas pour votre compte.",
      });
    }

    if (recommandation.statut !== "EN_ATTENTE") {
      return res.status(409).json({
        ok: false,
        message: "Vous avez déjà répondu à cette recommandation.",
      });
    }

    const statut = accepter ? "ACCEPTEE" : "REFUSEE";
    const resultat = await demandeSang.repondreRecommandation(
      recommandation.identifiant,
      statut,
    );
    await notification.notifierBanquesReponse({
      demandeSangIdentifiant: resultat.demandeSangIdentifiant,
      statut,
    });

    return res.json({
      ok: true,
      message: accepter
        ? "Votre acceptation a été transmise à la banque."
        : "Votre refus a été transmis à la banque.",
      recommandation: resultat,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = {
  creer,
  lister,
  modifier,
  historique,
  recommanderDonneurs,
  repondreRecommandation,
};
