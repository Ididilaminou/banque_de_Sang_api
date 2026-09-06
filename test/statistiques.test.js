const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const statistiquesController = require("../src/controllers/acteurs/administrateur/statistiquesController");

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

describe("Statistiques", () => {
  it("refuse les statistiques d'un autre établissement", async () => {
    const req = {
      params: { identifiant: "12" },
      utilisateur: {
        role: "PERSONNEL_HOPITAL",
        etablissementIdentifiant: 8,
      },
    };
    const res = creerReponse();

    await statistiquesController.parEtablissement(req, res, () => {
      throw new Error("La permission aurait dû arrêter la requête.");
    });

    assert.equal(res.statusCode, 403);
    assert.match(res.contenu.message, /votre établissement/);
  });

  it("refuse un identifiant d'établissement invalide", async () => {
    const req = {
      params: { identifiant: "abc" },
      utilisateur: { role: "ADMINISTRATEUR" },
    };
    const res = creerReponse();

    await statistiquesController.parEtablissement(req, res, () => {});

    assert.equal(res.statusCode, 400);
  });
});
