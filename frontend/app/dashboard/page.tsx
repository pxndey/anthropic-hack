"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { StatsCards } from "@/components/stats-cards"
import { OrdersTable } from "@/components/orders-table"
import { OrderDetailPanel } from "@/components/order-detail-panel"
import type { Order } from "@/lib/data"
import { Heart } from "lucide-react"

export default function DashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage all incoming orders in real time.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Orders Table */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Recent Orders
          </h2>
          <OrdersTable onSelectOrder={setSelectedOrder} />
        </div>
      </main>

      {/* Order Detail Slide-In */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Made with{" "}
          <Heart className="h-3 w-3 text-coral-400 fill-coral-400" /> in SF
        </p>
      </footer>
    </div>
  )
}
