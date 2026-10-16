import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTableColumnFilter } from "./ui/data-table-column-filter"
import { Button } from "./ui/button"

// Type options for filter
const typeOptions = [
    { label: "Masuk", value: "masuk" },
    { label: "Keluar", value: "keluar" },
]

const sourceOptions = [
    { label: "Pembelian", value: "PEMBELIAN" },
    { label: "Kasir Langsung", value: "KASIR_LANGSUNG" },
    { label: "Pengajuan Nakes", value: "PENGAJUAN_NAKES" },
]

const statusOptions = [
    { label: "Menunggu", value: "Menunggu" },
    { label: "Selesai", value: "Selesai" },
]

const formatSource = (source?: string) => {
    const match = sourceOptions.find((option) => option.value === source)
    if (match) {
        return match.label
    }

    return source?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "-"
}

interface TransactionReportColumnsProps {
    onViewDetail: (transaction: any) => void
}

export const createTransactionReportColumns = ({
    onViewDetail,
}: TransactionReportColumnsProps): ColumnDef<any>[] => [
    {
        accessorKey: "date",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Tanggal
                    </div>
                    <DataTableColumnFilter column={column} title="Tanggal" />
                </div>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("date"))
            return (
                <div className="text-text-primary-light dark:text-white">
                    {date.toLocaleString('id-ID', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })}
                </div>
            )
        },
    },
    {
        accessorKey: "id",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Nomor Ref
                    </div>
                    <DataTableColumnFilter column={column} title="Nomor" />
                </div>
            )
        },
        cell: ({ row }) => (
            <div className="font-medium text-text-primary-light dark:text-white">
                {row.getValue("id")}
            </div>
        ),
    },
    {
        accessorKey: "type",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Tipe
                    </div>
                    <DataTableColumnFilter
                        column={column}
                        title="Tipe"
                        options={typeOptions}
                    />
                </div>
            )
        },
        cell: ({ row }) => {
            const type = row.getValue("type") as string
            return (
                <div className="text-center">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${type === "masuk"
                                ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                            }`}
                    >
                        {type === "masuk" ? "Masuk" : "Keluar"}
                    </span>
                </div>
            )
        },
        filterFn: (row, id, value) => {
            return value === undefined || value === "all" || row.getValue(id) === value
        },
    },
    {
        accessorKey: "patient",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Nama Pasien / Supplier
                    </div>
                    <DataTableColumnFilter column={column} title="Nama" />
                </div>
            )
        },
        cell: ({ row }) => {
            const rowType = row.getValue("type") as string
            const label = rowType === "masuk" ? "Supplier" : "Pasien"
            return (
                <div className="text-text-primary-light dark:text-white">
                    {label}: {row.getValue("patient") || "-"}
                </div>
            )
        },
    },
    {
        accessorKey: "source",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Sumber
                    </div>
                    <DataTableColumnFilter
                        column={column}
                        title="Sumber"
                        options={sourceOptions}
                    />
                </div>
            )
        },
        cell: ({ row }) => (
            <div className="text-text-primary-light dark:text-white">
                {formatSource(row.getValue("source"))}
            </div>
        ),
        filterFn: (row, id, value) => {
            return value === undefined || value === "all" || row.getValue(id) === value
        },
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Status
                    </div>
                    <DataTableColumnFilter
                        column={column}
                        title="Status"
                        options={statusOptions}
                    />
                </div>
            )
        },
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            const isPending = status === "Menunggu"

            return (
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        isPending
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                            : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                    }`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${isPending ? "bg-yellow-500" : "bg-green-500"}`}></span>
                    {status}
                </span>
            )
        },
        filterFn: (row, id, value) => {
            return value === undefined || value === "all" || row.getValue(id) === value
        },
    },
    {
        accessorKey: "birthDate",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Tanggal Lahir
                    </div>
                    <DataTableColumnFilter column={column} title="Tanggal Lahir" />
                </div>
            )
        },
        cell: ({ row }) => {
            const date = row.getValue("birthDate") ? new Date(row.getValue("birthDate")) : null
            return (
                <div className="text-text-primary-light dark:text-white">
                    {date ? date.toLocaleString('id-ID', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }) : "-"}
                </div>
            )
        },
    },
    {
        accessorKey: "nakes",
        header: ({ column }) => {
            return (
                <div className="space-y-2">
                    <div className="font-bold text-text-primary-light dark:text-white">
                        Nakes
                    </div>
                    <DataTableColumnFilter column={column} title="Nakes" />
                </div>
            )
        },
        cell: ({ row }) => (
            <div className="text-text-primary-light dark:text-white">
                {row.getValue("nakes") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "items",
        header: () => (
            <div className="font-bold text-text-primary-light dark:text-white">
                Obat
            </div>
        ),
        cell: ({ row }) => (
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-md truncate">
                {row.getValue("items") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "services",
        header: () => (
            <div className="font-bold text-text-primary-light dark:text-white">
                Jasa
            </div>
        ),
        cell: ({ row }) => (
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark max-w-md truncate">
                {row.getValue("services") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "serviceFee",
        header: () => (
            <div className="font-bold text-text-primary-light dark:text-white text-right">
                Biaya Layanan
            </div>
        ),
        cell: ({ row }) => {
            const serviceFee = parseFloat(row.getValue("serviceFee") || "0")
            return (
                <div className="text-right text-text-primary-light dark:text-white">
                    {serviceFee > 0 ? `Rp ${serviceFee.toLocaleString("id-ID")}` : "-"}
                </div>
            )
        },
    },
    {
        accessorKey: "discount",
        header: () => (
            <div className="font-bold text-text-primary-light dark:text-white text-right">
                Diskon
            </div>
        ),
        cell: ({ row }) => {
            const discount = parseFloat(row.getValue("discount") || "0")
            return (
                <div className="text-right">
                    {discount > 0 ? (
                        <span className="font-semibold text-red-500">- Rp {discount.toLocaleString("id-ID")}</span>
                    ) : (
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">-</span>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "total",
        header: () => (
            <div className="font-bold text-text-primary-light dark:text-white text-right">
                Total
            </div>
        ),
        cell: ({ row }) => {
            const total = parseFloat(row.getValue("total") || "0")
            const formatted = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(total)
            return (
                <div className="font-bold text-text-primary-light dark:text-white text-right">
                    {formatted}
                </div>
            )
        },
    },
    {
        id: "actions",
        header: () => (
            <div className="font-bold text-text-primary-light dark:text-white text-center">
                Aksi
            </div>
        ),
        cell: ({ row }) => (
            <div className="flex justify-center">
                <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs font-bold"
                    onClick={() => onViewDetail(row.original)}
                >
                    Detail
                </Button>
            </div>
        ),
    },
]
