import { useState } from "react"
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
import { createTrade } from "@/lib/api"
import {
  createTradeSchema,
  createFormDefaults,
  toCreateInput,
} from "@/lib/validation"

function fieldErrors(errors: unknown): Array<{ message?: string } | undefined> {
  return (errors ?? []) as unknown as Array<{ message?: string } | undefined>
}

export function CreateTradeForm() {
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Create failed.")
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
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Create trade</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <form.Field name="symbol">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="create-symbol">Symbol</FieldLabel>
                <Input
                  id="create-symbol"
                  value={field.state.value}
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
                  value={field.state.value}
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
                <FieldLabel htmlFor="create-quantity">Quantity</FieldLabel>
                <Input
                  id="create-quantity"
                  inputMode="numeric"
                  value={field.state.value}
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
                <FieldLabel htmlFor="create-price">Price</FieldLabel>
                <Input
                  id="create-price"
                  inputMode="decimal"
                  value={field.state.value}
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
                <FieldLabel htmlFor="create-trader">Trader</FieldLabel>
                <Input
                  id="create-trader"
                  value={field.state.value}
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

      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create trade"}
        </Button>
      </div>
    </form>
  )
}
