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
});
