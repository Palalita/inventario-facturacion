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

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['ADMIN', 'SELLER']).optional(),
});

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'SELLER'], 'Rol inválido'),
});

const invoiceSchema = z.object({
  customerId: z.number().int().positive('Cliente inválido'),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive('Producto inválido'),
        quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
      }),
    )
    .min(1, 'La factura debe tener al menos un producto'),
});

const invoiceStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED'], 'Estado inválido'),
});

const movementSchema = z.object({
  productId: z.number().int().positive('Producto inválido'),
  type: z.enum(['IN', 'OUT'], 'Tipo de movimiento inválido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  reason: z.string().optional(),
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
  userSchema,
  roleSchema,
  invoiceSchema,
  invoiceStatusSchema,
  movementSchema,
};
