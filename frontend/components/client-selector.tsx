"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Client } from "@/lib/data"

interface ClientSelectorProps {
  selectedClient: string
  onClientChange: (name: string) => void
  clients: Client[]
}

export function ClientSelector({
  selectedClient,
  onClientChange,
  clients,
}: ClientSelectorProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Viewing as:
      </span>
      <Select value={selectedClient} onValueChange={onClientChange}>
        <SelectTrigger className="w-64 border-coral-200 focus:ring-coral-400/30">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-coral-400/20 to-rose-500/20 text-xs font-bold text-coral-400">
              {selectedClient.charAt(0)}
            </div>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.name}>
              <div className="flex items-center gap-2">
                <span>{c.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {c.industry}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
