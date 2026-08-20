import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@/components/theme-provider"
import { AgGridReact } from "ag-grid-react"
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberFilterModule,
  DateFilterModule,
  TextFilterModule,
  enableDevValidations,
  themeQuartz,
  type ColDef,
} from "ag-grid-community"
import { RefreshCw, Pencil, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { fetchTrades, cancelTrade } from "@/lib/api"
import { tradeSchema } from "@/lib/validation"
import { getSocket, TRADE_EVENTS } from "@/lib/socket"
import { AmendTradeDialog } from "./AmendTradeDialog"
import { toast } from "sonner"
import type { Trade } from "@/types"

// Register only the modules this grid uses. (v36 API.)
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
])

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

/** Grid context passed to the actions cell renderer. */
interface BlotterContext {
  onAmend: (trade: Trade) => void
  onCancel: (trade: Trade) => void
}

/** Row actions cell renderer. Reads callbacks from grid context. */
function ActionsCell(props: {
  data?: Trade
  context?: BlotterContext
}) {
  const trade = props.data
  const ctx = props.context
  if (!trade || !ctx) return null
  const cancelled = trade.status === "CANCELLED"
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Amend trade"
        disabled={cancelled}
        onClick={() => ctx.onAmend(trade)}
      >
        <Pencil data-icon="inline-start" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Cancel trade"
        disabled={cancelled}
        onClick={() => ctx.onCancel(trade)}
      >
        <Ban data-icon="inline-start" />
      </Button>
    </div>
  )
}

export function TradeBlotter() {
  const queryClient = useQueryClient()
  const { resolvedTheme } = useTheme()
  const { data, isFetching, error, refetch } = useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: fetchTrades,
  })

  const [amendTrade, setAmendTrade] = useState<Trade | null>(null)
  const [amendOpen, setAmendOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Trade | null>(null)

  const onAmend = (trade: Trade) => {
    setAmendTrade(trade)
    setAmendOpen(true)
  }

  const onCancel = (trade: Trade) => {
    setCancelTarget(trade)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    try {
      const cancelled = await cancelTrade(cancelTarget.id)
      toast.success(`Trade ${cancelled.id} cancelled.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed.")
    } finally {
      setCancelTarget(null)
    }
  }

  // Keep the cache in sync with the Socket.IO stream.
  useEffect(() => {
    const socket = getSocket()

    const upsert = (trade: Trade) => {
      const parsed = tradeSchema.safeParse(trade)
      if (!parsed.success) return
      queryClient.setQueryData<Trade[]>(["trades"], (prev) => {
        if (!prev) return [parsed.data]
        const idx = prev.findIndex((t) => t.id === parsed.data.id)
        if (idx === -1) return [parsed.data, ...prev]
        const next = prev.slice()
        next[idx] = parsed.data
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

  const columnDefs = useMemo<ColDef<Trade>[]>(
    () => [
      { field: "id", headerName: "ID", flex: 1, minWidth: 100 },
      { field: "symbol", headerName: "Symbol", flex: 1, minWidth: 100 },
      {
        field: "side",
        headerName: "Side",
        flex: 1,
        minWidth: 90,
        cellClassRules: SIDE_CELL_CLASS_RULES,
        cellClass: "font-semibold",
      },
      {
        field: "quantity",
        headerName: "Qty",
        flex: 1,
        minWidth: 100,
        type: "numericColumn",
        filter: "agNumberColumnFilter",
        valueFormatter: (p) =>
          p.value != null ? new Intl.NumberFormat("en-US").format(p.value) : "",
      },
      {
        field: "price",
        headerName: "Price",
        flex: 1,
        minWidth: 100,
        type: "numericColumn",
        filter: "agNumberColumnFilter",
        valueFormatter: (p) =>
          p.value != null ? currencyFormatter.format(p.value) : "",
      },
      { field: "trader", headerName: "Trader", flex: 1, minWidth: 100 },
      {
        field: "tradeDate",
        headerName: "Trade Date",
        flex: 1.5,
        minWidth: 180,
        filter: "agDateColumnFilter",
        valueFormatter: (p) =>
          p.value ? new Date(p.value as string).toLocaleString("en-US") : "",
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 100,
        cellClassRules: STATUS_CELL_CLASS_RULES,
      },
      {
        headerName: "Actions",
        width: 110,
        sortable: false,
        filter: false,
        cellRenderer: ActionsCell,
        cellClass: "flex items-center",
      },
    ],
    [],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      minWidth: 80,
      filterParams: { buttons: ["apply", "reset"] },
    }),
    [],
  )

  const theme = useMemo(() => themeQuartz, [])

  const context = useMemo<BlotterContext>(
    () => ({ onAmend, onCancel }),
    [],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
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
          <RefreshCw
            data-icon="inline-start"
            className={isFetching ? "animate-spin" : ""}
          />
          Refresh
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load trades</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unknown error."}
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      <div
        className="ag-theme-mode min-h-0 flex-1"
        data-ag-theme-mode={resolvedTheme === "dark" ? "dark" : "light"}
      >
        <AgGridReact<Trade>
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={theme}
          getRowId={(p) => p.data.id}
          context={context}
          animateRows
        />
      </div>
      <AmendTradeDialog
        trade={amendTrade}
        open={amendOpen}
        onOpenChange={setAmendOpen}
      />
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel trade?</AlertDialogTitle>
            <AlertDialogDescription>
              Trade {cancelTarget?.id} will be cancelled. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trade</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmCancel}>
              Cancel trade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
