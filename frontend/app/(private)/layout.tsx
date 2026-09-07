'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes'; import { Moon, Sun } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Users,
  Boxes,
  FileText,
  Shield,
  User,
} from 'lucide-react';

const navLinks = [

    {
    href: '/profile',
    label: 'Mi perfil',
    icon: User,
    adminOnly: false,
  },

  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    href: '/products',
    label: 'Productos',
    icon: Package,
    adminOnly: false,
  },
  {
    href: '/customers',
    label: 'Clientes',
    icon: Users,
    adminOnly: false,
  },
  {
    href: '/inventory',
    label: 'Inventario',
    icon: Boxes,
    adminOnly: false,
  },
  {
    href: '/invoices',
    label: 'Facturas',
    icon: FileText,
    adminOnly: false,
  },
  {
    href: '/team',
    label: 'Usuarios',
    icon: Shield,
    adminOnly: true,
  },
];

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    const user = userRaw ? JSON.parse(userRaw) : null;

    setRole(user?.role || null);

    if (pathname === '/team' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    setChecked(true);
  }, [pathname]);

  if (!checked) return null;

  const visibleLinks = navLinks.filter(
    (link) => !link.adminOnly || role === 'ADMIN'
  );

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-background p-4">
        <p className="mb-6 px-2 text-lg font-bold">
          Mi Inventario
        </p>

        <nav className="flex flex-col gap-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
               className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${ active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent' }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>
         <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"> {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} </button>
      </aside>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
