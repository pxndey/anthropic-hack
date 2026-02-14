"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { StatsCards } from "@/components/stats-cards"
import { OrdersTable } from "@/components/orders-table"
import { OrderDetailPanel } from "@/components/order-detail-panel"
import { DashboardViewToggle } from "@/components/dashboard-view-toggle"
import { ClientSelector } from "@/components/client-selector"
import { EmployeeAnalytics } from "@/components/employee-analytics"
import { ClientAnalytics } from "@/components/client-analytics"
import type { Order } from "@/lib/data"
import { orders, clients, getOrdersForClient } from "@/lib/data"
import { computeEmployeeStats, computeClientStats } from "@/lib/dashboard-utils"
import { Heart } from "lucide-react"

type ViewMode = "employee" | "client"

export default function DashboardPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("employee")
  const [selectedClient, setSelectedClient] = useState(clients[0].name)

  const clientOrders = useMemo(
    () => getOrdersForClient(selectedClient),
    [selectedClient]
  )

  const employeeStats = useMemo(() => computeEmployeeStats(orders), [])
  const clientStats = useMemo(
    () => computeClientStats(clientOrders),
    [clientOrders]
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header + Toggle */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {viewMode === "employee"
                ? "Track and manage all incoming orders in real time."
                : "Your orders and analytics at a glance."}
            </p>
          </div>
          <DashboardViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Client Selector (client view only) */}
        <AnimatePresence>
          {viewMode === "client" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ClientSelector
                selectedClient={selectedClient}
                onClientChange={setSelectedClient}
                clients={clients}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode === "employee" ? "emp-stats" : `client-stats-${selectedClient}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StatsCards
                stats={viewMode === "employee" ? employeeStats : clientStats}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Analytics Charts */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Analytics
          </h2>
          <AnimatePresence mode="wait">
            {viewMode === "employee" ? (
              <motion.div
                key="emp-analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <EmployeeAnalytics />
              </motion.div>
            ) : (
              <motion.div
                key={`client-analytics-${selectedClient}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ClientAnalytics clientName={selectedClient} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Orders Table */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {viewMode === "employee"
              ? "All Orders"
              : `Orders for ${selectedClient}`}
          </h2>
          <OrdersTable
            orders={viewMode === "employee" ? orders : clientOrders}
            onSelectOrder={setSelectedOrder}
          />
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
