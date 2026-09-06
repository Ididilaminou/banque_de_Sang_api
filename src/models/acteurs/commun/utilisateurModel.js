const prisma = require("../../../config/prismaConfig");

const selectionPublique = {
  identifiant: true,
  courriel: true,
  prenom: true,
  nom: true,
  telephone: true,
  role: true,
  estActif: true,
  doitChangerMotDePasse: true,
  etablissementIdentifiant: true,
};

module.exports = {
  trouverParCourriel(courriel) {
    return prisma.utilisateur.findUnique({ where: { courriel } });
  },

  trouverParIdentifiant(identifiant, selection = selectionPublique) {
    return prisma.utilisateur.findUnique({
      where: { identifiant },
      select: selection,
    });
  },

  creer(donnees, selection = selectionPublique) {
    return prisma.utilisateur.create({ data: donnees, select: selection });
  },

  modifier(identifiant, donnees, selection = selectionPublique) {
    return prisma.utilisateur.update({
      where: { identifiant },
      data: donnees,
      select: selection,
    });
  },

  // Supprime un compte créé si l'envoi de son email échoue.
  supprimer(identifiant) {
    return prisma.utilisateur.delete({ where: { identifiant } });
  },

  lister() {
    return prisma.utilisateur.findMany({
      select: { ...selectionPublique, dateCreation: true },
      orderBy: { dateCreation: "desc" },
    });
  },

  // Vérifie si la plateforme possède déjà un administrateur.
  compterAdministrateurs() {
    return prisma.utilisateur.count({
      where: { role: "ADMINISTRATEUR" },
    });
  },
};
