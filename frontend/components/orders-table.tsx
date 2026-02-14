"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  MoreHorizontal,
  Eye,
  Download,
  Archive,
  FileText,
  Heart,
} from "lucide-react"
import {
  type Order,
  type OrderStatus,
  orders as allOrders,
  formatCurrency,
} from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const filterOptions: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Processing", value: "processing" },
  { label: "Review", value: "review" },
  { label: "Error", value: "error" },
]

interface OrdersTableProps {
  onSelectOrder: (order: Order) => void
}

export function OrdersTable({ onSelectOrder }: OrdersTableProps) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [search, setSearch] = useState("")

  const filtered = allOrders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false
    if (
      search &&
      !o.customer.toLowerCase().includes(search.toLowerCase()) &&
      !o.id.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-coral-400/30 focus:border-coral-400 sm:w-72"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                filter === opt.value
                  ? "border-coral-400 bg-coral-400/10 text-coral-400"
                  : "border-border bg-card text-muted-foreground hover:border-coral-300 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="hidden border-b border-border bg-muted/30 px-6 py-3 md:grid md:grid-cols-12 md:gap-4">
          <div className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Order ID
          </div>
          <div className="col-span-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer
          </div>
          <div className="col-span-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Items
          </div>
          <div className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Amount
          </div>
          <div className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </div>
          <div className="col-span-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Time
          </div>
          <div className="col-span-1" />
        </div>

        {/* Rows */}
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-8 w-8 text-coral-300" />
                <FileText className="h-8 w-8 text-coral-300" />
              </div>
              <p className="text-sm text-muted-foreground">
                No orders found. Your customers will love how fast you respond.
              </p>
            </motion.div>
          ) : (
            filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectOrder(order)}
                className="cursor-pointer border-b border-border last:border-0 px-6 py-4 transition-colors hover:bg-secondary/50 md:grid md:grid-cols-12 md:items-center md:gap-4"
              >
                {/* Mobile layout */}
                <div className="flex items-center justify-between md:hidden mb-2">
                  <span className="font-mono text-sm font-semibold text-coral-400">
                    {order.id}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between md:hidden mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-coral-400/20 to-rose-500/20 text-xs font-bold text-coral-400">
                      {order.customer.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {order.customer}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(order.amount)}
                  </span>
                </div>

                {/* Desktop layout */}
                <div className="col-span-2 hidden md:block">
                  <span className="font-mono text-sm font-semibold text-coral-400">
                    {order.id}
                  </span>
                </div>
                <div className="col-span-3 hidden items-center gap-3 md:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-coral-400/20 to-rose-500/20 text-xs font-bold text-coral-400">
                    {order.customer.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {order.customer}
                  </span>
                </div>
                <div className="col-span-1 hidden md:block">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {order.items} items
                  </span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(order.amount)}
                  </span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <StatusBadge status={order.status} />
                </div>
                <div className="col-span-1 hidden md:block">
                  <span className="text-xs text-muted-foreground">
                    {order.time}
                  </span>
                </div>
                <div className="col-span-1 hidden justify-end md:flex">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Order actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOrder(order)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
