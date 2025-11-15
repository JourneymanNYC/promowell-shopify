import { ShopifyService } from "../client"
import { ShopifyWebhookService } from "../webhooks"

interface SyncResult {
  success: boolean
  ordersSynced: number
  errors: string[]
  startDate: string
  endDate: string
}

export class OrdersSyncService {
  /**
   * Sync historical orders for a shop
   * @param admin - Shopify admin API instance
   * @param shopDomain - Shop domain (e.g., 'mystore.myshopify.com')
   * @param daysBack - Number of days to sync back (default: 60)
   * @returns SyncResult with summary of sync operation
   */
  static async syncHistoricalOrders(
    admin: any,
    shopDomain: string,
    daysBack: number = 60
  ): Promise<SyncResult> {
    const errors: string[] = []
    let ordersSynced = 0
    
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log(`Starting historical order sync for ${shopDomain}`)
      console.log(`Date range: ${startDateStr} to ${endDateStr}`)
      
      // Build query for date range
      const queryString = `created_at:>=${startDateStr}`
      
      let hasNextPage = true
      let cursor: string | undefined = undefined
      // Using a fixed page size of 50 in the GraphQL query
      
      while (hasNextPage) {
        try {
          const query = `
            query getOrders($after: String, $search: String) {
              orders(first: 250, after: $after, query: $search) {
                edges {
                  node {
                    id
                    name
                    sourceName
                    app { id }
                    currencyCode
                    createdAt
                    updatedAt
                    totalPriceSet { shopMoney { amount currencyCode } }
                    subtotalPriceSet { shopMoney { amount currencyCode } }
                    totalTaxSet { shopMoney { amount currencyCode } }
                    totalDiscountsSet { shopMoney { amount currencyCode } }
                    discountApplications(first: 250) {
                      edges {
                        node {
                          __typename
                          ... on DiscountCodeApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            value {
                              __typename
                              ... on MoneyV2 { amount currencyCode }
                              ... on PricingPercentageValue { percentage }
                            }
                            code
                          }
                          ... on ManualDiscountApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            value {
                              __typename
                              ... on MoneyV2 { amount currencyCode }
                              ... on PricingPercentageValue { percentage }
                            }
                            title
                            description
                          }
                          ... on AutomaticDiscountApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            value {
                              __typename
                              ... on MoneyV2 { amount currencyCode }
                              ... on PricingPercentageValue { percentage }
                            }
                            title
                          }
                          ... on ScriptDiscountApplication {
                            allocationMethod
                            targetSelection
                            targetType
                            value {
                              __typename
                              ... on MoneyV2 { amount currencyCode }
                              ... on PricingPercentageValue { percentage }
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
                          variant {
                            id
                            title
                            sku
                          }
                          discountAllocations {
                            allocatedAmount { amount currencyCode }
                            discountApplication {
                              __typename
                              ... on DiscountCodeApplication { code }
                              ... on ManualDiscountApplication { title }
                              ... on AutomaticDiscountApplication { title }
                              ... on ScriptDiscountApplication { title }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          `
          
          const result = await ShopifyService.executeQuery(admin, query, {
            after: cursor,
            search: queryString || undefined
          })
          
          if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
          }
          
          const orders = result.data?.orders?.edges?.map((edge: any) => edge.node) || []
          const pageInfo = result.data?.orders?.pageInfo
          
          console.log(`Fetched ${orders.length} orders (batch)`)
          
          // Process each order
          for (const order of orders) {
            try {
              // Transform order data to webhook format
              const webhookPayload = this.transformOrderToWebhookFormat(order)
              
              // Store in Supabase using existing webhook handler
              await ShopifyWebhookService.handleOrderCreated(webhookPayload, shopDomain)
              ordersSynced++
            } catch (orderError) {
              const errorMsg = `Failed to sync order ${order.name}: ${orderError instanceof Error ? orderError.message : 'Unknown error'}`
              console.error(errorMsg)
              errors.push(errorMsg)
            }
          }
          
          // Update pagination
          hasNextPage = pageInfo?.hasNextPage || false
          cursor = pageInfo?.endCursor
          
          // Small delay to respect rate limits
          if (hasNextPage) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          
        } catch (batchError) {
          const errorMsg = `Batch fetch error: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
          console.error(errorMsg)
          errors.push(errorMsg)
          hasNextPage = false // Stop on critical error
        }
      }
      
      console.log(`Historical sync completed: ${ordersSynced} orders synced`)
      
      return {
        success: errors.length === 0 || ordersSynced > 0,
        ordersSynced,
        errors,
        startDate: startDateStr,
        endDate: endDateStr
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Historical sync failed: ${errorMsg}`)
      
      return {
        success: false,
        ordersSynced,
        errors: [errorMsg, ...errors],
        startDate: '',
        endDate: ''
      }
    }
  }
  
  /**
   * Transform GraphQL order data to webhook payload format
   */
  private static transformOrderToWebhookFormat(order: any): any {
    // Extract discount applications
    const discountApplications = order.discountApplications?.edges?.map((edge: any) => {
      const node = edge.node
      // Add __typename based on the fields present
      let typename = 'DiscountCodeApplication'
      if (node.title && !node.code) {
        if (node.description) {
          typename = 'ManualDiscountApplication'
        } else {
          typename = 'AutomaticDiscountApplication'
        }
      }
      
      return {
        __typename: typename,
        ...node
      }
    }) || []
    
    // Extract line items
    const lineItems = order.lineItems?.edges?.map((edge: any) => edge.node) || []
    
    const money = (m: any | undefined) => (m?.shopMoney?.amount ?? m?.amount ?? null);
    return {
      id: order.id,
      name: order.name,
      source_name: order.sourceName,
      app_id: order.app?.id ? parseInt(String(order.app.id).split('/').pop() || '0', 10) : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      totalPrice: money(order.totalPriceSet),
      subtotalPrice: money(order.subtotalPriceSet),
      totalTax: money(order.totalTaxSet),
      totalDiscounts: money(order.totalDiscountsSet),
      currencyCode: order.currencyCode,
      discountApplications,
      lineItems
    }
  }
}

