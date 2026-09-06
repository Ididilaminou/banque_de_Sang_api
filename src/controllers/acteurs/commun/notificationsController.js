const notification = require("../../../models/acteurs/commun/notificationModel");
const { lirePagination } = require("../../../utils/pagination");

// Affiche les notifications du compte connecté.
async function lister(req, res, next) {
  const seulementNonLues = req.query.nonLues;
  const pagination = lirePagination(req.query);
  if (!pagination) return res.status(400).json({ ok: false, message: "La pagination est invalide. Utilisez page >= 1 et limite entre 1 et 100." });

  if (seulementNonLues !== undefined && seulementNonLues !== "true" && seulementNonLues !== "false") {
    return res.status(400).json({
      ok: false,
      message: "Le filtre nonLues doit valoir true ou false.",
    });
  }

  try {
    const resultat = await notification.listerPourUtilisateur(
      req.utilisateur.identifiant,
      seulementNonLues === "true",
      pagination,
    );

    return res.json({
      ok: true,
      nombre: resultat.notifications.length,
      total: resultat.total,
      page: pagination.page,
      limite: pagination.limite,
      notifications: resultat.notifications,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

// Marque une notification comme lue sans permettre l'accès à celle d'un autre compte.
async function marquerCommeLue(req, res, next) {
  const identifiant = Number(req.params.identifiant);

  if (!Number.isInteger(identifiant)) {
    return res.status(400).json({
      ok: false,
      message: "L'identifiant de la notification est invalide.",
    });
  }

  try {
    const resultat = await notification.marquerCommeLue(
      identifiant,
      req.utilisateur.identifiant,
    );

    if (resultat.count === 0) {
      return res.status(404).json({
        ok: false,
        message: "Notification introuvable ou déjà lue.",
      });
    }

    return res.json({
      ok: true,
      message: "Notification marquée comme lue.",
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { lister, marquerCommeLue };
