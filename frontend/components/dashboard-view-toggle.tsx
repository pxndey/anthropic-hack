"use client"

import { motion } from "framer-motion"
import { Briefcase, User } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "employee" | "client"

const viewOptions: { value: ViewMode; label: string; icon: typeof Briefcase }[] = [
  { value: "employee", label: "Employee", icon: Briefcase },
  { value: "client", label: "Client", icon: User },
]

interface DashboardViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function DashboardViewToggle({
  viewMode,
  onViewModeChange,
}: DashboardViewToggleProps) {
  return (
    <div className="relative flex rounded-full border border-border bg-muted/50 p-1">
      {viewOptions.map((opt) => {
        const isActive = viewMode === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onViewModeChange(opt.value)}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        )
      })}
      <motion.div
        className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-coral-400 to-rose-500"
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        style={{
          left: viewMode === "employee" ? "4px" : "calc(50%)",
          width: "calc(50% - 4px)",
        }}
      />
    </div>
  )
}
