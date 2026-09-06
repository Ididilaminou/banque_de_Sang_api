const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const autoriserRoles = require("../src/middlewares/autorisationMiddleware");
const exigerEtablissementPersonnel = require("../src/middlewares/exigerEtablissementPersonnelMiddleware");

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

describe("Middlewares de sécurité", () => {
  it("autorise un rôle configuré", () => {
    const req = { utilisateur: { role: "PERSONNEL_BANQUE" } };
    const res = creerReponse();
    let suivant = false;

    autoriserRoles("PERSONNEL_BANQUE")(req, res, () => {
      suivant = true;
    });

    assert.equal(suivant, true);
    assert.equal(res.statusCode, null);
  });

  it("refuse un rôle non autorisé", () => {
    const req = { utilisateur: { role: "DONNEUR" } };
    const res = creerReponse();

    autoriserRoles("PERSONNEL_BANQUE")(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.contenu.ok, false);
  });

  it("bloque un personnel sans établissement", () => {
    const req = {
      utilisateur: {
        role: "PERSONNEL_HOPITAL",
        etablissementIdentifiant: null,
      },
    };
    const res = creerReponse();

    exigerEtablissementPersonnel(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.match(res.contenu.message, /rattaché à un établissement/);
  });
});
