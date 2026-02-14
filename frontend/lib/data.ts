export type OrderStatus = "completed" | "processing" | "review" | "error"

export interface OrderItem {
  sku: string
  product: string
  qty: number
  price: number
  total: number
}

export interface Order {
  id: string
  customer: string
  amount: number
  items: number
  status: OrderStatus
  time: string
  message?: string
  warning?: string
  error?: string
  email?: string
  phone?: string
  orderHistory?: string
  parsedItems?: OrderItem[]
  originalText?: string
}

export const orders: Order[] = [
  {
    id: "ORD-2140214",
    customer: "Acme Manufacturing",
    amount: 12450,
    items: 7,
    status: "completed",
    time: "2m ago",
    message: "Voice: Hey, need 500 blue widgets and 200 gadget pros",
    email: "orders@acme-mfg.com",
    phone: "+1 (415) 555-0142",
    orderHistory: "5th order this month",
    originalText:
      "Hey, need 500 blue widgets and 200 gadget pros. Same specs as last time. Ship to warehouse B.",
    parsedItems: [
      { sku: "WID-001", product: "Blue Widget", qty: 500, price: 15.5, total: 7750 },
      { sku: "GAD-X", product: "Gadget Pro", qty: 200, price: 23.5, total: 4700 },
    ],
  },
  {
    id: "ORD-2140213",
    customer: "BuildCo",
    amount: 45000,
    items: 12,
    status: "review",
    time: "15m ago",
    warning: "3x usual order size",
    message: "Text: Same as last order but triple everything",
    email: "procurement@buildco.io",
    phone: "+1 (415) 555-0198",
    orderHistory: "3rd order this month",
    originalText: "Same as last order but triple everything. Rush delivery needed by EOW.",
    parsedItems: [
      { sku: "STL-100", product: "Steel Beam A", qty: 300, price: 45.0, total: 13500 },
      { sku: "STL-200", product: "Steel Beam B", qty: 300, price: 52.0, total: 15600 },
      { sku: "BLT-050", product: "Bolt Pack (100)", qty: 150, price: 8.5, total: 1275 },
      { sku: "NUT-050", product: "Nut Pack (100)", qty: 150, price: 6.75, total: 1012.5 },
    ],
  },
  {
    id: "ORD-2140212",
    customer: "TechParts Inc",
    amount: 8200,
    items: 3,
    status: "processing",
    time: "1h ago",
    message: "Voice: Following up on quote request...",
    email: "hello@techparts.co",
    phone: "+1 (650) 555-0177",
    orderHistory: "1st order this month",
    originalText:
      "Following up on quote request from last week. Need 100 circuit boards and 50 sensor modules.",
    parsedItems: [
      { sku: "PCB-200", product: "Circuit Board v2", qty: 100, price: 52.0, total: 5200 },
      { sku: "SNS-100", product: "Sensor Module", qty: 50, price: 60.0, total: 3000 },
    ],
  },
  {
    id: "ORD-2140211",
    customer: "Global Widgets",
    amount: 3890,
    items: 5,
    status: "completed",
    time: "3h ago",
    email: "orders@globalwidgets.com",
    phone: "+1 (212) 555-0134",
    orderHistory: "8th order this month",
    originalText: "Standard reorder of our usual widget package. Deliver next Tuesday.",
    parsedItems: [
      { sku: "WID-001", product: "Blue Widget", qty: 100, price: 15.5, total: 1550 },
      { sku: "WID-002", product: "Red Widget", qty: 80, price: 16.0, total: 1280 },
      { sku: "WID-003", product: "Green Widget", qty: 60, price: 17.67, total: 1060 },
    ],
  },
  {
    id: "ORD-2140210",
    customer: "MegaCorp",
    amount: 0,
    items: 0,
    status: "error",
    time: "5h ago",
    error: "Unable to parse order format",
    email: "supply@megacorp.com",
    phone: "+1 (310) 555-0156",
    orderHistory: "2nd order this month",
    originalText: "[garbled audio - unable to transcribe]",
    parsedItems: [],
  },
]

export function getOrder(id: string): Order | undefined {
  return orders.find((o) => o.id === id)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export const statusConfig: Record<
  OrderStatus,
  { label: string; className: string; icon: string }
> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "check",
  },
  processing: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "loader",
  },
  review: {
    label: "Review",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "alert",
  },
  error: {
    label: "Error",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: "x",
  },
}
