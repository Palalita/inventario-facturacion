'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  Users,
  Boxes,
  FileText,
  Shield,
  User,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';

const navLinks = [
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
    href: '/profile',
    label: 'Mi perfil',
    icon: User,
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
  }, [pathname, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!checked) {
    return null;
  }

  const visibleLinks = navLinks.filter(
    (link) => !link.adminOnly || role === 'ADMIN'
  );

  const sidebarContent = (
    <>
      <div className="mb-6 flex items-center justify-between px-2">
        <p className="text-lg font-bold">Mi Inventario</p>

        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() =>
          setTheme(theme === 'dark' ? 'light' : 'dark')
        }
        className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
      >
        {theme === 'dark' ? (
          <Sun size={16} />
        ) : (
          <Moon size={16} />
        )}

        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barra superior solo en móvil */}
      <div className="flex items-center justify-between border-b bg-background p-4 md:hidden">
        <p className="text-lg font-bold">Mi Inventario</p>

        <button onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar de escritorio */}
      <aside className="hidden w-56 shrink-0 border-r bg-background p-4 md:block">
        {sidebarContent}
      </aside>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-64 bg-background p-4 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}