const audit = require("../../../models/acteurs/commun/auditModel");
const { lirePagination } = require("../../../utils/pagination");

// Permet à l'administrateur de consulter les opérations tracées.
async function lister(req, res, next) {
  const pagination = lirePagination(req.query);
  if (!pagination) {
    return res.status(400).json({
      ok: false,
      message: "La pagination est invalide.",
    });
  }

  try {
    const journaux = await audit.lister(pagination);
    return res.json({
      ok: true,
      nombre: journaux.length,
      page: pagination.page,
      limite: pagination.limite,
      journaux,
    });
  } catch (erreur) {
    return next(erreur);
  }
}

module.exports = { lister };
