// Normalise les paramètres de pagination pour éviter des requêtes trop lourdes.
function lirePagination(requete) {
  const page = Number(requete.page || 1);
  const limite = Number(requete.limite || 20);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limite) ||
    limite < 1 ||
    limite > 100
  ) {
    return null;
  }

  return { page, limite, saut: (page - 1) * limite };
}

module.exports = { lirePagination };
