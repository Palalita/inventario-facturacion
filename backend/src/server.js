require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const customerRoutes = require('./routes/customer.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const categoryRoutes = require('./routes/category.routes'); 
const userRoutes = require('./routes/user.routes');
const app = express();
app.use(cors({ origin: [ 'https://inventario-facturacion-weld.vercel.app', 'http://localhost:3000', ], })); 
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/categories', categoryRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/users', userRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));