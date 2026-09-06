const stock = require("../../../models/acteurs/banque/stockModel");
const notification = require("../../../models/acteurs/commun/notificationModel");
const { lirePagination } = require("../../../utils/pagination");
const audit = require("../../../models/acteurs/commun/auditModel");

const produitsAutorises = new Set([
  "SANG_TOTAL",
  "GLOBULES_ROUGES",
  "PLAQUETTES",
  "PLASMA",
]);
const groupesAutorises = new Set(["A", "B", "AB", "O"]);
const rhesusAutorises = new Set(["POSITIF", "NEGATIF"]);

// Vérifie et enregistre une quantité de produits sanguins.
async function enregistrer(req, res, next) {
  const {
    etablissementIdentifiant,
    produit,
    groupeSanguin,
    rhesus,
    quantite,
    seuilAlerte = 5,
  } = req.body;

  // Pour un membre de banque, l'établissement vient du compte authentifié.
  const identifiantEtablissement =
    req.utilisateur.role === "ADMINISTRATEUR"
      ? Number(etablissementIdentifiant)
      : req.utilisateur.etablissementIdentifiant;

  if (
    !Number.isInteger(identifiantEtablissement) ||
    !produitsAutorises.has(produit) ||
    !groupesAutorises.has(groupeSanguin) ||
    !rhesusAutorises.has(rhesus) ||
    !Number.isInteger(quantite) ||
    quantite < 0 ||
    !Number.isInteger(seuilAlerte) ||
    seuilAlerte < 0
  ) {
    return res.status(400).json({
      ok: false,
      message: "Les informations du stock sont invalides.",
    });
  }

  try {
    const stockAvant = await stock.trouverQuantite(
      identifiantEtablissement,
      produit,
      groupeSanguin,
      rhesus,
    );
    const resultat = await stock.enregistrer({
      etablissementIdentifiant: identifiantEtablissement,
      produit,
      groupeSanguin,
      rhesus,
      quantite,
      seuilAlerte,
    });

    await stock.creerMouvement({
      stockIdentifiant: resultat.identifiant,
      utilisateurIdentifiant: req.utilisateur.identifiant,
      type: "AJUSTEMENT",
      ancienneQuantite: stockAvant ? stockAvant.quantite : 0,
      nouvelleQuantite: quantite,
      commentaire: "Création ou remplacement initial du stock.",
    });
    await audit.creer({
      utilisateurIdentifiant: req.utilisateur.identifiant,
      action: "ENREGISTRER_STOCK",
      ressource: "STOCK",
      ressourceIdentifiant: resultat.identifiant,
      details: JSON.stringify({ quantite, produit, groupeSanguin, rhesus }),
    });

    return res.json({
      ok: true,
      message: "Stock enregistré.",
      stock: resultat,
    });
  } catch (erreur) {
    if (erreur.code === "P2003" || erreur.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Établissement introuvable.",
      });
    }

    return next(erreur);
  }
}

// Recherche les stocks avec des filtres optionnels.
async function rechercher(req, res, next) {
  const { produit, groupeSanguin, rhesus } =
    req.query;
  const filtres = {
    etablissement: {
      statut: "AUTORISE",
    },
  };
  const pagination = lirePagination(req.query);
  if (!pagination) return res.status(400).json({ ok: false, message: "La pagination est invalide. Utilisez page >= 1 et limite entre 1 et 100." });

  if (req.utilisateur.role === "PERSONNEL_BANQUE") {
    filtres.etablissementIdentifiant = req.utilisateur.etablissementIdentifiant;
  }
  if (produit !== undefined && !produitsAutorises.has(produit)) {
    return res.status(400).json({ ok: false, message: "Le produit est invalide." });
  }
  if (groupeSanguin !== undefined && !groupesAutorises.has(groupeSanguin)) {
    return res.status(400).json({ ok: false, message: "Le groupe sanguin est invalide." });
  }
  if (rhesus !== undefined && !rhesusAutorises.has(rhesus)) {
    return res.status(400).json({ ok: false, message: "Le rhésus est invalide." });
  }

  if (produit !== undefined) filtres.produit = produit;
  if (groupeSanguin !== undefined) filtres.groupeSanguin = groupeSanguin;
  if (rhesus !== undefined) filtres.rhesus = rhesus;

  try {
    const resultats = await stock.rechercher(filtres, pagination);
    return res.json({ ok: true, nombre: resultats.stocks.length, total: resultats.total, page: pagination.page, limite: pagination.limite, stocks: resultats.stocks });
  } catch (erreur) {
    return next(erreur);
  }
}

// Met à jour rapidement la quantité après un mouvement de stock.
async function modifierQuantite(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  const { quantite } = req.body;

  if (!Number.isInteger(identifiant) || !Number.isInteger(quantite) || quantite < 0) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant ou la quantité est invalide.",
    });
  }

  try {
    const stockExistant = await stock.trouverParIdentifiant(identifiant);
    if (
      !stockExistant ||
      (req.utilisateur.role === "PERSONNEL_BANQUE" &&
        stockExistant.etablissementIdentifiant !== req.utilisateur.etablissementIdentifiant)
    ) {
      return res.status(404).json({ ok: false, message: "Stock introuvable." });
    }

    const type = quantite > stockExistant.quantite ? "ENTREE" : "SORTIE";
    const resultat = await stock.modifierQuantite(identifiant, quantite);
    await stock.creerMouvement({
      stockIdentifiant: identifiant,
      utilisateurIdentifiant: req.utilisateur.identifiant,
      type,
      ancienneQuantite: stockExistant.quantite,
      nouvelleQuantite: quantite,
    });
    await audit.creer({
      utilisateurIdentifiant: req.utilisateur.identifiant,
      action: "MODIFIER_QUANTITE_STOCK",
      ressource: "STOCK",
      ressourceIdentifiant: identifiant,
      details: JSON.stringify({ ancienneQuantite: stockExistant.quantite, nouvelleQuantite: quantite }),
    });

    if (quantite <= resultat.seuilAlerte) {
      await notification.notifierEtablissement({
        etablissementIdentifiant: resultat.etablissementIdentifiant,
        type: "STOCK_FAIBLE",
        titre: "Alerte de stock faible",
        message: `Le stock n°${resultat.identifiant} est à ${quantite} unité(s).`,
      });
    }

    return res.json({
      ok: true,
      message: "Quantité du stock mise à jour.",
      stock: resultat,
    });
  } catch (erreur) {
    if (erreur.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Stock introuvable." });
    }
    return next(erreur);
  }
}

// Consulte l'historique uniquement du stock autorisé au personnel connecté.
async function historique(req, res, next) {
  const identifiant = Number(req.params.identifiant);
  const etablissementIdentifiant =
    req.utilisateur.role === "ADMINISTRATEUR"
      ? Number(req.query.etablissementIdentifiant)
      : req.utilisateur.etablissementIdentifiant;

  if (!Number.isInteger(identifiant) || !Number.isInteger(etablissementIdentifiant)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant du stock ou de l'établissement est invalide.",
    });
  }

  try {
    const mouvements = await stock.listerMouvements(identifiant, etablissementIdentifiant);
    return res.json({ ok: true, nombre: mouvements.length, mouvements });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { enregistrer, rechercher, modifierQuantite, historique };
