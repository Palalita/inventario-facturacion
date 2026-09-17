const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const {
  authMiddleware,
  requireAdmin,
} = require('../middlewares/auth');
const { validate, userSchema, roleSchema } = require('../utils/validators');
const { paginate } = require('../utils/pagination');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', async (req, res) => {
  const { skip, take } = paginate(req.query);
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      skip,
      take,
    }),
    prisma.user.count(),
  ]);

  res.set('X-Total-Count', String(total));
  res.json(users);
});

router.post('/', validate(userSchema), async (req, res) => {
  const {
    name,
    email,
    password,
    role,
  } = req.body;

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) {
    return res.status(400).json({
      error: 'Ese email ya está registrado',
    });
  }

  const passwordHash = await bcrypt.hash(
    password,
    10,
  );

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || 'SELLER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  res.status(201).json(user);
});

router.patch('/:id/role', validate(roleSchema), async (req, res) => {
  const { role } = req.body;

  console.log(`[audit] usuario ${req.user.id} (${req.user.name}) cambió el rol de usuario ${req.params.id} a ${role}`);

  const user = await prisma.user.update({
    where: {
      id: Number(req.params.id),
    },
    data: {
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  res.json(user);
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({
      error: 'No puedes eliminar tu propio usuario',
    });
  }

  try {
    await prisma.user.delete({
      where: {
        id: Number(req.params.id),
      },
    });

    console.log(`[audit] usuario ${req.user.id} (${req.user.name}) eliminó al usuario ${req.params.id}`);

    res.status(204).send();
  } catch (err) {
    res.status(400).json({
      error:
        'No se puede eliminar: este usuario tiene registros asociados',
    });
  }
});

module.exports = router;
