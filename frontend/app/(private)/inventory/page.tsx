'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchX, Boxes as BoxesEmptyIcon } from 'lucide-react';
import {
  Boxes,
  PackagePlus,
  PackageMinus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function InventoryPage() {
const [products, setProducts] = useState<any[]>([]);
const [movements, setMovements] = useState<any[]>([]); 
const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    productId: '',
    type: 'IN',
    quantity: '',
    reason: '',
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('MONTH');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 15;

  function isWithinDateFilter(dateStr: string) {
    if (dateFilter === 'ALL') {
      return true;
    }

    const date = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'TODAY') {
      return date.toDateString() === now.toDateString();
    }

    if (dateFilter === 'WEEK') {
      const weekAgo = new Date();

      weekAgo.setDate(now.getDate() - 7);

      return date >= weekAgo;
    }

    if (dateFilter === 'MONTH') {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    return true;
  }

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      (m.product?.name || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (m.reason || '')
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType =
      typeFilter === 'ALL' ||
      m.type === typeFilter;

    const matchesProduct =
      productFilter === 'ALL' ||
      String(m.productId) === productFilter;

    const matchesDate = isWithinDateFilter(m.createdAt);

    return (
      matchesSearch &&
      matchesType &&
      matchesProduct &&
      matchesDate
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMovements.length / pageSize)
  );

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, productFilter, dateFilter]);


 async function loadData() 
 { 
  const [prodRes, movRes] = await Promise.all([ api.get('/products'), api.get('/inventory/movements'), ]); 
  setProducts(prodRes.data);
  setMovements(movRes.data);
  setLoading(false); }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      await api.post('/inventory/movement', {
        productId: Number(form.productId),
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason,
      });

      setForm({
        productId: '',
        type: 'IN',
        quantity: '',
        reason: '',
      });

      loadData();

      toast.success(
        'Movimiento registrado correctamente',
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        'Error al registrar movimiento',
      );
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Boxes size={22} />
        Inventario
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Registrar movimiento
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <select
              className="h-9 rounded-md border px-2 text-sm"
              value={form.productId}
              onChange={(e) =>
                setForm({
                  ...form,
                  productId: e.target.value,
                })
              }
            >
              <option value="">
                Selecciona un producto
              </option>

              {products.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.name} (stock: {p.stock})
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border px-2 text-sm"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
            >
              <option value="IN">
                Entrada
              </option>

              <option value="OUT">
                Salida
              </option>
            </select>

            <Input
              placeholder="Cantidad"
              type="number"
              className="w-24"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: e.target.value,
                })
              }
            />

            <Input
              placeholder="Motivo (opcional)"
              className="w-48"
              value={form.reason}
              onChange={(e) =>
                setForm({
                  ...form,
                  reason: e.target.value,
                })
              }
            />

            <Button
              type="submit"
              className="gap-1"
            >
              {form.type === 'IN' ? (
                <PackagePlus size={16} />
              ) : (
                <PackageMinus size={16} />
              )}

              Registrar
            </Button>
                
          </form>
          
        </CardContent>
        
      </Card>

      <select className="h-9 rounded-md border px-2 text-sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} >
         <option value="TODAY">Hoy</option> <option value="WEEK">Últimos 7 días</option> 
         <option value="MONTH">Este mes</option> <option value="ALL">Todas las fechas</option> 
         </select>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historial de movimientos
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? ( <div className="space-y-2">
            <Skeleton className="h-8 w-full" /> 
            <Skeleton className="h-8 w-full" /> 
            <Skeleton className="h-8 w-full" /> 
            <Skeleton className="h-8 w-full" /> 
            </div> ) : (   
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Producto
                </TableHead>

                <TableHead>
                  Tipo
                </TableHead>

                <TableHead>
                  Cantidad
                </TableHead>

                <TableHead>
                  Motivo
                </TableHead>

                <TableHead>
                  Usuario
                </TableHead>

                <TableHead>
                  Fecha
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedMovements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.product?.name}
                  </TableCell>

                  <TableCell
                    className={
                      m.type === 'IN'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {m.type}
                  </TableCell>

                  <TableCell>
                    {m.quantity}
                  </TableCell>

                  <TableCell>
                    {m.reason}
                  </TableCell>

                  <TableCell>
                    {m.user?.name}
                  </TableCell>

                  <TableCell>
                    {new Date(
                      m.createdAt,
                    ).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {filteredMovements.length === 0 && ( 
                <TableRow> 
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground"> 
                    {search || typeFilter !== 'ALL' || productFilter !== 'ALL' ? ( 
                      <SearchX className="mx-auto mb-2" size={28} /> 
                      ) : (
                         <BoxesEmptyIcon className="mx-auto mb-2" size={28} /> 
                         )} 
                         {
                         search || typeFilter !== 'ALL' || productFilter !== 'ALL' ? 'No se encontraron movimientos con esos filtros' : 'Aún no hay movimientos de inventario registrados'}
                          </TableCell> 
                          </TableRow> )}
            </TableBody>
            
          </Table>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground"> {filteredMovements.length} movimiento(s) — página {currentPage} de {totalPages} </p> 
            <div className="flex gap-2"> 
              <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}> <ChevronLeft size={16} /> 
              </Button> <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}> 
                <ChevronRight size={16} /> 
                </Button> 
                </div> 
                </div>
        </CardContent>
      </Card>
  
    </div>

  );
}