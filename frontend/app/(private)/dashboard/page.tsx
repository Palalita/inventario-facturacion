'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

import {
  Package,
  AlertTriangle,
  FileText,
  DollarSign,
  LogOut,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);

  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });

  const [monthlyData, setMonthlyData] = useState<
    { month: string; total: number }[]
  >([]);

  const [topProducts, setTopProducts] = useState<
    { name: string; quantity: number }[]
  >([]);

  useEffect(() => {
    async function loadStats() {
      const [
        productsRes,
        lowStockRes,
        invoicesRes,
      ] = await Promise.all([
        api.get('/products'),
        api.get('/products/low-stock'),
        api.get('/invoices'),
      ]);

      const invoices = invoicesRes.data;

      const paid = invoices.filter(
        (inv: any) => inv.status === 'PAID',
      );

      const revenue = paid.reduce(
        (sum: number, inv: any) =>
          sum + Number(inv.total),
        0,
      );

      setStats({
        totalProducts:
          productsRes.data.length,
        lowStock:
          lowStockRes.data.length,
        totalInvoices:
          invoices.length,
        totalRevenue: revenue,
      });

      // Ventas por mes (últimos 6 meses, solo facturas pagadas)
      const monthMap: Record<
        string,
        number
      > = {};

      paid.forEach((inv: any) => {
        const date = new Date(inv.createdAt);

        const key = date.toLocaleDateString(
          'es',
          {
            month: 'short',
            year: '2-digit',
          },
        );

        monthMap[key] =
          (monthMap[key] || 0) +
          Number(inv.total);
      });

      setMonthlyData(
        Object.entries(monthMap).map(
          ([month, total]) => ({
            month,
            total,
          }),
        ),
      );

      // Productos más vendidos (por cantidad, sumando todas las facturas)
      const productMap: Record<
        string,
        number
      > = {};

      invoices.forEach((inv: any) => {
        inv.items?.forEach((item: any) => {
          const name =
            item.product?.name ||
            'Desconocido';

          productMap[name] =
            (productMap[name] || 0) +
            item.quantity;
        });
      });

      const sorted = Object.entries(
        productMap,
      )
        .map(([name, quantity]) => ({
          name,
          quantity,
        }))
        .sort(
          (a, b) =>
            b.quantity - a.quantity,
        )
        .slice(0, 5);

      setTopProducts(sorted);
    }

    loadStats();

    window.addEventListener(
      'focus',
      loadStats,
    );

    return () =>
      window.removeEventListener(
        'focus',
        loadStats,
      );
  }, []);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const cards = [
    {
      label: 'Productos',
      value: stats.totalProducts,
      icon: <Package size={20} />,
    },
    {
      label: 'Stock bajo',
      value: stats.lowStock,
      alert: stats.lowStock > 0,
      icon: <AlertTriangle size={20} />,
    },
    {
      label: 'Facturas',
      value: stats.totalInvoices,
      icon: <FileText size={20} />,
    },
    {
      label: 'Ventas pagadas',
      value: `Q${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarSign size={20} />,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Dashboard
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-1"
        >
          <LogOut size={14} />
          Cerrar sesión
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle
                className={`flex items-center gap-2 text-sm font-normal ${
                  card.alert
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }`}
              >
                {card.icon}
                {card.label}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  card.alert
                    ? 'text-red-600'
                    : ''
                }`}
              >
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ventas por mes (pagadas)
            </CardTitle>
          </CardHeader>

          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay ventas pagadas
                para mostrar.
              </p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={250}
              >
                <BarChart
                  data={monthlyData}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

                  <XAxis dataKey="month" fontSize={12} tick={{ fill: 'var(--foreground)' }} /> 

                  <YAxis fontSize={12}  tick={{ fill: 'hsl(var(--foreground))' }}/>

                   <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)' }} cursor={{ fill: 'var(--accent)', opacity: 0.3 }} />
                <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} /> 
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Productos más vendidos
            </CardTitle>
          </CardHeader>

          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay ventas para
                mostrar.
              </p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={250}
              >
                <BarChart
                  data={topProducts}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

                  <XAxis
                    type="number"
                    fontSize={12}
                    tick={{ fill: 'var(--foreground)' }}
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    fontSize={12}
                     tick={{ fill: 'var(--foreground)' }}
                  />

                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)' }} cursor={{ fill: 'var(--accent)', opacity: 0.3 }} />
                  <Bar dataKey="quantity" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}