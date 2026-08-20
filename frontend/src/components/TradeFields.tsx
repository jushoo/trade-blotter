import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

/** Minimal structural types for TanStack FieldApi so this module stays
 * decoupled from the form library's generic types. */
export interface TextFieldApi {
  state: {
    value: string | undefined
    meta: { isTouched: boolean; isValid: boolean; errors: unknown }
  }
  handleBlur: () => void
  handleChange: (value: string) => void
}

export interface SideFieldApi {
  state: {
    value: string | undefined
    meta: { isTouched: boolean; isValid: boolean; errors: unknown }
  }
  handleChange: (value: "BUY" | "SELL") => void
}

function fieldErrors(errors: unknown): Array<{ message?: string } | undefined> {
  return (errors ?? []) as unknown as Array<{ message?: string } | undefined>
}

export function TradeTextField({
  field,
  id,
  label,
  placeholder,
  inputMode,
}: {
  field: TextFieldApi
  id: string
  label: string
  placeholder: string
  inputMode?: "numeric" | "decimal"
}) {
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        inputMode={inputMode}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
      />
      {isInvalid && <FieldError errors={fieldErrors(field.state.meta.errors)} />}
    </Field>
  )
}

export function TradeSideField({
  field,
  id,
}: {
  field: SideFieldApi
  id: string
}) {
  const isInvalid =
    field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>Side</FieldLabel>
      <Select
        value={field.state.value ?? ""}
        onValueChange={(v) => v && field.handleChange(v as "BUY" | "SELL")}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={isInvalid}>
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
}
