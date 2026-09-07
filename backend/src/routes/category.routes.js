const express = require('express');
const prisma = require('../utils/prisma');
const {
  authMiddleware,
  requireAdmin,
} = require('../middlewares/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  res.json(categories);
});

router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: 'El nombre es obligatorio',
    });
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({
      error: 'Esa categoría ya existe',
    });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    res.status(204).send();
  } catch (err) {
    res.status(400).json({
      error:
        'No se puede eliminar: hay productos usando esta categoría',
    });
  }
});

module.exports = router;
