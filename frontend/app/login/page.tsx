'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAuth((s) => s.login);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      router.push('/dashboard');
    } catch {
      setError('Credenciales inválidas');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow">
        <h1 className="text-xl font-bold">Iniciar sesión</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input className="w-full rounded border px-3 py-2" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Contraseña"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded bg-black py-2 text-white">Entrar</button>
      </form>
    </div>
  );
}