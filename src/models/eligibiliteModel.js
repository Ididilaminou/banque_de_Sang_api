const prisma = require("../config/prismaConfig");

const selectionTest = {
  identifiant: true,
  donneurIdentifiant: true,
  age: true,
  poidsKg: true,
  fievreRecente: true,
  maladieEnCours: true,
  prendAntibiotiques: true,
  grossesseOuAllaitement: true,
  tatouageRecent: true,
  transfusionRecente: true,
  dernierDonDate: true,
  resultat: true,
  motif: true,
  dateCreation: true,
};

module.exports = {
  // Enregistre le résultat du questionnaire d'un donneur.
  creer(donnees) {
    return prisma.testEligibilite.create({
      data: donnees,
      select: selectionTest,
    });
  },

  // Retourne l'historique personnel du donneur.
  listerPourDonneur(donneurIdentifiant) {
    return prisma.testEligibilite.findMany({
      where: { donneurIdentifiant },
      select: selectionTest,
      orderBy: { dateCreation: "desc" },
    });
  },
};
