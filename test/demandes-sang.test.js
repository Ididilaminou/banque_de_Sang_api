const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const demandeSangModel = require("../src/models/acteurs/hopital/demandeSangModel");
const demandeSangController = require("../src/controllers/acteurs/hopital/demandesSangController");
const notificationModel = require("../src/models/acteurs/commun/notificationModel");
const auditModel = require("../src/models/acteurs/commun/auditModel");

function creerReponse() {
  return {
    statusCode: 200,
    contenu: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(contenu) {
      this.contenu = contenu;
      return this;
    },
  };
}

describe("Traitement des demandes de sang", () => {
  it("bloque une transition depuis un état final", async () => {
    const originaux = {
      trouverParIdentifiant: demandeSangModel.trouverParIdentifiant,
    };
    demandeSangModel.trouverParIdentifiant = async () => ({
      identifiant: 21,
      statut: "LIVREE",
    });

    try {
      const req = {
        params: { identifiant: "21" },
        body: { statut: "ANNULEE" },
        utilisateur: { identifiant: 4, role: "PERSONNEL_BANQUE" },
      };
      const res = creerReponse();

      await demandeSangController.modifier(req, res, (erreur) => {
        throw erreur;
      });

      assert.equal(res.statusCode, 409);
      assert.match(res.contenu.message, /Transition impossible/);
    } finally {
      demandeSangModel.trouverParIdentifiant = originaux.trouverParIdentifiant;
    }
  });

  it("enregistre l'historique lors d'une transition autorisée", async () => {
    const originaux = {
      trouverParIdentifiant: demandeSangModel.trouverParIdentifiant,
      modifier: demandeSangModel.modifier,
      creerHistorique: demandeSangModel.creerHistorique,
      notifierEtablissement: notificationModel.notifierEtablissement,
      creerAudit: auditModel.creer,
    };
    let historique;
    let audit;

    demandeSangModel.trouverParIdentifiant = async () => ({
      identifiant: 21,
      statut: "EN_ATTENTE",
    });
    demandeSangModel.modifier = async (_identifiant, donnees) => ({
      identifiant: 21,
      etablissementDemandeurId: 8,
      statut: donnees.statut,
    });
    demandeSangModel.creerHistorique = async (donnees) => {
      historique = donnees;
    };
    notificationModel.notifierEtablissement = async () => {};
    auditModel.creer = async (donnees) => {
      audit = donnees;
    };

    try {
      const req = {
        params: { identifiant: "21" },
        body: { statut: "EN_COURS" },
        utilisateur: { identifiant: 4, role: "PERSONNEL_BANQUE" },
      };
      const res = creerReponse();

      await demandeSangController.modifier(req, res, (erreur) => {
        throw erreur;
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.contenu.demande.statut, "EN_COURS");
      assert.equal(historique.ancienStatut, "EN_ATTENTE");
      assert.equal(historique.nouveauStatut, "EN_COURS");
      assert.equal(audit.action, "MODIFIER_STATUT_DEMANDE");
    } finally {
      demandeSangModel.trouverParIdentifiant = originaux.trouverParIdentifiant;
      demandeSangModel.modifier = originaux.modifier;
      demandeSangModel.creerHistorique = originaux.creerHistorique;
      notificationModel.notifierEtablissement = originaux.notifierEtablissement;
      auditModel.creer = originaux.creerAudit;
    }
  });
});
