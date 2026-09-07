import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <PackageSearch
        size={64}
        className="text-muted-foreground"
      />

      <h1 className="text-3xl font-bold">
        Página no encontrada
      </h1>

      <p className="max-w-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
        Revisa la dirección o regresa al inicio.
      </p>

      <Link href="/dashboard">
        <Button className="mt-2">
          Volver al Dashboard
        </Button>
      </Link>
    </div>
  );
}