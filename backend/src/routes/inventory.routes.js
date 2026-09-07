const express = require('express');
const prisma = require('../utils/prisma');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();
const { sendLowStockAlert } = require('../utils/mailer');
router.use(authMiddleware);


// Registrar movimiento y actualizar stock en una transacción
router.post('/movement', async (req, res) => {
  const { productId, type, quantity, reason } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Producto no existe');

      const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;
      if (newStock < 0) throw new Error('Stock insuficiente');

      await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
      if (type === 'OUT' && newStock <= product.minStock) 
        { 
          sendLowStockAlert({ ...product, stock: newStock }); 
        }

      return tx.inventoryMovement.create({
        data: { productId, type, quantity, reason, userId: req.user.id }
      });
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/movements', async (req, res) => {
  const movements = await prisma.inventoryMovement.findMany({
    include: { product: true, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(movements);
});

module.exports = router;