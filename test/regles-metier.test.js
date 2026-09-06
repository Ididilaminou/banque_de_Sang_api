const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const demandesSangController = require("../src/controllers/acteurs/hopital/demandesSangController");
const { lirePagination } = require("../src/utils/pagination");

function creerReponse() {
  return {
    statusCode: null,
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

describe("Règles métier adaptées au don de sang", () => {
  it("applique les valeurs de pagination par défaut", () => {
    assert.deepEqual(lirePagination({}), { page: 1, limite: 20, saut: 0 });
  });

  it("refuse une pagination hors des limites prévues", () => {
    assert.equal(lirePagination({ page: "0", limite: "20" }), null);
    assert.equal(lirePagination({ page: "1", limite: "101" }), null);
    assert.equal(lirePagination({ page: "abc", limite: "20" }), null);
  });

  it("refuse une demande avec des références sanguines invalides", async () => {
    const req = {
      utilisateur: {
        identifiant: 10,
        role: "PERSONNEL_HOPITAL",
        etablissementIdentifiant: 3,
      },
      body: {
        produit: "PRODUIT_INCONNU",
        groupeSanguin: "C",
        rhesus: "INCONNU",
        quantite: 1,
        motif: "Urgence transfusionnelle",
      },
    };
    const res = creerReponse();

    await demandesSangController.creer(req, res, () => {
      throw new Error("La validation aurait dû arrêter la requête.");
    });

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.contenu, {
      ok: false,
      message: "Les informations de la demande sont invalides.",
    });
  });

  it("refuse une quantité nulle ou négative", async () => {
    const req = {
      utilisateur: {
        identifiant: 10,
        role: "PERSONNEL_HOPITAL",
        etablissementIdentifiant: 3,
      },
      body: {
        produit: "SANG_TOTAL",
        groupeSanguin: "O",
        rhesus: "POSITIF",
        quantite: 0,
        motif: "Besoin hospitalier",
      },
    };
    const res = creerReponse();

    await demandesSangController.creer(req, res, () => {
      throw new Error("La validation aurait dû arrêter la requête.");
    });

    assert.equal(res.statusCode, 400);
  });
});
