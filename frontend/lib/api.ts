import type { Order, OrderItem, OrderStatus, Client } from "./data"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ---------------------------------------------------------------------------
// Backend response types
// ---------------------------------------------------------------------------

interface BackendOrder {
  order_id: number
  order_number: string
  customer_id: number | null
  customer_company_name: string
  order_date: string
  status: string
  items: BackendOrderItem[]
  subtotal: string | number
  tax: string | number
  shipping_cost: string | number
  discount: string | number
  total_amount: string | number
  order_source: string | null
  ai_confidence_score: string | number | null
  has_warnings: boolean
  original_message?: string | null
  warnings?: BackendWarning[] | null
  requires_human_review?: boolean
  created_at: string
}

interface BackendOrderItem {
  sku: string
  product_name: string
  quantity: number
  unit_price: number | string
  line_total: number | string
}

interface BackendWarning {
  type: string
  message: string
  severity: string
}

interface BackendCustomer {
  customer_id: number
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  payment_terms: string
  shipping_preference: string | null
  order_count: number
  total_lifetime_value: string | number
}

interface BackendAnalyticsSummary {
  total_orders: number
  total_revenue: string | number
  avg_order_value: string | number
  orders_by_status: Record<string, number>
  error_count: number
}

interface BackendTopProduct {
  sku: string
  product_name: string
  total_qty: number
  total_revenue: string | number
}

interface ProcessOrderResponse {
  order_id: number
  order_number: string
  customer_company_name: string
  status: string
  items: BackendOrderItem[]
  subtotal: string | number
  tax: string | number
  total_amount: string | number
  has_warnings: boolean
  warnings: BackendWarning[]
  requires_human_review: boolean
  ai_confidence_score: string | number | null
  order_date: string
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapStatus(backendStatus: string): OrderStatus {
  switch (backendStatus) {
    case "completed":
      return "completed"
    case "processing":
      return "processing"
    case "review_needed":
      return "review"
    case "error":
      return "error"
    case "pending":
      return "processing"
    case "cancelled":
      return "error"
    default:
      return "processing"
  }
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 12) return `${diffWeeks}w ago`
  return date.toLocaleDateString()
}

function mapOrder(bo: BackendOrder): Order {
  const amount = Number(bo.total_amount)
  const itemCount = bo.items?.length ?? 0
  const parsedItems: OrderItem[] = (bo.items ?? []).map((item) => ({
    sku: item.sku,
    product: item.product_name,
    qty: item.quantity,
    price: Number(item.unit_price),
    total: Number(item.line_total),
  }))

  const warningText =
    bo.warnings && bo.warnings.length > 0
      ? bo.warnings.map((w) => w.message).join("; ")
      : undefined

  const errorText = bo.status === "error" ? "Order processing failed" : undefined

  return {
    id: bo.order_number,
    customer: bo.customer_company_name,
    amount,
    items: itemCount,
    status: mapStatus(bo.status),
    time: relativeTime(bo.order_date),
    date: bo.order_date.split("T")[0],
    message: bo.original_message ?? undefined,
    warning: bo.has_warnings ? warningText : undefined,
    error: errorText,
    originalText: bo.original_message ?? undefined,
    parsedItems,
    customerId: bo.customer_id ?? undefined,
    orderId: bo.order_id,
  }
}

function mapCustomer(bc: BackendCustomer): Client {
  return {
    id: bc.customer_id.toString(),
    customerId: bc.customer_id,
    name: bc.company_name,
    email: bc.email ?? "",
    phone: bc.phone ?? "",
    industry: bc.payment_terms,
  }
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchCustomers(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/customers`)
  if (!res.ok) throw new Error(`Failed to fetch customers: ${res.status}`)
  const data: BackendCustomer[] = await res.json()
  return data.map(mapCustomer)
}

export async function fetchOrders(params?: {
  customerId?: number
  status?: string
}): Promise<Order[]> {
  const url = new URL(`${API_BASE}/orders`)
  if (params?.customerId) url.searchParams.set("customer_id", String(params.customerId))
  if (params?.status) url.searchParams.set("status_filter", params.status)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`)
  const data: BackendOrder[] = await res.json()
  return data.map(mapOrder)
}

export async function fetchOrderDetail(orderId: number): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`)
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.status}`)
  const data: BackendOrder = await res.json()
  return mapOrder(data)
}

export async function processOrder(params: {
  customerId: number
  sourceType: "voice_message" | "text_file"
  originalMessage: string
}): Promise<ProcessOrderResponse> {
  const res = await fetch(`${API_BASE}/orders/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: params.customerId,
      source_type: params.sourceType,
      original_message: params.originalMessage,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Order processing failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchAnalyticsSummary(customerId?: number): Promise<BackendAnalyticsSummary> {
  const url = new URL(`${API_BASE}/analytics/summary`)
  if (customerId) url.searchParams.set("customer_id", String(customerId))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`)
  return res.json()
}

export async function fetchTopProducts(limit = 8): Promise<BackendTopProduct[]> {
  const url = new URL(`${API_BASE}/analytics/top-products`)
  url.searchParams.set("limit", String(limit))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch top products: ${res.status}`)
  return res.json()
}

export async function updateOrderStatus(
  orderId: number,
  status: string,
  reviewedBy?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reviewed_by: reviewedBy }),
  })
  if (!res.ok) throw new Error(`Failed to update order: ${res.status}`)
}
