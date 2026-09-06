// Vérifie qu'un membre du personnel est bien rattaché à un établissement.
// Plusieurs comptes peuvent partager le même établissement : la relation est
// donc "un établissement vers plusieurs personnels".
function exigerEtablissementPersonnel(req, res, next) {
  const rolesPersonnel = ["PERSONNEL_BANQUE", "PERSONNEL_HOPITAL"];

  if (
    rolesPersonnel.includes(req.utilisateur.role) &&
    !Number.isInteger(req.utilisateur.etablissementIdentifiant)
  ) {
    return res.status(403).json({
      ok: false,
      message: "Ce compte du personnel n'est pas encore rattaché à un établissement.",
    });
  }

  return next();
}

module.exports = exigerEtablissementPersonnel;
