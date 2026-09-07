const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(
    1,
    'El nombre es obligatorio',
  ),

  sku: z.string().min(
    1,
    'El SKU es obligatorio',
  ),

  description: z.string().optional(),

  price: z.number().positive(
    'El precio debe ser mayor a 0',
  ),

  cost: z.number().min(
    0,
    'El costo no puede ser negativo',
  ),

  stock: z.number().int().min(0).optional(),

  minStock: z.number().int().min(0).optional(),

  categoryId: z.number().int().optional().nullable(),
});

const customerSchema = z.object({
  name: z.string().min(
    1,
    'El nombre es obligatorio',
  ),

  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),

  phone: z.string().optional(),

  taxId: z.string().optional(),

  address: z.string().optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ||
        'Datos inválidos';

      return res.status(400).json({
        error: message,
      });
    }

    req.body = result.data;

    next();
  };
}

module.exports = {
  validate,
  productSchema,
  customerSchema,
};
