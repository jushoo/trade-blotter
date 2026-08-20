import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { TradeBlotter } from "@/components/TradeBlotter"
import { AppSidebar } from "@/components/AppSidebar"
import { CreateTradeDialog } from "@/components/CreateTradeDialog"
import { ModeToggle } from "@/components/ModeToggle"
import { Button } from "@/components/ui/button"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { signOut, useSession } from "@/lib/auth-client"
import { disconnectSocket } from "@/lib/socket"

export function DashboardPage() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!session) disconnectSocket()
  }, [session])

  const handleSignOut = async () => {
    await signOut()
    disconnectSocket()
    navigate({ to: "/" })
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar onCreate={() => setCreateOpen(true)} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <SidebarTrigger />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight">
                Trade Blotter
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time equity trade blotter.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {session?.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
              <ModeToggle />
            </div>
          </header>
          <div className="mx-auto flex min-h-0 w-full max-w-[75%] flex-1 flex-col gap-6 p-4 md:p-8">
            <TradeBlotter />
          </div>
        </SidebarInset>
        <CreateTradeDialog open={createOpen} onOpenChange={setCreateOpen} />
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </TooltipProvider>
  )
}
