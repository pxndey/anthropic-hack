"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Label,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import type { Order } from "@/lib/data"
import { formatCurrency } from "@/lib/data"
import { countOrdersByStatus } from "@/lib/dashboard-utils"

const pieChartConfig: ChartConfig = {
  completed: { label: "Completed", color: "hsl(160 60% 45%)" },
  processing: { label: "Processing", color: "hsl(38 92% 50%)" },
  review: { label: "Review", color: "hsl(350 70% 60%)" },
  error: { label: "Error", color: "hsl(0 72% 51%)" },
}

const areaChartConfig: ChartConfig = {
  amount: {
    label: "Spent",
    color: "hsl(0 84% 71%)",
  },
}

interface ClientAnalyticsProps {
  orders: Order[]
}

export function ClientAnalytics({ orders: clientOrders }: ClientAnalyticsProps) {
  const statusData = useMemo(
    () => countOrdersByStatus(clientOrders),
    [clientOrders]
  )
  const totalOrders = useMemo(
    () => statusData.reduce((sum, d) => sum + d.count, 0),
    [statusData]
  )

  const spendingData = useMemo(() => {
    const sorted = [...clientOrders].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return sorted.map((o) => ({
      date: new Date(o.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      amount: o.amount,
      id: o.id,
    }))
  }, [clientOrders])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Order Status Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Order Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                outerRadius={100}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={
                      pieChartConfig[
                        entry.status.toLowerCase() as keyof typeof pieChartConfig
                      ]?.color ?? "hsl(var(--muted))"
                    }
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalOrders}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            orders
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {statusData.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      pieChartConfig[
                        entry.status.toLowerCase() as keyof typeof pieChartConfig
                      ]?.color,
                  }}
                />
                <span className="text-muted-foreground">
                  {entry.status} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spending Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Spending Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="h-[280px] w-full">
            <AreaChart
              data={spendingData}
              margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatCurrency(value as number)
                    }
                  />
                }
              />
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-amount)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-amount)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-amount)"
                fill="url(#spendGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
