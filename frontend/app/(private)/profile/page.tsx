'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const { data } = await api.get('/auth/me');
      setProfile(data);
    }

    loadProfile();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('Contraseña actualizada correctamente');
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          'Error al cambiar la contraseña',
      );
    }
  }

  if (!profile) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold max-w-md mx-auto">        <User size={22} />
        Mi perfil
      </h1>

      <Card className="mb-6 max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-base">
            Información de la cuenta
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nombre:</span>{' '}
            {profile.name}
          </p>

          <p>
            <span className="text-muted-foreground">Email:</span>{' '}
            {profile.email}
          </p>

          <p className="flex items-center gap-1">
            <span className="text-muted-foreground">Rol:</span>
            <Shield size={14} />
            {profile.role === 'ADMIN'
              ? 'Administrador'
              : 'Vendedor'}
          </p>

          <p>
            <span className="text-muted-foreground">
              Miembro desde:
            </span>{' '}
            {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock size={16} />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleChangePassword}
            className="space-y-3"
          >
            <Input
              type="password"
              placeholder="Contraseña actual"
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  currentPassword: e.target.value,
                })
              }
            />

            <Input
              type="password"
              placeholder="Nueva contraseña"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  newPassword: e.target.value,
                })
              }
            />

            <Input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  confirmPassword: e.target.value,
                })
              }
            />

            <Button type="submit" className="w-full">
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
