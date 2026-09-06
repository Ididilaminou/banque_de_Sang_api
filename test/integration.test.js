const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
require("dotenv/config");

const urlTest = process.env.DATABASE_URL_TEST;
const urlDeveloppement = process.env.DATABASE_URL;

describe("Base MySQL d'intégration", () => {
  it("utilise une base distincte de la base de développement", async (t) => {
    if (!urlTest) {
      t.skip("DATABASE_URL_TEST n'est pas configurée.");
      return;
    }

    assert.notEqual(
      urlTest,
      urlDeveloppement,
      "DATABASE_URL_TEST doit être différente de DATABASE_URL.",
    );

    process.env.DATABASE_URL = urlTest;
    const { PrismaClient } = require("@prisma/client");
    const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
    const prisma = new PrismaClient({ adapter: new PrismaMariaDb(urlTest) });

    try {
      const resultat = await prisma.$queryRaw`SELECT 1 AS connexion`;
      assert.equal(Number(resultat[0].connexion), 1);
    } finally {
      await prisma.$disconnect();
    }
  });

  it("autorise plusieurs personnels dans un même établissement", async (t) => {
    if (!urlTest) {
      t.skip("DATABASE_URL_TEST n'est pas configurée.");
      return;
    }

    assert.notEqual(urlTest, urlDeveloppement);

    const { PrismaClient } = require("@prisma/client");
    const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
    const prisma = new PrismaClient({ adapter: new PrismaMariaDb(urlTest) });
    const suffixe = `${Date.now()}@test.cm`;
    const courriels = [`banque-${suffixe}`, `responsable-${suffixe}`];
    let etablissement;

    try {
      etablissement = await prisma.etablissement.create({
        data: {
          nom: "Centre de transfusion de test",
          type: "BANQUE_SANG",
          adresse: "Avenue Kennedy",
          ville: "Yaoundé",
          courriel: `centre-${suffixe}`,
          statut: "AUTORISE",
          dossier: { create: {} },
        },
      });

      await prisma.utilisateur.createMany({
        data: courriels.map((courriel) => ({
          courriel,
          motDePasseHash: "hash-de-test",
          prenom: "Personnel",
          nom: "Test",
          role: "PERSONNEL_BANQUE",
          estActif: true,
          etablissementIdentifiant: etablissement.identifiant,
        })),
      });

      const personnels = await prisma.utilisateur.count({
        where: { etablissementIdentifiant: etablissement.identifiant },
      });

      assert.equal(personnels, 2);
    } finally {
      await prisma.utilisateur.deleteMany({ where: { courriel: { in: courriels } } });
      if (etablissement) {
        await prisma.etablissement.delete({ where: { identifiant: etablissement.identifiant } });
      }
      await prisma.$disconnect();
    }
  });

  it("trace un stock et le cycle de vie d'une demande", async (t) => {
    if (!urlTest) {
      t.skip("DATABASE_URL_TEST n'est pas configurée.");
      return;
    }

    assert.notEqual(urlTest, urlDeveloppement);
    const { PrismaClient } = require("@prisma/client");
    const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
    const prisma = new PrismaClient({ adapter: new PrismaMariaDb(urlTest) });
    const suffixe = `${Date.now()}@test.cm`;
    let banque;
    let hopital;
    let utilisateur;

    try {
      banque = await prisma.etablissement.create({
        data: {
          nom: "Banque de sang de test",
          type: "BANQUE_SANG",
          adresse: "Rue de la Santé",
          ville: "Douala",
          courriel: `banque-${suffixe}`,
          statut: "AUTORISE",
          dossier: { create: {} },
        },
      });
      hopital = await prisma.etablissement.create({
        data: {
          nom: "Hôpital de test",
          type: "HOPITAL",
          adresse: "Quartier Bonapriso",
          ville: "Douala",
          courriel: `hopital-${suffixe}`,
          statut: "AUTORISE",
          dossier: { create: {} },
        },
      });
      utilisateur = await prisma.utilisateur.create({
        data: {
          courriel: `personnel-${suffixe}`,
          motDePasseHash: "hash-de-test",
          prenom: "Agent",
          nom: "Transfusion",
          role: "PERSONNEL_BANQUE",
          estActif: true,
          etablissementIdentifiant: banque.identifiant,
        },
      });

      const stock = await prisma.stock.create({
        data: {
          etablissementIdentifiant: banque.identifiant,
          produit: "SANG_TOTAL",
          groupeSanguin: "O",
          rhesus: "POSITIF",
          quantite: 12,
          seuilAlerte: 5,
        },
      });
      await prisma.mouvementStock.create({
        data: {
          stockIdentifiant: stock.identifiant,
          utilisateurIdentifiant: utilisateur.identifiant,
          type: "ENTREE",
          ancienneQuantite: 0,
          nouvelleQuantite: 12,
          commentaire: "Collecte de sang test",
        },
      });

      const demande = await prisma.demandeSang.create({
        data: {
          etablissementDemandeurId: hopital.identifiant,
          produit: "SANG_TOTAL",
          groupeSanguin: "O",
          rhesus: "POSITIF",
          quantite: 2,
          urgence: true,
          motif: "Besoin transfusionnel urgent",
          statut: "EN_ATTENTE",
        },
      });
      await prisma.demandeSang.update({
        where: { identifiant: demande.identifiant },
        data: { statut: "EN_COURS", etablissementDestinataireId: banque.identifiant },
      });
      await prisma.historiqueDemandeSang.create({
        data: {
          demandeSangIdentifiant: demande.identifiant,
          utilisateurIdentifiant: utilisateur.identifiant,
          ancienStatut: "EN_ATTENTE",
          nouveauStatut: "EN_COURS",
          commentaire: "Demande prise en charge par la banque.",
        },
      });
      await prisma.journalAudit.create({
        data: {
          utilisateurIdentifiant: utilisateur.identifiant,
          action: "MODIFIER_STATUT_DEMANDE",
          ressource: "DEMANDE_SANG",
          ressourceIdentifiant: demande.identifiant,
          details: JSON.stringify({ ancienStatut: "EN_ATTENTE", nouveauStatut: "EN_COURS" }),
        },
      });

      const mouvements = await prisma.mouvementStock.count({ where: { stockIdentifiant: stock.identifiant } });
      const historique = await prisma.historiqueDemandeSang.count({ where: { demandeSangIdentifiant: demande.identifiant } });
      const audits = await prisma.journalAudit.count({ where: { ressourceIdentifiant: demande.identifiant } });
      const demandeFinale = await prisma.demandeSang.findUnique({ where: { identifiant: demande.identifiant } });

      assert.equal(mouvements, 1);
      assert.equal(historique, 1);
      assert.equal(audits, 1);
      assert.equal(demandeFinale.statut, "EN_COURS");
    } finally {
      if (utilisateur) await prisma.utilisateur.delete({ where: { identifiant: utilisateur.identifiant } });
      if (banque) await prisma.etablissement.delete({ where: { identifiant: banque.identifiant } });
      if (hopital) await prisma.etablissement.delete({ where: { identifiant: hopital.identifiant } });
      await prisma.$disconnect();
    }
  });
});
