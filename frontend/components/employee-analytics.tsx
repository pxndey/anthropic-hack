"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Label,
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
import { orders } from "@/lib/data"
import { aggregateProductDemand, countOrdersByStatus } from "@/lib/dashboard-utils"

const barChartConfig: ChartConfig = {
  qty: {
    label: "Units Ordered",
    color: "hsl(0 84% 71%)",
  },
}

const pieChartConfig: ChartConfig = {
  completed: { label: "Completed", color: "hsl(160 60% 45%)" },
  processing: { label: "Processing", color: "hsl(38 92% 50%)" },
  review: { label: "Review", color: "hsl(350 70% 60%)" },
  error: { label: "Error", color: "hsl(0 72% 51%)" },
}

export function EmployeeAnalytics() {
  const productData = useMemo(() => aggregateProductDemand(orders).slice(0, 8), [])
  const statusData = useMemo(() => countOrdersByStatus(orders), [])
  const totalOrders = useMemo(
    () => statusData.reduce((sum, d) => sum + d.count, 0),
    [statusData]
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Most Popular Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Most Popular Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <BarChart
              data={productData}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                dataKey="product"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="qty" fill="var(--color-qty)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Order Volume by Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Order Volume by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
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
    </div>
  )
}
