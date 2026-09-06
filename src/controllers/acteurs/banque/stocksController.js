const stock = require("../../../models/acteurs/banque/stockModel");

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

  const identifiantEtablissement = Number(etablissementIdentifiant);

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
    const resultat = await stock.enregistrer({
      etablissementIdentifiant: identifiantEtablissement,
      produit,
      groupeSanguin,
      rhesus,
      quantite,
      seuilAlerte,
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
  const { etablissementIdentifiant, produit, groupeSanguin, rhesus } =
    req.query;
  const filtres = {
    etablissement: {
      statut: "AUTORISE",
    },
  };

  if (etablissementIdentifiant !== undefined) {
    const identifiant = Number(etablissementIdentifiant);
    if (!Number.isInteger(identifiant)) {
      return res.status(400).json({
        ok: false,
        message: "L'identifiant de l'établissement est invalide.",
      });
    }
    filtres.etablissementIdentifiant = identifiant;
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
    const resultats = await stock.rechercher(filtres);
    return res.json({ ok: true, nombre: resultats.length, stocks: resultats });
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
    return res.json({
      ok: true,
      message: "Quantité du stock mise à jour.",
      stock: await stock.modifierQuantite(identifiant, quantite),
    });
  } catch (erreur) {
    if (erreur.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Stock introuvable." });
    }
    return next(erreur);
  }
}

module.exports = { enregistrer, rechercher, modifierQuantite };
