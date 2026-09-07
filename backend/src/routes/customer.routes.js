const express = require('express');
const prisma = require('../utils/prisma');
const { authMiddleware, requireAdmin } = require('../middlewares/auth');
const router = express.Router();
const { validate, customerSchema } = require('../utils/validators'); 
router.use(authMiddleware);

router.get('/', async (req, res) => res.json(await prisma.customer.findMany()));

router.post('/', validate(customerSchema), async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json(customer);
});

router.put('/:id', async (req, res) => {
  const customer = await prisma.customer.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(customer);
});

router.delete('/:id', requireAdmin, async (req, res) => { 
  try 
  { 
    await prisma.customer.delete({ 
      where: { id: Number(req.params.id) } 
    }); res.status(204).send(); 
  } 
  catch (err) 
  { 
    res.status(400).json({ error: 'No se puede eliminar: el cliente tiene facturas asociadas' }); 
  } 
});
module.exports = router;