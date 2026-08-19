import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTrade } from "@/lib/api"
import type { CreateTradeInput, Trade } from "@/types"

type Side = Trade["side"]

const EMPTY = {
  symbol: "",
  side: "" as Side | "",
  quantity: "",
  price: "",
  trader: "",
}

/** Parse and validate the form. Returns the input or a map of field errors. */
function validate(
  form: typeof EMPTY,
): { ok: true; data: CreateTradeInput } | { ok: false; errors: Partial<Record<keyof typeof EMPTY, string>> } {
  const errors: Partial<Record<keyof typeof EMPTY, string>> = {}

  const symbol = form.symbol.trim()
  if (!symbol) errors.symbol = "Symbol is required."
  else if (symbol.length > 16) errors.symbol = "Symbol must be 16 chars or fewer."

  if (!form.side) errors.side = "Select a side."

  const quantity = Number(form.quantity)
  if (!form.quantity.trim()) errors.quantity = "Quantity is required."
  else if (!Number.isInteger(quantity) || quantity <= 0)
    errors.quantity = "Quantity must be a positive integer."

  const price = Number(form.price)
  if (!form.price.trim()) errors.price = "Price is required."
  else if (!Number.isFinite(price) || price <= 0)
    errors.price = "Price must be greater than 0."

  const trader = form.trader.trim()
  if (!trader) errors.trader = "Trader is required."
  else if (trader.length > 32) errors.trader = "Trader must be 32 chars or fewer."

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: { symbol, side: form.side as Side, quantity, price, trader },
  }
}

export function CreateTradeForm() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof typeof EMPTY, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = validate(form)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setSubmitting(true)
    try {
      const trade = await createTrade(result.data)
      toast.success(`Trade ${trade.id} created.`)
      setForm(EMPTY)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor="create-symbol">Symbol</Label>
        <Input
          id="create-symbol"
          value={form.symbol}
          onChange={(e) => set("symbol", e.target.value)}
          placeholder="AAPL"
          aria-invalid={!!errors.symbol}
        />
        {errors.symbol && <span className="text-xs text-destructive">{errors.symbol}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <Label>Side</Label>
        <Select value={form.side} onValueChange={(v) => v && set("side", v)}>
          <SelectTrigger className="w-full" aria-invalid={!!errors.side}>
            <SelectValue placeholder="Select side" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BUY">BUY</SelectItem>
            <SelectItem value="SELL">SELL</SelectItem>
          </SelectContent>
        </Select>
        {errors.side && <span className="text-xs text-destructive">{errors.side}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="create-quantity">Quantity</Label>
        <Input
          id="create-quantity"
          inputMode="numeric"
          value={form.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          placeholder="100"
          aria-invalid={!!errors.quantity}
        />
        {errors.quantity && <span className="text-xs text-destructive">{errors.quantity}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="create-price">Price</Label>
        <Input
          id="create-price"
          inputMode="decimal"
          value={form.price}
          onChange={(e) => set("price", e.target.value)}
          placeholder="227.45"
          aria-invalid={!!errors.price}
        />
        {errors.price && <span className="text-xs text-destructive">{errors.price}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="create-trader">Trader</Label>
        <Input
          id="create-trader"
          value={form.trader}
          onChange={(e) => set("trader", e.target.value)}
          placeholder="JSMITH"
          aria-invalid={!!errors.trader}
        />
        {errors.trader && <span className="text-xs text-destructive">{errors.trader}</span>}
      </div>

      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Create trade"}
        </Button>
      </div>
    </form>
  )
}
