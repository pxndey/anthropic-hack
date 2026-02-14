import type { Order, OrderStatus } from "./data"
import { formatCurrency } from "./data"
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Zap,
  ShoppingBag,
  CheckCircle,
  Heart,
} from "lucide-react"

export interface StatItem {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend: string | null
  extra: string | null
  extraIcon: React.ComponentType<{ className?: string }> | null
}

export function computeEmployeeStats(orders: Order[]): StatItem[] {
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const errorCount = orders.filter((o) => o.status === "error").length

  return [
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: BarChart3,
      trend: null,
      extra: `${errorCount} error${errorCount !== 1 ? "s" : ""} today`,
      extraIcon: Heart,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      trend: "+12.5%",
      extra: null,
      extraIcon: null,
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(avgOrderValue),
      icon: TrendingUp,
      trend: null,
      extra: null,
      extraIcon: null,
    },
    {
      label: "Automation Rate",
      value: "94%",
      icon: Zap,
      trend: "+2.1%",
      extra: null,
      extraIcon: null,
    },
  ]
}

export function computeClientStats(orders: Order[]): StatItem[] {
  const count = orders.length
  const totalSpent = orders.reduce((sum, o) => sum + o.amount, 0)
  const avgSize = count > 0 ? totalSpent / count : 0
  const completedRate =
    count > 0
      ? Math.round(
          (orders.filter((o) => o.status === "completed").length / count) * 100
        )
      : 0

  return [
    {
      label: "My Orders",
      value: count.toString(),
      icon: ShoppingBag,
      trend: null,
      extra: null,
      extraIcon: null,
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      trend: null,
      extra: null,
      extraIcon: null,
    },
    {
      label: "Avg Order Size",
      value: formatCurrency(avgSize),
      icon: TrendingUp,
      trend: null,
      extra: null,
      extraIcon: null,
    },
    {
      label: "Success Rate",
      value: `${completedRate}%`,
      icon: CheckCircle,
      trend: null,
      extra: null,
      extraIcon: null,
    },
  ]
}

export function aggregateProductDemand(
  orders: Order[]
): { product: string; qty: number; revenue: number }[] {
  const productMap = new Map<
    string,
    { product: string; qty: number; revenue: number }
  >()
  for (const order of orders) {
    for (const item of order.parsedItems ?? []) {
      const existing = productMap.get(item.sku) ?? {
        product: item.product,
        qty: 0,
        revenue: 0,
      }
      existing.qty += item.qty
      existing.revenue += item.total
      productMap.set(item.sku, existing)
    }
  }
  return Array.from(productMap.values()).sort((a, b) => b.qty - a.qty)
}

export function countOrdersByStatus(
  orders: Order[]
): { status: string; count: number; fill: string }[] {
  const statusColors: Record<OrderStatus, string> = {
    completed: "var(--color-completed)",
    processing: "var(--color-processing)",
    review: "var(--color-review)",
    error: "var(--color-error)",
  }

  const counts = new Map<OrderStatus, number>()
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    fill: statusColors[status],
  }))
}

export function groupOrdersByMonth(
  orders: Order[]
): { month: string; revenue: number; count: number }[] {
  const monthMap = new Map<string, { revenue: number; count: number }>()

  for (const order of orders) {
    const date = new Date(order.date)
    const monthKey = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
    const existing = monthMap.get(monthKey) ?? { revenue: 0, count: 0 }
    existing.revenue += order.amount
    existing.count += 1
    monthMap.set(monthKey, existing)
  }

  const sorted = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const parseDate = (m: string) => new Date(`1 ${m}`)
      return parseDate(a.month).getTime() - parseDate(b.month).getTime()
    })

  return sorted
}
