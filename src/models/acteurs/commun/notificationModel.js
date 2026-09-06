const prisma = require("../../../config/prismaConfig");

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

  // Informe les donneurs compatibles sans révéler leurs coordonnées dans la réponse.
  async notifierDonneurs({ donneurs, demandeSangIdentifiant, titre, message }) {
    if (donneurs.length === 0) {
      return;
    }

    await prisma.notification.createMany({
      data: donneurs.map((donneur) => ({
        utilisateurIdentifiant: donneur.utilisateurIdentifiant,
        demandeSangIdentifiant,
        type: "RECOMMANDATION_DONNEUR",
        titre,
        message,
      })),
    });
  },

  // Alerte uniquement les personnels rattachés à l'établissement concerné.
  async notifierEtablissement({ etablissementIdentifiant, type, titre, message }) {
    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        etablissementIdentifiant,
        role: { in: ["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"] },
        estActif: true,
      },
      select: { identifiant: true },
    });

    if (utilisateurs.length === 0) return;

    await prisma.notification.createMany({
      data: utilisateurs.map((utilisateur) => ({
        utilisateurIdentifiant: utilisateur.identifiant,
        type,
        titre,
        message,
      })),
    });
  },

  // Informe les banques qu'un donneur a répondu à une recommandation.
  notifierBanquesReponse({ demandeSangIdentifiant, statut }) {
    return this.notifierRoles({
      roles: ["PERSONNEL_BANQUE", "ADMINISTRATEUR"],
      demandeSangIdentifiant,
      type: "REPONSE_RECOMMANDATION",
      titre: "Réponse d'un donneur",
      message: `Un donneur a ${statut === "ACCEPTEE" ? "accepté" : "refusé"} la recommandation.`,
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
