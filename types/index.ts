// Shared types for the Northstar Dashboard

export interface Order {
  order_id: string;
  customer_name: string;
  status: string;
  placed_at: string;
  delivered_at: string | null;
}

export interface OrderItem {
  item_id: string;
  product_name: string;
  final_sale: boolean;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface ReturnVerdict {
  eligible: boolean;
  reason: string;
}

export interface ReturnEntry {
  id: string;
  orderId: string;
  productName: string;
  status: string;
  amount: string;
  requestedDate: string;
  refundedDate: string | null;
  reason: string;
  condition: string;
}
