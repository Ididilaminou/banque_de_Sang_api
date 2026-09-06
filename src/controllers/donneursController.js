const donneur = require("../models/donneurModel");

const groupesSanguins = new Set(["A", "B", "AB", "O"]);
const rhesusAutorises = new Set(["POSITIF", "NEGATIF"]);

async function rechercher(req, res, next) {
  const { groupeSanguin, rhesus, disponible } = req.query;
  const filtres = {};
  if (groupeSanguin !== undefined) {
    if (!groupesSanguins.has(groupeSanguin)) return res.status(400).json({ ok: false, message: "Le groupe sanguin est invalide." });
    filtres.groupeSanguin = groupeSanguin;
  }
  if (rhesus !== undefined) {
    if (!rhesusAutorises.has(rhesus)) return res.status(400).json({ ok: false, message: "Le rhésus est invalide." });
    filtres.rhesus = rhesus;
  }
  if (disponible !== undefined) {
    if (disponible !== "true" && disponible !== "false") return res.status(400).json({ ok: false, message: "Le filtre disponible doit valoir true ou false." });
    filtres.estDisponible = disponible === "true";
  }
  try {
    const resultats = await donneur.rechercher(filtres);
    return res.json({ ok: true, nombre: resultats.length, donneurs: resultats });
  } catch (erreur) {
    return next(erreur);
  }
}

async function consulterProfil(req, res, next) {
  try {
    const resultat = await donneur.trouverParUtilisateur(req.utilisateur.identifiant);
    if (!resultat) return res.status(404).json({ ok: false, message: "Le profil donneur n'est pas encore créé." });
    return res.json({ ok: true, donneur: resultat });
  } catch (erreur) {
    return next(erreur);
  }
}

async function enregistrerProfil(req, res, next) {
  const { groupeSanguin, rhesus } = req.body;
  if (!groupesSanguins.has(groupeSanguin) || !rhesusAutorises.has(rhesus)) {
    return res.status(400).json({ ok: false, message: "Le groupe sanguin ou le rhésus est invalide." });
  }
  try {
    return res.json({
      ok: true,
      message: "Profil donneur enregistré.",
      donneur: await donneur.enregistrer(req.utilisateur.identifiant, groupeSanguin, rhesus),
    });
  } catch (erreur) {
    return next(erreur);
  }
}

async function modifierDisponibilite(req, res, next) {
  const { estDisponible } = req.body;
  if (typeof estDisponible !== "boolean") return res.status(400).json({ ok: false, message: "estDisponible doit être un booléen." });
  try {
    return res.json({
      ok: true,
      message: "Disponibilité mise à jour.",
      donneur: await donneur.modifierDisponibilite(req.utilisateur.identifiant, estDisponible),
    });
  } catch (erreur) {
    if (erreur.code === "P2025") return res.status(404).json({ ok: false, message: "Créez d'abord votre profil donneur." });
    return next(erreur);
  }
}

module.exports = { rechercher, consulterProfil, enregistrerProfil, modifierDisponibilite };
