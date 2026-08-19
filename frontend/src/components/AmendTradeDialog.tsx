import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { amendTrade } from "@/lib/api"
import {
  amendTradeSchema,
  toAmendInput,
  type AmendFormValues,
} from "@/lib/validation"
import type { Trade } from "@/types"

function fieldErrors(errors: unknown): Array<{ message?: string } | undefined> {
  return (errors ?? []) as unknown as Array<{ message?: string } | undefined>
}

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

export function AmendTradeDialog({
  trade,
  open,
  onOpenChange,
}: {
  trade: Trade | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [defaults, setDefaults] = useState<AmendFormValues>({})

  useEffect(() => {
    if (trade) setDefaults(tradeToDefaults(trade))
  }, [trade])

  const form = useForm({
    defaultValues: defaults,
    validators: { onChange: amendTradeSchema },
    onSubmit: async ({ value, formApi }) => {
      if (!trade) return
      setSubmitting(true)
      try {
        const updated = await amendTrade(trade.id, toAmendInput(value))
        toast.success(`Trade ${updated.id} amended.`)
        formApi.reset()
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Amend failed.")
      } finally {
        setSubmitting(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Amend trade {trade?.id}</DialogTitle>
          <DialogDescription>
            Update the fields to change. Empty fields keep the current value.
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
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="amend-symbol">Symbol</FieldLabel>
                    <Input
                      id="amend-symbol"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="AAPL"
                    />
                    {isInvalid && <FieldError errors={fieldErrors(field.state.meta.errors)} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="side">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Side</FieldLabel>
                    <Select
                      value={field.state.value ?? ""}
                      onValueChange={(v) => v && field.handleChange(v as "BUY" | "SELL")}
                    >
                      <SelectTrigger className="w-full" aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">BUY</SelectItem>
                        <SelectItem value="SELL">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={fieldErrors(field.state.meta.errors)} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="quantity">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="amend-quantity">Quantity</FieldLabel>
                    <Input
                      id="amend-quantity"
                      inputMode="numeric"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="100"
                    />
                    {isInvalid && <FieldError errors={fieldErrors(field.state.meta.errors)} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="price">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="amend-price">Price</FieldLabel>
                    <Input
                      id="amend-price"
                      inputMode="decimal"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="227.45"
                    />
                    {isInvalid && <FieldError errors={fieldErrors(field.state.meta.errors)} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="trader">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="amend-trader">Trader</FieldLabel>
                    <Input
                      id="amend-trader"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="JSMITH"
                    />
                    {isInvalid && <FieldError errors={fieldErrors(field.state.meta.errors)} />}
                  </Field>
                )
              }}
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
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
