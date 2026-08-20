import { useState } from "react";
import { TradeBlotter } from "@/components/TradeBlotter";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateTradeDialog } from "@/components/CreateTradeDialog";
import { ModeToggle } from "@/components/ModeToggle";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [createOpen, setCreateOpen] = useState(false);

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
            <div className="ml-auto">
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
  );
}

export default App;
