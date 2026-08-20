import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Trade Blotter</h1>
        <p className="max-w-md text-muted-foreground">
          Real-time equity trade blotter. View, create, amend, and cancel
          trades with live updates.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => navigate({ to: "/login" })}>Sign in</Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/login", search: { mode: "sign-up" } })}
        >
          Create account
        </Button>
      </div>
    </div>
  )
}
