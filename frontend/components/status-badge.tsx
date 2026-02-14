"use client"

import { Check, Loader2, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/data"
import { statusConfig } from "@/lib/data"

const iconMap = {
  check: Check,
  loader: Loader2,
  alert: AlertTriangle,
  x: X,
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status]
  const Icon = iconMap[config.icon as keyof typeof iconMap]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      <Icon
        className={cn("h-3 w-3", status === "processing" && "animate-spin")}
      />
      {config.label}
    </span>
  )
}
