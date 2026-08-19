import { TradeBlotter } from "@/components/TradeBlotter"
import { CreateTradeForm } from "@/components/CreateTradeForm"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Trade Blotter</h1>
        <p className="text-muted-foreground">
          Real-time equity trade blotter. Vite + React + shadcn + AG Grid.
        </p>
      </header>
      <CreateTradeForm />
      <TradeBlotter />
      <Toaster richColors position="top-right" />
    </main>
  )
}

export default App
