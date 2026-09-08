const express = require('express');
const prisma = require('../utils/prisma');
const { authMiddleware } = require('../middlewares/auth');
const PDFDocument = require('pdfkit');
const router = express.Router();
const { sendLowStockAlert } = require('../utils/mailer');
const TAX_RATE = 0.12; // ajusta según tu país (IVA/ISV/etc.)

router.use(authMiddleware);

router.get('/', async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(invoices);
});

router.get('/:id', async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(req.params.id) },
    include: { customer: true, items: { include: { product: true } }, user: true }
  });
  if (!invoice) return res.status(404).json({ error: 'No encontrada' });
  res.json(invoice);
});

router.post('/', async (req, res) => {
  const { customerId, items } = req.body; // items: [{ productId, quantity }]

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const itemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Producto ${item.productId} no existe`);
        if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);

        const lineSubtotal = Number(product.price) * item.quantity;
        subtotal += lineSubtotal;

        itemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: lineSubtotal
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity }
        });

        const newStock = product.stock - item.quantity; if (newStock <= product.minStock) { sendLowStockAlert({ ...product, stock: newStock }); }

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'Venta - Factura',
            userId: req.user.id
          }
        });
      }

      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax;
      const number = `INV-${Date.now()}`;

      return tx.invoice.create({
        data: {
          number, customerId, userId: req.user.id,
          subtotal, tax, total,
          items: { create: itemsData }
        },
        include: { items: true, customer: true }
      });
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body; // PENDING | PAID | CANCELLED
  const invoice = await prisma.invoice.update({
    where: { id: Number(req.params.id) },
    data: { status }
  });
  res.json(invoice);
});

router.get('/:id/pdf', async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: Number(req.params.id),
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!invoice) {
    return res.status(404).json({
      error: 'Factura no encontrada',
    });
  }

  res.setHeader('Content-Type', 'application/pdf');

  res.setHeader(
    'Content-Disposition',
    `attachment; filename=factura-${invoice.number}.pdf`,
  );

  const doc = new PDFDocument({
    margin: 50,
    size: 'letter',
  });

  doc.pipe(res);

  const pageWidth = doc.page.width - 100;
  const left = 50;

  // ===== ENCABEZADO =====

  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('EACI S.A', left, 50);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#555')
    .text(
      'Ciudad de Guatemala, Guatemala',
      left,
      74,
    )
    .text(
      'Tel: 4797-5114 | edgar.palala1@gmail.com',
      left,
      87,
    );

  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('FACTURA', 350, 50, {
      width: 200,
      align: 'right',
    });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#333')
    .text(`No. ${invoice.number}`, 350, 78, {
      width: 200,
      align: 'right',
    })
    .text(
      `Fecha: ${new Date(
        invoice.createdAt,
      ).toLocaleDateString()}`,
      350,
      92,
      {
        width: 200,
        align: 'right',
      },
    );

  doc
    .moveTo(left, 115)
    .lineTo(left + pageWidth, 115)
    .strokeColor('#ccc')
    .stroke();

  // ===== DATOS DEL CLIENTE =====

  doc
    .fillColor('#888')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('FACTURAR A', left, 130);

  doc
    .fillColor('#000')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(invoice.customer.name, left, 144);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#333');

  let y = 160;

  if (invoice.customer.taxId) {
    doc.text(
      `NIT/RFC: ${invoice.customer.taxId}`,
      left,
      y,
    );

    y += 13;
  }

  if (invoice.customer.address) {
    doc.text(invoice.customer.address, left, y);
    y += 13;
  }

  if (invoice.customer.email) {
    doc.text(invoice.customer.email, left, y);
    y += 13;
  }

  const statusLabel = {
    PENDING: 'Pendiente',
    PAID: 'Pagada',
    CANCELLED: 'Anulada',
  }[invoice.status] || invoice.status;

  const statusColor = {
    PENDING: '#b45309',
    PAID: '#15803d',
    CANCELLED: '#b91c1c',
  }[invoice.status] || '#000';

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(statusColor)
    .text(
      `Estado: ${statusLabel}`,
      350,
      130,
      {
        width: 200,
        align: 'right',
      },
    );

  // ===== TABLA =====

  const tableTop = Math.max(y + 20, 210);

  const col = {
    product: left,
    qty: 320,
    price: 390,
    subtotal: 470,
  };

  const colWidth = {
    product: 260,
    qty: 60,
    price: 70,
    subtotal: 80,
  };

  doc
    .rect(left, tableTop, pageWidth, 22)
    .fill('#111');

  doc
    .fillColor('#fff')
    .fontSize(9)
    .font('Helvetica-Bold');

  doc.text(
    'PRODUCTO',
    col.product + 8,
    tableTop + 7,
    {
      width: colWidth.product,
    },
  );

  doc.text(
    'CANT.',
    col.qty,
    tableTop + 7,
    {
      width: colWidth.qty,
      align: 'right',
    },
  );

  doc.text(
    'PRECIO',
    col.price,
    tableTop + 7,
    {
      width: colWidth.price,
      align: 'right',
    },
  );

  doc.text(
    'SUBTOTAL',
    col.subtotal,
    tableTop + 7,
    {
      width: colWidth.subtotal - 8,
      align: 'right',
    },
  );

  // ===== PRODUCTOS =====

  let rowY = tableTop + 22;

  invoice.items.forEach((item, i) => {
    const rowHeight = 24;

    if (i % 2 === 1) {
      doc
        .rect(left, rowY, pageWidth, rowHeight)
        .fill('#f7f7f7');
    }

    doc
      .fillColor('#000')
      .fontSize(9)
      .font('Helvetica');

    doc.text(
      item.product.name,
      col.product + 8,
      rowY + 7,
      {
        width: colWidth.product,
      },
    );

    doc.text(
      String(item.quantity),
      col.qty,
      rowY + 7,
      {
        width: colWidth.qty,
        align: 'right',
      },
    );

    doc.text(
      `Q${Number(item.unitPrice).toFixed(2)}`,
      col.price,
      rowY + 7,
      {
        width: colWidth.price,
        align: 'right',
      },
    );

    doc.text(
      `Q${Number(item.subtotal).toFixed(2)}`,
      col.subtotal,
      rowY + 7,
      {
        width: colWidth.subtotal - 8,
        align: 'right',
      },
    );

    rowY += rowHeight;
  });

  doc
    .moveTo(left, rowY)
    .lineTo(left + pageWidth, rowY)
    .strokeColor('#ccc')
    .stroke();

  // ===== TOTALES =====

  const totalsX = 350;
  const totalsWidth = 200;

  let totalsY = rowY + 15;

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#333');

  doc.text(
    'Subtotal',
    totalsX,
    totalsY,
    {
      width: 100,
    },
  );

  doc.text(
    `Q${Number(invoice.subtotal).toFixed(2)}`,
    totalsX + 100,
    totalsY,
    {
      width: 100,
      align: 'right',
    },
  );

  totalsY += 16;

  doc.text(
    'Impuesto',
    totalsX,
    totalsY,
    {
      width: 100,
    },
  );

  doc.text(
    `Q${Number(invoice.tax).toFixed(2)}`,
    totalsX + 100,
    totalsY,
    {
      width: 100,
      align: 'right',
    },
  );

  totalsY += 20;

  doc
    .rect(
      totalsX,
      totalsY,
      totalsWidth,
      28,
    )
    .fill('#111');

  doc
    .fillColor('#fff')
    .fontSize(12)
    .font('Helvetica-Bold');

  doc.text(
    'TOTAL',
    totalsX + 10,
    totalsY + 8,
  );

  doc.text(
    `Q${Number(invoice.total).toFixed(2)}`,
    totalsX,
    totalsY + 8,
    {
      width: totalsWidth - 10,
      align: 'right',
    },
  );

  // ===== PIE DE PÁGINA =====

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#999')
    .text(
      'Gracias por su compra.',
      left,
      doc.page.height - 70,
      {
        width: pageWidth,
        align: 'center',
      },
    );

  doc.end();
});


module.exports = router;