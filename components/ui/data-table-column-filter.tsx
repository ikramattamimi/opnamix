import * as React from "react"
import { Column } from "@tanstack/react-table"
import { Input } from "./input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

interface DataTableColumnFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options?: {
    label: string
    value: string
  }[]
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableColumnFilterProps<TData, TValue>) {
  const filterValue = column?.getFilterValue()

  if (!column) {
    return null
  }

  // If options are provided, render a select dropdown
  if (options && options.length > 0) {
    return (
      <Select
        value={(filterValue as string) ?? "all"}
        onValueChange={(value) => {
          column.setFilterValue(value === "all" ? undefined : value)
        }}
      >
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder={title} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Otherwise, render a text input
  return (
    <Input
      placeholder={title ? `Filter ${title}...` : "Filter..."}
      value={(filterValue as string) ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-8 w-full"
    />
  )
}
