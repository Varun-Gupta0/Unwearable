export interface OrderItem {
  slug: string;
  sku?: string;
  quantity: number;
  price?: number;
  selectedSize?: string;
  selectedColorId?: string;
  designId?: string;
  designImageUrl?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode: string;
}

export interface OrderPayload {
  customer: CustomerInfo;
  items: OrderItem[];
  totalOrderValue?: number;
}

export interface QikinkLineItem {
  sku: string;
  quantity: number;
  price: number;
  search_from_my_products: number;
  print_file?: string; // design image URL for custom prints
}

export interface QikinkShippingAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string;
  phone: string;
  email: string;
  city: string;
  zip: number;
  province: string;
  country_code: string;
}

export interface QikinkOrderPayload {
  order_number: string;
  qikink_shipping: number;
  gateway: string;
  total_order_value: number;
  line_items: QikinkLineItem[];
  shipping_address: QikinkShippingAddress;
}
