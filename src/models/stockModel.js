const prisma = require("../config/prismaConfig");

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
  rechercher(filtres) {
    return prisma.stock.findMany({
      where: filtres,
      select: selectionStock,
      orderBy: { dateModification: "desc" },
    });
  },

  // Modifie seulement la quantité d'un stock existant.
  modifierQuantite(identifiant, quantite) {
    return prisma.stock.update({
      where: { identifiant },
      data: { quantite },
      select: selectionStock,
    });
  },
};
