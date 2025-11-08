import { ShopifyService, getShopIdFromDomain } from "../client"
import type { ShopifyOrder, OrdersPageInfo } from "../types"

export class OrderService {
  static async getOrders(admin: any, shopDomain: string, first: number = 10, after?: string, financialStatus?: string, fulfillmentStatus?: string): Promise<{ success: boolean, data?: { orders: ShopifyOrder[], pageInfo: OrdersPageInfo }, error?: string }> {
    try {
      console.log("OrderService.getOrders called with shopDomain:", shopDomain) // Debug log
      
      if (!shopDomain) {
        throw new Error("Shop domain is required")
      }

      const shopId = await getShopIdFromDomain(shopDomain)
      console.log("Shop ID found:", shopId) // Debug log
      
      if (!shopId) {
        // For now, let's continue without the shop ID check since the shop might not be in our database yet
        console.log("Shop not found in database, proceeding with Shopify API call")
      }

      // TODO: Remove fixed page size of 50 in the GraphQL query and transfer to a query
      const query = `
        query getOrders($after: String, $search: String) {
          orders(first: 250, after: $after, query: $search) {
            edges {
              node {
                id
                name
                totalPrice
                subtotalPrice
                totalTax
                totalDiscounts
                currencyCode
                createdAt
                updatedAt
                discountApplications(first: 250) {
                  edges {
                    node {
                      ... on DiscountCodeApplication {
                        allocationMethod
                        targetSelection
                        targetType
                        value {
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                          ... on PricingPercentageValue {
                            percentage
                          }
                        }
                        code
                      }
                      ... on ManualDiscountApplication {
                        allocationMethod
                        targetSelection
                        targetType
                        value {
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                          ... on PricingPercentageValue {
                            percentage
                          }
                        }
                        title
                        description
                      }
                      ... on AutomaticDiscountApplication {
                        allocationMethod
                        targetSelection
                        targetType
                        value {
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                          ... on PricingPercentageValue {
                            percentage
                          }
                        }
                        title
                      }
                      ... on ScriptDiscountApplication {
                        allocationMethod
                        targetSelection
                        targetType
                        value {
                          ... on MoneyV2 {
                            amount
                            currencyCode
                          }
                          ... on PricingPercentageValue {
                            percentage
                          }
                        }
                        title
                      }
                    }
                  }
                }
                lineItems(first: 250) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      sku
                      name
                      variant {
                        id
                        title
                        price
                        sku
                      }
                      originalUnitPrice
                      discountedUnitPrice
                      discountAllocations {
                        allocatedAmount {
                          amount
                          currencyCode
                        }
                        discountApplication {
                          ... on DiscountCodeApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            code
                          }
                          ... on ManualDiscountApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            title
                          }
                          ... on AutomaticDiscountApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            title
                          }
                          ... on ScriptDiscountApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            title
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `

      // Build query string for filtering
      let queryString = ""
      if (financialStatus || fulfillmentStatus) {
        const filters = []
        if (financialStatus) filters.push(`financial_status:${financialStatus}`)
        if (fulfillmentStatus) filters.push(`fulfillment_status:${fulfillmentStatus}`)
        queryString = filters.join(" AND ")
      }

      const result = await ShopifyService.executeQuery(admin, query, { after, search: queryString || undefined })
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
      }

      const orders = result.data?.orders?.edges?.map((edge: any) => edge.node) || []
      
      return {
        success: true,
        data: {
          orders,
          pageInfo: result.data?.orders?.pageInfo
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }
}