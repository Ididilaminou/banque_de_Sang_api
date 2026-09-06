const assert = require("node:assert/strict");
const { after, before, describe, it } = require("node:test");

const app = require("../src/application");

let serveur;
let baseUrl;

describe("API banque de sang", () => {
  before(async () => {
    serveur = await new Promise((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${serveur.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      serveur.close((erreur) => (erreur ? reject(erreur) : resolve()));
    });
  });

  it("répond correctement à la route de santé", async () => {
    const reponse = await fetch(`${baseUrl}/health`);
    const contenu = await reponse.json();

    assert.equal(reponse.status, 200);
    assert.deepEqual(contenu, {
      ok: true,
      message: "API banque-sang opérationnelle",
    });
  });

  it("retourne une erreur JSON pour une route inconnue", async () => {
    const reponse = await fetch(`${baseUrl}/route-inconnue`);
    const contenu = await reponse.json();

    assert.equal(reponse.status, 404);
    assert.equal(contenu.ok, false);
    assert.match(contenu.message, /Route introuvable/);
  });

  it("refuse une route privée sans jeton", async () => {
    const reponse = await fetch(`${baseUrl}/notifications`);
    const contenu = await reponse.json();

    assert.equal(reponse.status, 401);
    assert.equal(contenu.ok, false);
    assert.equal(contenu.message, "Un jeton d'authentification est requis.");
  });

  it("transforme un JSON invalide en réponse JSON", async () => {
    const reponse = await fetch(`${baseUrl}/demandes-sang`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{json-invalide",
    });
    const contenu = await reponse.json();

    assert.equal(reponse.status, 400);
    assert.deepEqual(contenu, {
      ok: false,
      message: "Le corps JSON de la requête est invalide.",
    });
  });
});
