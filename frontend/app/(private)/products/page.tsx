'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X as XIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchX, PackageOpen } from 'lucide-react';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: ''
  });

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]); const [newCategory, setNewCategory] = useState('');
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

async function loadProducts() 
{ 
  const { data } = await api.get('/products');
   setProducts(data); 
   setLoading(false); 
  }

  async function loadCategories() {
    const { data } = await api.get('/categories');

    setCategories(data);
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;

    try {
      await api.post('/categories', {
        name: newCategory,
      });

      setNewCategory('');

      loadCategories();

      toast.success('Categoría creada');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        'Error al crear categoría',
      );
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.sku.trim()) {
      toast.error('Nombre y SKU son obligatorios');
      return;
    }

    try {
      await api.post('/products', {
        ...form,
        price: Number(form.price),
        cost: Number(form.cost),
        stock: Number(form.stock),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      });

      setForm({
        name: '',
        sku: '',
        price: '',
        cost: '',
        stock: '',
        categoryId: ''
      });

      loadProducts();

      toast.success(
        'Producto agregado correctamente',
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        'Error al agregar producto',
      );
    }
  }

  function startEdit(product: any) {
    setEditingId(product.id);

    setEditForm({
      name: product.name,
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      categoryId: product.categoryId ? String(product.categoryId) : '',
    });
  }

  async function saveEdit(id: number) {
    try {
      await api.put(`/products/${id}`, {
        name: editForm.name,
        price: Number(editForm.price),
        cost: Number(editForm.cost),
        stock: Number(editForm.stock),
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
      });

      setEditingId(null);
      loadProducts();

      toast.success('Producto actualizado');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        'Error al actualizar',
      );
    }
  }

  async function handleDelete(id: number) {
    if (
      !confirm(
        '¿Seguro que quieres eliminar este producto?',
      )
    ) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);

      loadProducts();

      toast.success('Producto eliminado');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        'Error al eliminar',
      );
    }
  }


  return (
    <div className="p-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Package size={22} />
        Productos
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Agregar producto
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleCreate}
            className="flex flex-wrap items-end gap-3"
          >
            <Input
              placeholder="Nombre"
              className="w-40"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <Input
              placeholder="SKU"
              className="w-32"
              value={form.sku}
              onChange={(e) =>
                setForm({
                  ...form,
                  sku: e.target.value,
                })
              }
            />

            <Input
              placeholder="Precio"
              type="number"
              className="w-28"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
            />

            <Input
              placeholder="Costo"
              type="number"
              className="w-28"
              value={form.cost}
              onChange={(e) =>
                setForm({
                  ...form,
                  cost: e.target.value,
                })
              }
            />

            <Input
              placeholder="Stock inicial"
              type="number"
              className="w-32"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock: e.target.value,
                })
              }
            />
            <select className="h-9 rounded-md border px-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}
                </option>))}
            </select>
            <Button
              type="submit"
              className="gap-1"
            >
              <Plus size={16} />
              Agregar
            </Button>
          </form>
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Input
              placeholder="Nueva categoría"
              className="h-8 w-40"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddCategory}
            >
              Crear categoría
            </Button>
          </div>

        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4 max-w-xs">
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
            <Input placeholder="Buscar por nombre o SKU..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {loading ? ( <div className="space-y-2"> 
            <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" /> 
             <Skeleton className="h-8 w-full" /> 
             <Skeleton className="h-8 w-full" /> </div> ) : ( 
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  {editingId === p.id ? (
                    <>
                      <TableCell>
                        {p.sku}
                      </TableCell>

                      <TableCell>
                        <Input
                          className="h-8 w-32"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          className="h-8 w-20"
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          className="h-8 w-20"
                          type="number"
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              stock: e.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <select className="h-8 rounded-md border px-1 text-xs" value={editForm.categoryId} onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })} >
                          <option value="">Sin categoría</option> {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEdit(p.id)}
                        >
                          <Check
                            size={16}
                            className="text-green-600"
                          />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setEditingId(null)
                          }
                        >
                          <XIcon size={16} />
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {p.sku}
                      </TableCell>

                      <TableCell>
                        {p.name}
                      </TableCell>

                      <TableCell>
                        ${Number(p.price).toFixed(2)}
                      </TableCell>

                      <TableCell
                        className={
                          p.stock <= p.minStock
                            ? 'font-bold text-red-600'
                            : ''
                        }
                      >
                        {p.stock}
                      </TableCell>

                      <TableCell>{p.category?.name || '—'}</TableCell>

                      <TableCell className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            startEdit(p)
                          }
                        >
                          <Pencil size={14} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleDelete(p.id)
                          }
                        >
                          <Trash2
                            size={14}
                            className="text-red-600"
                          />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
          {filteredProducts.length === 0 && ( 
            <TableRow> 
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground"> 
                {search ? ( 
                  <SearchX className="mx-auto mb-2" size={28} />
                   ) : ( 
                   <PackageOpen className="mx-auto mb-2" size={28} /> 
                   )}
                    {search ? `No se encontraron productos que coincidan con "${search}"` : 'Aún no has agregado ningún producto'}
                     </TableCell>
                      </TableRow> )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}