// Límite generoso: hoy el frontend no tiene UI de paginación y consume
// estos endpoints como arrays planos, así que por defecto se devuelve
// "todo" hasta un techo de seguridad que evita cargar datasets sin límite
// en memoria/red si el volumen de datos crece. `page`/`pageSize` quedan
// disponibles para cuando el frontend implemente paginado real.
const DEFAULT_PAGE_SIZE = 500;
const MAX_PAGE_SIZE = 500;

function paginate(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE),
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

module.exports = { paginate };
