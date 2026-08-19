import { useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  enableDevValidations,
  themeQuartz,
  type ColDef,
} from "ag-grid-community"
import type { Trade } from "@/types"

// Register community modules once. (v36 API.)
ModuleRegistry.registerModules([AllCommunityModule])

// Dev-only validations: human-readable console errors for misconfig.
if (import.meta.env.DEV) {
  enableDevValidations()
}

const SIDE_CELL_CLASS_RULES: Record<string, (p: { value: string }) => boolean> = {
  "text-emerald-600 dark:text-emerald-400": (p) => p.value === "BUY",
  "text-red-600 dark:text-red-400": (p) => p.value === "SELL",
}

const STATUS_CELL_CLASS_RULES: Record<string, (p: { value: string }) => boolean> = {
  "text-emerald-600 dark:text-emerald-400": (p) => p.value === "ACTIVE",
  "text-muted-foreground": (p) => p.value === "CANCELLED",
}

// Step 7 will replace this with live API data.
const PLACEHOLDER_TRADES: Trade[] = []

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const columnDefs: ColDef<Trade>[] = [
  { field: "id",         headerName: "ID",         width: 120 },
  { field: "symbol",     headerName: "Symbol",     width: 110 },
  {
    field: "side",
    headerName: "Side",
    width: 90,
    cellClassRules: SIDE_CELL_CLASS_RULES,
    cellClass: "font-semibold",
  },
  {
    field: "quantity",
    headerName: "Qty",
    width: 100,
    type: "numericColumn",
    valueFormatter: (p) =>
      p.value != null ? new Intl.NumberFormat("en-US").format(p.value) : "",
  },
  {
    field: "price",
    headerName: "Price",
    width: 110,
    type: "numericColumn",
    valueFormatter: (p) =>
      p.value != null ? currencyFormatter.format(p.value) : "",
  },
  { field: "trader",     headerName: "Trader",     width: 110 },
  {
    field: "tradeDate",
    headerName: "Trade Date",
    width: 200,
    valueFormatter: (p) =>
      p.value ? new Date(p.value as string).toLocaleString("en-US") : "",
  },
  {
    field: "status",
    headerName: "Status",
    width: 150,
    cellClassRules: STATUS_CELL_CLASS_RULES,
  },
]

export function TradeBlotter() {
  const [rowData] = useState<Trade[]>(PLACEHOLDER_TRADES)

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
    }),
    [],
  )

  const theme = useMemo(() => themeQuartz, [])

  return (
    <div className="h-[600px] w-full">
      <AgGridReact<Trade>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        theme={theme}
        getRowId={(p) => p.data.id}
        animateRows
      />
    </div>
  )
}
