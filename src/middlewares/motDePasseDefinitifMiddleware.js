// Empêche l'accès aux fonctionnalités métier tant que le mot de passe temporaire
// n'a pas été remplacé par un mot de passe définitif.
function exigerMotDePasseDefinitif(req, res, next) {
  if (req.utilisateur.doitChangerMotDePasse) {
    return res.status(403).json({
      ok: false,
      message: "Vous devez modifier votre mot de passe temporaire avant de continuer.",
      doitChangerMotDePasse: true,
    });
  }

  return next();
}

module.exports = exigerMotDePasseDefinitif;
