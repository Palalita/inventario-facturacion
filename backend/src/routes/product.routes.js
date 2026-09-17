const express = require('express');
const prisma = require('../utils/prisma');
const { authMiddleware, requireAdmin } = require('../middlewares/auth');const router = express.Router();
const { validate, productSchema } = require('../utils/validators');
const { paginate } = require('../utils/pagination');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { skip, take } = paginate(req.query);
  const [products, total] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, skip, take, orderBy: { id: 'asc' } }),
    prisma.product.count(),
  ]);
  res.set('X-Total-Count', String(total));
  res.json(products);
});

router.post('/', requireAdmin, validate(productSchema), async (req, res) => {
  const { name, sku, description, price, cost, stock, minStock, categoryId } = req.body;
  const product = await prisma.product.create({
    data: { name, sku, description, price, cost, stock: stock || 0, minStock: minStock || 5, categoryId }
  });
  res.status(201).json(product);
});

// El stock no se edita aquí: cambia únicamente vía /api/inventory/movement
// para mantener el historial de movimientos como fuente de verdad.
router.put('/:id', requireAdmin, validate(productSchema.partial().omit({ stock: true })), async (req, res) => {
  const product = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(product);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

router.get('/low-stock', async (req, res) => {
  const low = await prisma.$queryRaw`SELECT * FROM "Product" WHERE stock <= "minStock" ORDER BY id ASC`;
  res.json(low);
});

module.exports = router;