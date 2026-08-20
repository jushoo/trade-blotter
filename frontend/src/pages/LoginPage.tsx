import { useEffect, useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signUp, useSession } from "@/lib/auth-client"

type Mode = "sign-in" | "sign-up"

export function LoginPage() {
  const search = useSearch({ from: "/login" })
  const navigate = useNavigate()
  const { data: session } = useSession()

  const [mode, setMode] = useState<Mode>(search.mode ?? "sign-in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      navigate({ to: "/dashboard" })
    }
  }, [session, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "sign-in") {
        const { error } = await signIn.email({ email, password })
        if (error) {
          setError(error.message ?? "Sign in failed.")
          return
        }
      } else {
        const { error } = await signUp.email({ email, password, name })
        if (error) {
          setError(error.message ?? "Sign up failed.")
          return
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "sign-in"
              ? "Sign in to the Trade Blotter."
              : "Create an account to use the Trade Blotter."}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "sign-up" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              minLength={8}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <Button type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "sign-in" ? (
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setError(null)
                setMode("sign-up")
              }}
            >
              No account? Create one.
            </button>
          ) : (
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setError(null)
                setMode("sign-in")
              }}
            >
              Have an account? Sign in.
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
