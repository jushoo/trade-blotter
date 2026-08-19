import { useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  enableDevValidations,
  themeQuartz,
  type ColDef,
} from "ag-grid-community"

// Register community modules once. (v36 API.)
ModuleRegistry.registerModules([AllCommunityModule])

// Dev-only validations: human-readable console errors for misconfig.
if (import.meta.env.DEV) {
  enableDevValidations()
}

/** A single equity trade row. */
export interface Trade {
  tradeId: string
  symbol: string
  side: "Buy" | "Sell"
  quantity: number
  price: number
  status: "New" | "PartiallyFilled" | "Filled" | "Cancelled" | "Rejected"
  trader: string
  executedAt: string // ISO timestamp
}

const SIDE_CELL_CLASS_RULES: Record<string, (p: { value: string }) => boolean> = {
  "text-emerald-600 dark:text-emerald-400": (p) => p.value === "Buy",
  "text-red-600 dark:text-red-400": (p) => p.value === "Sell",
}

const STATUS_CELL_CLASS_RULES: Record<string, (p: { value: string }) => boolean> = {
  "text-emerald-600 dark:text-emerald-400": (p) => p.value === "Filled",
  "text-amber-600 dark:text-amber-400": (p) => p.value === "PartiallyFilled",
  "text-muted-foreground": (p) =>
    p.value === "Cancelled" || p.value === "Rejected",
}

const SAMPLE_TRADES: Trade[] = [
  { tradeId: "T-1001", symbol: "AAPL",  side: "Buy",  quantity: 100,  price: 224.31, status: "Filled",          trader: "j.doe",   executedAt: "2025-08-19T14:02:11Z" },
  { tradeId: "T-1002", symbol: "MSFT",  side: "Sell", quantity: 50,   price: 431.10, status: "PartiallyFilled", trader: "a.lee",   executedAt: "2025-08-19T14:05:48Z" },
  { tradeId: "T-1003", symbol: "NVDA",  side: "Buy",  quantity: 200,  price: 128.45, status: "New",             trader: "j.doe",   executedAt: "2025-08-19T14:10:02Z" },
  { tradeId: "T-1004", symbol: "TSLA",  side: "Sell", quantity: 75,   price: 201.18, status: "Rejected",        trader: "m.kim",   executedAt: "2025-08-19T14:12:30Z" },
  { tradeId: "T-1005", symbol: "AMZN",  side: "Buy",  quantity: 120,  price: 175.92, status: "Filled",          trader: "a.lee",   executedAt: "2025-08-19T14:15:09Z" },
  { tradeId: "T-1006", symbol: "GOOGL", side: "Sell", quantity: 30,   price: 162.04, status: "Cancelled",       trader: "m.kim",   executedAt: "2025-08-19T14:18:44Z" },
]

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const columnDefs: ColDef<Trade>[] = [
  { field: "tradeId",   headerName: "Trade ID",   width: 120 },
  { field: "symbol",    headerName: "Symbol",     width: 110 },
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
  {
    field: "status",
    headerName: "Status",
    width: 150,
    cellClassRules: STATUS_CELL_CLASS_RULES,
  },
  { field: "trader",    headerName: "Trader",     width: 110 },
  {
    field: "executedAt",
    headerName: "Executed At",
    width: 200,
    valueFormatter: (p) =>
      p.value ? new Date(p.value as string).toLocaleString("en-US") : "",
  },
]

export function TradeBlotter() {
  const [rowData] = useState<Trade[]>(SAMPLE_TRADES)

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
        getRowId={(p) => p.data.tradeId}
        animateRows
      />
    </div>
  )
}
