'use client';
import { Pencil, Trash2, Check, X as XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchX, Users as UsersEmptyIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]); const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: ''
  });

  const [search, setSearch] = useState(''); 
  const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()) );
 async function loadCustomers() 
 { 
  const { data } = await api.get('/customers');
   setCustomers(data); 
   setLoading(false); 
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.address.trim() || !form.phone.trim() || !form.taxId.trim()) {
      toast.error('Llene todos los campos para agregar al cliente');
      return;
    }

    try {
      await api.post('/customers', form);

      setForm({
        name: '',
        email: '',
        phone: '',
        taxId: '',
        address: '',
      });

      await loadCustomers();

      toast.success(
        'Cliente agregado correctamente',
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
        'Error al agregar cliente',
      );
    }
  }

  function startEdit(customer: any) {
    setEditingId(customer.id);

    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      taxId: customer.taxId || '',
      address: customer.address || '',
    });
  }

  async function saveEdit(id: number) {
    try {
      await api.put(
        `/customers/${id}`,
        editForm,
      );

      setEditingId(null);

      loadCustomers();

      toast.success(
        'Cliente actualizado',
      );
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
        '¿Seguro que quieres eliminar este cliente?',
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/customers/${id}`,
      );

      loadCustomers();

      toast.success(
        'Cliente eliminado',
      );
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
        <Users size={22} />
        Clientes
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Agregar cliente
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
              placeholder="Email"
              className="w-48"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />

            <Input
              placeholder="Teléfono"
              className="w-32"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />

            <Input
              placeholder="NIT/RFC"
              className="w-32"
              value={form.taxId}
              onChange={(e) =>
                setForm({
                  ...form,
                  taxId: e.target.value,
                })
              }
            />

            <Input
              placeholder="Dirección"
              className="w-48"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
            />

            <Button
              type="submit"
              className="gap-1"
            >
              <Plus size={16} />
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4 max-w-xs"> 
            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
             <Input placeholder="Buscar por nombre o email..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} /> 
             </div>
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
                  Nombre
                </TableHead>

                <TableHead>
                  Email
                </TableHead>

                <TableHead>
                  Teléfono
                </TableHead>

                <TableHead>
                  NIT/RFC
                </TableHead>

                <TableHead>
                  Acciones
                  </TableHead>

              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow key={c.id}>
                  {editingId === c.id ? (
                    <>
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
                          className="h-8 w-36"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          className="h-8 w-28"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          className="h-8 w-24"
                          value={editForm.taxId}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              taxId: e.target.value,
                            })
                          }
                        />
                      </TableCell>

                      <TableCell className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEdit(c.id)}
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
                        {c.name}
                      </TableCell>

                      <TableCell>
                        {c.email}
                      </TableCell>

                      <TableCell>
                        {c.phone}
                      </TableCell>

                      <TableCell>
                        {c.taxId}
                      </TableCell>

                      <TableCell className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            startEdit(c)
                          }
                        >
                          <Pencil size={14} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleDelete(c.id)
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
      {filteredCustomers.length === 0 && ( 
        <TableRow> 
          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground"> 
            {search ? ( 
              <SearchX className="mx-auto mb-2" size={28} /> 
            ) : (
                 <UsersEmptyIcon className="mx-auto mb-2" size={28} /> 
                 )} {search ? `No se encontraron clientes que coincidan con "${search}"` : 'Aún no has agregado ningún cliente'} 
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