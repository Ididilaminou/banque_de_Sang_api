const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const utilisateurModel = require("../src/models/acteurs/commun/utilisateurModel");
const authentificationController = require("../src/controllers/acteurs/commun/authentificationController");

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

describe("Authentification", () => {
  it("refuse une inscription avec un mot de passe trop court", async () => {
    const req = {
      body: {
        courriel: "donneur@example.cm",
        motDePasse: "court",
        prenom: "Amina",
        nom: "Njoya",
      },
    };
    const res = creerReponse();

    await authentificationController.inscrire(req, res, () => {
      throw new Error("La validation aurait dû arrêter la requête.");
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.contenu.message, /au moins 8 caractères/);
  });

  it("normalise les informations du donneur avant création", async () => {
    const originaux = {
      trouverParCourriel: utilisateurModel.trouverParCourriel,
      creer: utilisateurModel.creer,
    };
    let donneesRecues;

    utilisateurModel.trouverParCourriel = async () => null;
    utilisateurModel.creer = async (donnees) => {
      donneesRecues = donnees;
      return {
        identifiant: 15,
        courriel: donnees.courriel,
        prenom: donnees.prenom,
        nom: donnees.nom,
        telephone: donnees.telephone,
        role: "DONNEUR",
        estActif: false,
      };
    };

    try {
      const req = {
        body: {
          courriel: "  DONNEUR@EXEMPLE.CM ",
          motDePasse: "mot-de-passe-solide",
          prenom: "  Amina ",
          nom: " Njoya ",
          telephone: " 690000000 ",
        },
      };
      const res = creerReponse();

      await authentificationController.inscrire(req, res, (erreur) => {
        throw erreur;
      });

      assert.equal(res.statusCode, 201);
      assert.equal(donneesRecues.courriel, "donneur@exemple.cm");
      assert.equal(donneesRecues.prenom, "Amina");
      assert.equal(donneesRecues.nom, "Njoya");
      assert.equal(donneesRecues.telephone, "690000000");
      assert.equal(donneesRecues.estActif, false);
      assert.match(donneesRecues.motDePasseHash, /^\$2[aby]\$/);
    } finally {
      utilisateurModel.trouverParCourriel = originaux.trouverParCourriel;
      utilisateurModel.creer = originaux.creer;
    }
  });
});
