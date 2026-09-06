const prisma = require("../../../config/prismaConfig");

// Cette sélection limite les champs renvoyés par l'API.
const selectionStock = {
  identifiant: true,
  etablissementIdentifiant: true,
  produit: true,
  groupeSanguin: true,
  rhesus: true,
  quantite: true,
  seuilAlerte: true,
  dateCreation: true,
  dateModification: true,
  etablissement: {
    select: {
      identifiant: true,
      nom: true,
      ville: true,
      statut: true,
    },
  },
};

module.exports = {
  // Recherche un stock et vérifie son établissement propriétaire.
  trouverParIdentifiant(identifiant) {
    return prisma.stock.findUnique({
      where: { identifiant },
      select: {
        identifiant: true,
        etablissementIdentifiant: true,
        quantite: true,
        seuilAlerte: true,
      },
    });
  },

  // Retourne la quantité disponible pour une combinaison précise.
  trouverQuantite(etablissementIdentifiant, produit, groupeSanguin, rhesus) {
    return prisma.stock.findUnique({
      where: {
        etablissementIdentifiant_produit_groupeSanguin_rhesus: {
          etablissementIdentifiant,
          produit,
          groupeSanguin,
          rhesus,
        },
      },
      select: { quantite: true },
    });
  },

  // Crée ou met à jour une ligne de stock unique.
  enregistrer(donnees) {
    return prisma.stock.upsert({
      where: {
        etablissementIdentifiant_produit_groupeSanguin_rhesus: {
          etablissementIdentifiant: donnees.etablissementIdentifiant,
          produit: donnees.produit,
          groupeSanguin: donnees.groupeSanguin,
          rhesus: donnees.rhesus,
        },
      },
      create: donnees,
      update: {
        quantite: donnees.quantite,
        seuilAlerte: donnees.seuilAlerte,
      },
      select: selectionStock,
    });
  },

  // Retourne les stocks qui correspondent aux filtres fournis.
  async rechercher(filtres, pagination) {
    const [stocks, total] = await prisma.$transaction([
      prisma.stock.findMany({
        where: filtres,
        select: selectionStock,
        orderBy: { dateModification: "desc" },
        skip: pagination.saut,
        take: pagination.limite,
      }),
      prisma.stock.count({ where: filtres }),
    ]);
    return { stocks, total };
  },

  // Modifie seulement la quantité d'un stock existant.
  modifierQuantite(identifiant, quantite) {
    return prisma.stock.update({
      where: { identifiant },
      data: { quantite },
      select: selectionStock,
    });
  },

  // Enregistre une trace immuable de chaque opération sur le stock.
  creerMouvement(donnees) {
    return prisma.mouvementStock.create({ data: donnees });
  },

  // Retourne l'historique d'un stock.
  listerMouvements(stockIdentifiant, etablissementIdentifiant) {
    return prisma.mouvementStock.findMany({
      where: {
        stockIdentifiant,
        stock: { etablissementIdentifiant },
      },
      select: {
        identifiant: true,
        stockIdentifiant: true,
        utilisateurIdentifiant: true,
        type: true,
        ancienneQuantite: true,
        nouvelleQuantite: true,
        commentaire: true,
        dateCreation: true,
      },
      orderBy: { dateCreation: "desc" },
    });
  },
};
