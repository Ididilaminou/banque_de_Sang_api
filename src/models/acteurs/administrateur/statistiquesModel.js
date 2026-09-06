const prisma = require("../../../config/prismaConfig");

async function statistiquesGlobales() {
  const [
    donneurs,
    dons,
    etablissements,
    personnels,
    demandesParStatut,
    demandesUrgentes,
    stocksParType,
    stockFaible,
  ] = await Promise.all([
    prisma.donneur.count(),
    prisma.don.count({ where: { statut: { not: "ANNULE" } } }),
    prisma.etablissement.groupBy({ by: ["type", "statut"], _count: { _all: true } }),
    prisma.utilisateur.groupBy({
      by: ["role"],
      where: { role: { in: ["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"] } },
      _count: { _all: true },
    }),
    prisma.demandeSang.groupBy({ by: ["statut"], _count: { _all: true } }),
    prisma.demandeSang.count({ where: { urgence: true, statut: { not: "ANNULEE" } } }),
    prisma.stock.groupBy({
      by: ["produit", "groupeSanguin", "rhesus"],
      _sum: { quantite: true },
    }),
    prisma.stock.count({ where: { quantite: { lte: 5 } } }),
  ]);

  return {
    donneurs,
    dons,
    etablissements,
    personnels,
    demandesParStatut,
    demandesUrgentes,
    stocksParType,
    stocksFaibles: stockFaible,
  };
}

async function statistiquesEtablissement(identifiant) {
  const [
    etablissement,
    personnels,
    stocks,
    demandesEmisesParStatut,
    demandesRecuesParStatut,
    demandesUrgentes,
    dons,
    mouvementsStocks,
  ] = await Promise.all([
    prisma.etablissement.findUnique({
      where: { identifiant },
      select: {
        identifiant: true,
        nom: true,
        type: true,
        ville: true,
        statut: true,
        possedeBanqueSangInterne: true,
      },
    }),
    prisma.utilisateur.count({
      where: {
        etablissementIdentifiant: identifiant,
        role: { in: ["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"] },
      },
    }),
    prisma.stock.findMany({
      where: { etablissementIdentifiant: identifiant },
      select: {
        identifiant: true,
        produit: true,
        groupeSanguin: true,
        rhesus: true,
        quantite: true,
        seuilAlerte: true,
      },
      orderBy: [{ produit: "asc" }, { groupeSanguin: "asc" }, { rhesus: "asc" }],
    }),
    prisma.demandeSang.groupBy({
      by: ["statut"],
      where: { etablissementDemandeurId: identifiant },
      _count: { _all: true },
    }),
    prisma.demandeSang.groupBy({
      by: ["statut"],
      where: { etablissementDestinataireId: identifiant },
      _count: { _all: true },
    }),
    prisma.demandeSang.count({
      where: {
        urgence: true,
        statut: { not: "ANNULEE" },
        OR: [
          { etablissementDemandeurId: identifiant },
          { etablissementDestinataireId: identifiant },
        ],
      },
    }),
    prisma.don.count({
      where: {
        statut: { not: "ANNULE" },
        donneur: {
          utilisateur: { etablissementIdentifiant: identifiant },
        },
      },
    }),
    prisma.mouvementStock.count({
      where: { stock: { etablissementIdentifiant: identifiant } },
    }),
  ]);

  return {
    etablissement,
    personnels,
    stocks,
    stocksFaibles: stocks.filter((stock) => stock.quantite <= stock.seuilAlerte).length,
    demandesEmisesParStatut,
    demandesRecuesParStatut,
    demandesUrgentes,
    dons,
    mouvementsStocks,
  };
}

module.exports = { statistiquesGlobales, statistiquesEtablissement };
