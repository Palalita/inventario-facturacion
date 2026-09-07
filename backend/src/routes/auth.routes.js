const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('../middlewares/auth');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  message:
  {
    error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
  }
  , standardHeaders: true, legacyHeaders: false,
});
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email ya registrado' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role || 'SELLER' }
  });
  res.status(201).json({ id: user.id, email: user.email });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.json(user);
});

router.patch('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Debes ingresar la contraseña actual y la nueva',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'La nueva contraseña debe tener al menos 6 caracteres',
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
  });

  const valid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!valid) {
    return res.status(400).json({
      error: 'La contraseña actual es incorrecta',
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      passwordHash,
    },
  });

  res.json({
    message: 'Contraseña actualizada correctamente',
  });
});


module.exports = router;