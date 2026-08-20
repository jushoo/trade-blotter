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
import { createTrade } from "@/lib/api"
import {
  createTradeSchema,
  createFormDefaults,
  toCreateInput,
} from "@/lib/validation"

export function CreateTradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    defaultValues: createFormDefaults,
    validators: { onChange: createTradeSchema },
    onSubmit: async ({ value, formApi }) => {
      setSubmitting(true)
      try {
        const trade = await createTrade(toCreateInput(value))
        toast.success(`Trade ${trade.id} created.`)
        formApi.reset()
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Create failed.")
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create trade</DialogTitle>
          <DialogDescription>
            Enter the trade details. All fields are required.
          </DialogDescription>
        </DialogHeader>
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
                  id="create-symbol"
                  label="Symbol"
                  placeholder="AAPL"
                  field={field}
                />
              )}
            </form.Field>

            <form.Field name="side">
              {(field) => <TradeSideField id="create-side" field={field} />}
            </form.Field>

            <form.Field name="quantity">
              {(field) => (
                <TradeTextField
                  id="create-quantity"
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
                  id="create-price"
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
                  id="create-trader"
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
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create trade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
