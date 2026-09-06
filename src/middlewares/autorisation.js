function autoriserRoles(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.utilisateur) {
      return res.status(401).json({
        ok: false,
        message: "L'authentification est requise.",
      });
    }

    if (!rolesAutorises.includes(req.utilisateur.role)) {
      return res.status(403).json({
        ok: false,
        message: "Vous n'avez pas les permissions nécessaires.",
      });
    }

    return next();
  };
}

module.exports = autoriserRoles;
