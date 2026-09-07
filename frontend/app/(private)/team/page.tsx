'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus, Users as UsersIcon, Trash2 } from 'lucide-react';
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

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SELLER',
  });

  async function loadUsers() {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err: any) {
      toast.error('No tienes permisos para ver esta sección');
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      await api.post('/users', form);

      setForm({
        name: '',
        email: '',
        password: '',
        role: 'SELLER',
      });

      loadUsers();

      toast.success('Usuario creado correctamente');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          'Error al crear usuario',
      );
    }
  }

  async function changeRole(id: number, role: string) {
    try {
      await api.patch(`/users/${id}/role`, { role });

      loadUsers();

      toast.success('Rol actualizado');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          'Error al actualizar rol',
      );
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);

      loadUsers();

      toast.success('Usuario eliminado');
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
        <UsersIcon size={22} />
        Usuarios
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Crear usuario
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
              placeholder="Contraseña"
              type="password"
              className="w-40"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
            />

            <select
              className="h-9 rounded-md border px-2 text-sm"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
            >
              <option value="SELLER">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>

            <Button type="submit" className="gap-1">
              <UserPlus size={16} />
              Crear
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>

                  <TableCell>{u.email}</TableCell>

                  <TableCell>
                    <select
                      value={u.role}
                      onChange={(e) =>
                        changeRole(u.id, e.target.value)
                      }
                      className="rounded border px-1 py-0.5 text-xs"
                    >
                      <option value="SELLER">
                        Vendedor
                      </option>

                      <option value="ADMIN">
                        Administrador
                      </option>
                    </select>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(u.id)}
                    >
                      <Trash2
                        size={14}
                        className="text-red-600"
                      />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
