const prisma = require("../config/prismaConfig");

const selectionNotification = {
  identifiant: true,
  demandeSangIdentifiant: true,
  type: true,
  titre: true,
  message: true,
  estLue: true,
  dateCreation: true,
  dateLecture: true,
};

module.exports = {
  // Retourne uniquement les notifications de l'utilisateur connecté.
  listerPourUtilisateur(utilisateurIdentifiant, seulementNonLues = false) {
    return prisma.notification.findMany({
      where: {
        utilisateurIdentifiant,
        ...(seulementNonLues ? { estLue: false } : {}),
      },
      select: selectionNotification,
      orderBy: { dateCreation: "desc" },
    });
  },

  // Crée une notification pour tous les comptes actifs ayant les rôles ciblés.
  async notifierRoles({ roles, demandeSangIdentifiant, type, titre, message }) {
    const utilisateurs = await prisma.utilisateur.findMany({
      where: { role: { in: roles }, estActif: true },
      select: { identifiant: true },
    });

    if (utilisateurs.length === 0) {
      return;
    }

    await prisma.notification.createMany({
      data: utilisateurs.map((utilisateur) => ({
        utilisateurIdentifiant: utilisateur.identifiant,
        demandeSangIdentifiant,
        type,
        titre,
        message,
      })),
    });
  },

  // Marque une notification appartenant à l'utilisateur comme lue.
  marquerCommeLue(identifiant, utilisateurIdentifiant) {
    return prisma.notification.updateMany({
      where: { identifiant, utilisateurIdentifiant, estLue: false },
      data: { estLue: true, dateLecture: new Date() },
    });
  },
};
