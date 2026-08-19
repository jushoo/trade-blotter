import { useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AgGridReact } from "ag-grid-react"
import {
  AllCommunityModule,
  ModuleRegistry,
  enableDevValidations,
  themeQuartz,
  type ColDef,
} from "ag-grid-community"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchTrades } from "@/lib/api"
import { getSocket, TRADE_EVENTS } from "@/lib/socket"
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
    filter: "agNumberColumnFilter",
    valueFormatter: (p) =>
      p.value != null ? new Intl.NumberFormat("en-US").format(p.value) : "",
  },
  {
    field: "price",
    headerName: "Price",
    width: 110,
    type: "numericColumn",
    filter: "agNumberColumnFilter",
    valueFormatter: (p) =>
      p.value != null ? currencyFormatter.format(p.value) : "",
  },
  { field: "trader",     headerName: "Trader",     width: 110 },
  {
    field: "tradeDate",
    headerName: "Trade Date",
    width: 200,
    filter: "agDateColumnFilter",
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

const defaultColDef: ColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  minWidth: 80,
}

export function TradeBlotter() {
  const queryClient = useQueryClient()
  const { data, isFetching, refetch } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: fetchTrades,
  })

  // Keep the cache in sync with the Socket.IO stream. A create adds a row;
  // an amend or cancel replaces the row with the same id.
  useEffect(() => {
    const socket = getSocket()

    const upsert = (trade: Trade) => {
      queryClient.setQueryData<Trade[]>(["trades"], (prev) => {
        if (!prev) return [trade]
        const idx = prev.findIndex((t) => t.id === trade.id)
        if (idx === -1) return [trade, ...prev]
        const next = prev.slice()
        next[idx] = trade
        return next
      })
    }

    socket.on(TRADE_EVENTS.CREATED, upsert)
    socket.on(TRADE_EVENTS.AMENDED, upsert)
    socket.on(TRADE_EVENTS.CANCELLED, upsert)

    return () => {
      socket.off(TRADE_EVENTS.CREATED, upsert)
      socket.off(TRADE_EVENTS.AMENDED, upsert)
      socket.off(TRADE_EVENTS.CANCELLED, upsert)
    }
  }, [queryClient])

  const theme = useMemo(() => themeQuartz, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isFetching ? "Loading trades…" : `${data?.length ?? 0} trades`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      <div className="h-[600px] w-full">
        <AgGridReact<Trade>
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={theme}
          getRowId={(p) => p.data.id}
          animateRows
        />
      </div>
    </div>
  )
}
