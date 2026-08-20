import { useState } from "react"
import { toast } from "sonner"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TradeTextField, TradeSideField } from "@/components/TradeFields"
import { amendTrade } from "@/lib/api"
import {
  amendTradeSchema,
  toAmendInput,
  type AmendFormValues,
} from "@/lib/validation"
import type { Trade } from "@/types"

/** Build amend form defaults from a trade. Numbers are stringified for the
 * string-based form fields. */
function tradeToDefaults(trade: Trade): AmendFormValues {
  return {
    symbol: trade.symbol,
    side: trade.side,
    quantity: String(trade.quantity),
    price: String(trade.price),
    trader: trade.trader,
  }
}

function AmendForm({
  trade,
  onDone,
}: {
  trade: Trade
  onDone: () => void
}) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    defaultValues: tradeToDefaults(trade),
    validators: { onChange: amendTradeSchema },
    onSubmit: async ({ value }) => {
      setSubmitting(true)
      try {
        const updated = await amendTrade(trade.id, toAmendInput(value))
        toast.success(`Trade ${updated.id} amended.`)
        onDone()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Amend failed.")
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <form.Field name="symbol">
          {(field) => (
            <TradeTextField
              id="amend-symbol"
              label="Symbol"
              placeholder="AAPL"
              field={field}
            />
          )}
        </form.Field>

        <form.Field name="side">
          {(field) => <TradeSideField id="amend-side" field={field} />}
        </form.Field>

        <form.Field name="quantity">
          {(field) => (
            <TradeTextField
              id="amend-quantity"
              label="Quantity"
              placeholder="100"
              inputMode="numeric"
              field={field}
            />
          )}
        </form.Field>

        <form.Field name="price">
          {(field) => (
            <TradeTextField
              id="amend-price"
              label="Price"
              placeholder="227.45"
              inputMode="decimal"
              field={field}
            />
          )}
        </form.Field>

        <form.Field name="trader">
          {(field) => (
            <TradeTextField
              id="amend-trader"
              label="Trader"
              placeholder="JSMITH"
              field={field}
            />
          )}
        </form.Field>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={onDone}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AmendTradeDialog({
  trade,
  open,
  onOpenChange,
}: {
  trade: Trade | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Amend trade {trade?.id}</DialogTitle>
          <DialogDescription>
            Update the fields to change. Empty fields keep the current value.
          </DialogDescription>
        </DialogHeader>
        {trade && (
          <AmendForm
            key={trade.id}
            trade={trade}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
