export type GID = string

export interface DiscountApplicationNode {
  // Union of DiscountCodeApplication | ManualDiscountApplication | AutomaticDiscountApplication | ScriptDiscountApplication
  // Keep loose for now; refine as needed per usage sites
  [key: string]: unknown
}

export interface LineItemNode {
  id: GID
  title: string
  quantity: number
  sku: string | null
  name: string
  variant?: { id: GID; title: string; price: string; sku: string | null } | null
  originalUnitPrice: string
  discountedUnitPrice: string
  discountAllocations: any[]
}

export interface ShopifyOrder {
  id: GID
  name: string
  totalPrice: string
  subtotalPrice: string
  totalTax: string
  totalDiscounts: string
  currencyCode: string
  createdAt: string
  updatedAt: string
  discountApplications: DiscountApplicationNode[]
  lineItems: LineItemNode[]
}

export interface OrdersPageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

// Discount types
export interface DiscountCombinesWith {
  orderDiscounts: boolean
  productDiscounts: boolean
  shippingDiscounts: boolean
}

export interface DiscountCustomerGets {
  value?: {
    __typename: 'DiscountAmount' | 'DiscountPercentage' | 'DiscountOnQuantity'
    percentage?: number
    amount?: { amount: string; currencyCode: string }
  }
  items?: {
    __typename: string
    products?: { edges: Array<{ node: { id: GID } }> }
    collections?: { edges: Array<{ node: { id: GID } }> }
    all?: boolean
  }
}

export interface DiscountCode {
  id: GID
  code: string
}

export interface ShopifyDiscount {
  id: GID
  title: string
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED' | 'INACTIVE'
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
  discountClass: 'PRODUCT' | 'ORDER' | 'SHIPPING'
  combinesWith?: DiscountCombinesWith
  asyncUsageCount?: number
  totalSales?: { amount: string; currencyCode: string }
  appliesOncePerCustomer?: boolean
  customerGets?: DiscountCustomerGets
  customerSelection?: {
    __typename: string
    forAllCustomers?: boolean
  }
  codes?: {
    edges: Array<{ node: DiscountCode }>
  }
  summary?: string
}

export interface DiscountsPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}