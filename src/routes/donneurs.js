const express = require("express");

const prisma = require("../config/prisma");
const authentifierUtilisateur = require("../middlewares/authentification");
const autoriserRoles = require("../middlewares/autorisation");

const routeur = express.Router();
const groupesSanguins = new Set(["A", "B", "AB", "O"]);
const rhesusAutorises = new Set(["POSITIF", "NEGATIF"]);

const protegerDonneur = [
  authentifierUtilisateur,
  autoriserRoles("DONNEUR"),
];

routeur.get("/moi", ...protegerDonneur, async (req, res, next) => {
  try {
    const donneur = await prisma.donneur.findUnique({
      where: { utilisateurIdentifiant: req.utilisateur.identifiant },
      select: {
        identifiant: true,
        groupeSanguin: true,
        rhesus: true,
        estDisponible: true,
        dateDerniereDisponibilite: true,
        dateCreation: true,
        dateModification: true,
      },
    });

    if (!donneur) {
      return res.status(404).json({
        ok: false,
        message: "Le profil donneur n'est pas encore créé.",
      });
    }

    return res.json({ ok: true, donneur });
  } catch (erreur) {
    return next(erreur);
  }
});

routeur.put("/moi", ...protegerDonneur, async (req, res, next) => {
  const { groupeSanguin, rhesus } = req.body;

  if (!groupesSanguins.has(groupeSanguin) || !rhesusAutorises.has(rhesus)) {
    return res.status(400).json({
      ok: false,
      message: "Le groupe sanguin ou le rhésus est invalide.",
    });
  }

  try {
    const donneur = await prisma.donneur.upsert({
      where: { utilisateurIdentifiant: req.utilisateur.identifiant },
      create: {
        utilisateurIdentifiant: req.utilisateur.identifiant,
        groupeSanguin,
        rhesus,
      },
      update: {
        groupeSanguin,
        rhesus,
      },
      select: {
        identifiant: true,
        groupeSanguin: true,
        rhesus: true,
        estDisponible: true,
        dateDerniereDisponibilite: true,
      },
    });

    return res.json({
      ok: true,
      message: "Profil donneur enregistré.",
      donneur,
    });
  } catch (erreur) {
    return next(erreur);
  }
});

routeur.patch(
  "/moi/disponibilite",
  ...protegerDonneur,
  async (req, res, next) => {
    const { estDisponible } = req.body;

    if (typeof estDisponible !== "boolean") {
      return res.status(400).json({
        ok: false,
        message: "estDisponible doit être un booléen.",
      });
    }

    try {
      const donneur = await prisma.donneur.update({
        where: { utilisateurIdentifiant: req.utilisateur.identifiant },
        data: {
          estDisponible,
          dateDerniereDisponibilite: estDisponible ? new Date() : null,
        },
        select: {
          identifiant: true,
          groupeSanguin: true,
          rhesus: true,
          estDisponible: true,
          dateDerniereDisponibilite: true,
        },
      });

      return res.json({
        ok: true,
        message: "Disponibilité mise à jour.",
        donneur,
      });
    } catch (erreur) {
      if (erreur.code === "P2025") {
        return res.status(404).json({
          ok: false,
          message: "Créez d'abord votre profil donneur.",
        });
      }

      return next(erreur);
    }
  },
);

module.exports = routeur;
