"use client"

import { motion } from "framer-motion"
import {
  BarChart3,
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  Heart,
} from "lucide-react"

const stats = [
  {
    label: "Total Orders",
    value: "1,284",
    icon: BarChart3,
    trend: null,
    extra: "0 errors today",
    extraIcon: Heart,
  },
  {
    label: "Revenue (7d)",
    value: "$184,520",
    icon: DollarSign,
    trend: "+12.5%",
    extra: null,
    extraIcon: null,
  },
  {
    label: "Avg Process Time",
    value: "3.2s",
    icon: Clock,
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

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-coral-400 to-rose-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-coral-400/10">
              <stat.icon className="h-4.5 w-4.5 text-coral-400" />
            </div>
          </div>
          {stat.trend && (
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              {stat.trend} from last week
            </div>
          )}
          {stat.extra && (
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-coral-400">
              {stat.extraIcon && <stat.extraIcon className="h-3 w-3 fill-coral-400" />}
              {stat.extra}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
