'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchX, FileX } from 'lucide-react';
import {
    FileText,
    Download,
    Plus,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

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

const TAX_RATE = 0.12;

export default function InvoicesPage() {
   const [invoices, setInvoices] = useState<any[]>(
    []
); 
const [loading, setLoading] = useState(true);

    const [customers, setCustomers] = useState<any[]>(
        [],
    );

    const [products, setProducts] = useState<any[]>(
        [],
    );

    const [customerId, setCustomerId] =
        useState('');

    const [items, setItems] = useState<
        {
            productId: string;
            quantity: string;
        }[]
    >([
        {
            productId: '',
            quantity: '1',
        },
    ]);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
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

    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch =
            inv.number.toLowerCase().includes(search.toLowerCase()) ||
            (inv.customer?.name || '')
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === 'ALL' ||
            inv.status === statusFilter;

        const matchesDate = isWithinDateFilter(inv.createdAt);

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredInvoices.length / pageSize)
    );

    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, dateFilter]);

async function loadData() 
{ 
    const [invRes, custRes, prodRes] = await Promise.all([ api.get('/invoices'), api.get('/customers'), api.get('/products'), ]); 
    setInvoices(invRes.data);
     setCustomers(custRes.data); 
     setProducts(prodRes.data); 
     setLoading(false); }

    

    useEffect(() => {
        loadData();
    }, []);


    function addItem() {
        setItems([
            ...items,
            {
                productId: '',
                quantity: '1',
            },
        ]);
    }

    function updateItem(
        index: number,
        field: 'productId' | 'quantity',
        value: string,
    ) {
        const updated = [...items];

        updated[index][field] = value;

        setItems(updated);
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    const subtotal = items.reduce(
        (sum, item) => {
            const product = products.find(
                (p) =>
                    p.id === Number(item.productId),
            );

            if (!product) return sum;

            return (
                sum +
                Number(product.price) *
                Number(item.quantity || 0)
            );
        },
        0,
    );

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!customerId) {
            toast.error('Selecciona un cliente');
            return;
        }

        const validItems = items.filter(
            (item) => item.productId && item.quantity,
        );

        if (validItems.length === 0) {
            toast.error('Agrega al menos un producto');
            return;
        }
        try {
            await api.post('/invoices',
                {
                    customerId: Number(customerId), items: items.filter((i) => i.productId && i.quantity)
                        .map((i) => ({
                            productId: Number(i.productId), quantity: Number(i.quantity)

                        })),
                });
            setCustomerId('');
            setItems([{ productId: '', quantity: '1' }]);
            loadData();
            toast.success('Factura creada correctamente');
        }
        catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al crear factura');
        }
    }

    async function downloadPdf(invoiceId: number) {
        const response = await api.get(
            `/invoices/${invoiceId}/pdf`,
            {
                responseType: 'blob',
            },
        );

        const url = window.URL.createObjectURL(
            new Blob([response.data]),
        );

        const link = document.createElement('a');

        link.href = url;
        link.setAttribute(
            'download',
            `factura-${invoiceId}.pdf`,
        );

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);
    }
    async function updateStatus(invoiceId: number, status: string) {
        await api.patch(`/invoices/${invoiceId}/status`,
            {
                status
            });
        loadData();
    }

    return (
        <div className="p-8">
            <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <FileText size={22} />
                Facturas
            </h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-base">
                        Nueva factura
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-2xl space-y-3"
                    >
                        <select
                            className="h-9 w-full rounded-md border px-2 text-sm"
                            value={customerId}
                            onChange={(e) =>
                                setCustomerId(
                                    e.target.value,
                                )
                            }
                        >
                            <option value="">
                                Selecciona un cliente
                            </option>

                            {customers.map((c) => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                >
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {items.map(
                            (item, index) => (
                                <div
                                    key={index}
                                    className="flex gap-2"
                                >
                                    <select
                                        className="h-9 flex-1 rounded-md border px-2 text-sm"
                                        value={
                                            item.productId
                                        }
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                'productId',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Producto
                                        </option>

                                        {products.map(
                                            (p) => (
                                                <option
                                                    key={p.id}
                                                    value={p.id}
                                                >
                                                    {p.name} - Q
                                                    {Number(
                                                        p.price,
                                                    ).toFixed(2)}
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <input
                                        type="number"
                                        min="1"
                                        className="h-9 w-20 rounded-md border px-2 text-sm"
                                        value={
                                            item.quantity
                                        }
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                'quantity',
                                                e.target.value,
                                            )
                                        }
                                    />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            removeItem(index)
                                        }
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            ),
                        )}

                        <Button
                            type="button"
                            variant="link"
                            onClick={addItem}
                            className="gap-1 px-0"
                        >
                            <Plus size={14} />
                            Agregar producto
                        </Button>

                        <div className="border-t pt-2 text-sm">
                            <p>
                                Subtotal: Q
                                {subtotal.toFixed(2)}
                            </p>

                            <p>
                                Impuesto (12%): Q
                                {tax.toFixed(2)}
                            </p>

                            <p className="font-bold">
                                Total: Q
                                {total.toFixed(2)}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full gap-2"
                        >
                            <FileText size={16} />
                            Crear factura
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <div className="mb-4 flex flex-wrap gap-3">
                        <div className="relative max-w-xs flex-1">
                            <Search
                                size={16}
                                className="absolute left-2.5 top-2.5 text-gray-400"
                            />

                            <input
                                placeholder="Buscar por número o cliente..."
                                className="h-9 w-full rounded-md border pl-8 pr-2 text-sm"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />
                        </div>

                        <select
                            className="h-9 rounded-md border px-2 text-sm"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <option value="ALL">
                                Todos los estados
                            </option>

                            <option value="PENDING">
                                Pendiente
                            </option>

                            <option value="PAID">
                                Pagada
                            </option>

                            <option value="CANCELLED">
                                Anulada
                            </option>
                        </select>
                        <select className="h-9 rounded-md border px-2 text-sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} >
                            <option value="TODAY">Hoy</option> <option value="WEEK">Últimos 7 días</option>
                            <option value="MONTH">Este mes</option> <option value="ALL">Todas las fechas</option>
                        </select>
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
                                    Número
                                </TableHead>

                                <TableHead>
                                    Cliente
                                </TableHead>

                                <TableHead>
                                    Total
                                </TableHead>

                                <TableHead>
                                    Estado
                                </TableHead>

                                <TableHead>
                                    Fecha
                                </TableHead>

                                <TableHead>
                                    PDF
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginatedInvoices.map(
                                (inv) => (
                                    <TableRow
                                        key={inv.id}
                                    >
                                        <TableCell>
                                            {inv.number}
                                        </TableCell>

                                        <TableCell>
                                            {
                                                inv.customer
                                                    ?.name
                                            }
                                        </TableCell>

                                        <TableCell>
                                            Q
                                            {Number(
                                                inv.total,
                                            ).toFixed(2)}
                                        </TableCell>

                                        <TableCell>
                                            <select
                                                value={
                                                    inv.status
                                                }
                                                onChange={(e) =>
                                                    updateStatus(
                                                        inv.id,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`rounded border px-1 py-0.5 text-xs ${inv.status ===
                                                    'PAID'
                                                    ? 'text-green-600'
                                                    : inv.status ===
                                                        'CANCELLED'
                                                        ? 'text-red-600'
                                                        : 'text-yellow-600'
                                                    }`}
                                            >
                                                <option value="PENDING">
                                                    Pendiente
                                                </option>

                                                <option value="PAID">
                                                    Pagada
                                                </option>

                                                <option value="CANCELLED">
                                                    Anulada
                                                </option>
                                            </select>
                                        </TableCell>

                                        <TableCell>
                                            {new Date(
                                                inv.createdAt,
                                            ).toLocaleDateString()}
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="gap-1 px-0"
                                                onClick={() =>
                                                    downloadPdf(
                                                        inv.id,
                                                    )
                                                }
                                            >
                                                <Download
                                                    size={14}
                                                />
                                                PDF
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ),
                            )}
                            {paginatedInvoices.length === 0 && ( 
                                <TableRow> 
                                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground"> 
                                    {search || statusFilter !== 'ALL' || dateFilter !== 'ALL' ? 
                                    ( 
                                    <SearchX className="mx-auto mb-2" size={28} /> 
                                    ) : (
                                     <FileX className="mx-auto mb-2" size={28} /> )} {search || statusFilter !== 'ALL' || dateFilter !== 'ALL' ? 'No se encontraron facturas con esos filtros' : 'Aún no has creado ninguna factura'} 
                                     </TableCell> 
                                     </TableRow> )}
                        </TableBody>

                    </Table>
                    )}
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">
                            {filteredInvoices.length} factura(s) — página {currentPage} de{' '}
                            {totalPages}
                        </p>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === 1}
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                            >
                                <ChevronLeft size={16} />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1)
                                    )
                                }
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
