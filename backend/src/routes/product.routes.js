const express = require('express');
const prisma = require('../utils/prisma');
const { authMiddleware, requireAdmin } = require('../middlewares/auth');const router = express.Router();
const { validate, productSchema } = require('../utils/validators');
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  res.json(products);
});

router.post('/', validate(productSchema), async (req, res) => {
  const { name, sku, description, price, cost, stock, minStock, categoryId } = req.body;
  const product = await prisma.product.create({
    data: { name, sku, description, price, cost, stock: stock || 0, minStock: minStock || 5, categoryId }
  });
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
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
  const products = await prisma.product.findMany();
  const low = products.filter(p => p.stock <= p.minStock);
  res.json(low);
});

module.exports = router;