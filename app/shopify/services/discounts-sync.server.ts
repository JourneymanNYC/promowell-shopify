import { DiscountService } from "./discounts.server"
import { ShopifyWebhookService } from "../webhooks"

interface SyncResult {
  success: boolean
  discountsSynced: number
  codeDiscountsSynced: number
  automaticDiscountsSynced: number
  errors: string[]
  startDate: string
  endDate: string
}

export class DiscountsSyncService {
  /**
   * Sync historical discounts for a shop (both code and automatic)
   * @param admin - Shopify admin API instance
   * @param shopDomain - Shop domain (e.g., 'mystore.myshopify.com')
   * @param daysBack - Number of days to sync back (default: 365, discounts are long-lived)
   * @returns SyncResult with summary of sync operation
   */
  static async syncHistoricalDiscounts(
    admin: any,
    shopDomain: string,
    daysBack: number = 365
  ): Promise<SyncResult> {
    const errors: string[] = []
    let codeDiscountsSynced = 0
    let automaticDiscountsSynced = 0
    
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log(`Starting historical discount sync for ${shopDomain}`)
      console.log(`Date range: ${startDateStr} to ${endDateStr}`)
      
      // Sync code discounts
      try {
        codeDiscountsSynced = await this.syncCodeDiscounts(admin, shopDomain, errors)
        console.log(`Code discounts synced: ${codeDiscountsSynced}`)
      } catch (codeError) {
        const errorMsg = `Failed to sync code discounts: ${codeError instanceof Error ? codeError.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
      
      // Sync automatic discounts
      try {
        automaticDiscountsSynced = await this.syncAutomaticDiscounts(admin, shopDomain, errors)
        console.log(`Automatic discounts synced: ${automaticDiscountsSynced}`)
      } catch (autoError) {
        const errorMsg = `Failed to sync automatic discounts: ${autoError instanceof Error ? autoError.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
      
      const totalSynced = codeDiscountsSynced + automaticDiscountsSynced
      console.log(`Historical sync completed: ${totalSynced} discounts synced (${codeDiscountsSynced} code, ${automaticDiscountsSynced} automatic)`)
      
      return {
        success: errors.length === 0 || totalSynced > 0,
        discountsSynced: totalSynced,
        codeDiscountsSynced,
        automaticDiscountsSynced,
        errors,
        startDate: startDateStr,
        endDate: endDateStr
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Historical sync failed: ${errorMsg}`)
      
      return {
        success: false,
        discountsSynced: 0,
        codeDiscountsSynced,
        automaticDiscountsSynced,
        errors: [errorMsg, ...errors],
        startDate: '',
        endDate: ''
      }
    }
  }
  
  /**
   * Sync code discounts with pagination
   */
  private static async syncCodeDiscounts(
    admin: any,
    shopDomain: string,
    errors: string[]
  ): Promise<number> {
    let synced = 0
    let hasNextPage = true
    let cursor: string | undefined = undefined
    
    while (hasNextPage) {
      try {
        const result = await DiscountService.getCodeDiscounts(admin, shopDomain, 250, cursor)
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch code discounts')
        }
        
        const { discounts, pageInfo } = result.data
        console.log(`Fetched ${discounts.length} code discounts (batch)`)
        
        // Process each discount
        for (const discount of discounts) {
          try {
            // Transform discount data to webhook format
            const webhookPayload = this.transformDiscountToWebhookFormat(discount, false)
            
            // Store in Supabase using webhook handler
            await ShopifyWebhookService.handleDiscountCreated(webhookPayload, shopDomain)
            synced++
          } catch (discountError) {
            const errorMsg = `Failed to sync code discount ${discount.title || discount.id}: ${discountError instanceof Error ? discountError.message : 'Unknown error'}`
            console.error(errorMsg)
            errors.push(errorMsg)
          }
        }
        
        // Update pagination
        hasNextPage = pageInfo?.hasNextPage || false
        cursor = pageInfo?.endCursor || undefined
        
        // Small delay to respect rate limits
        if (hasNextPage) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (batchError) {
        const errorMsg = `Code discount batch fetch error: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
        hasNextPage = false // Stop on critical error
      }
    }
    
    return synced
  }
  
  /**
   * Sync automatic discounts with pagination
   */
  private static async syncAutomaticDiscounts(
    admin: any,
    shopDomain: string,
    errors: string[]
  ): Promise<number> {
    let synced = 0
    let hasNextPage = true
    let cursor: string | undefined = undefined
    
    while (hasNextPage) {
      try {
        const result = await DiscountService.getAutomaticDiscounts(admin, shopDomain, 250, cursor)
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to fetch automatic discounts')
        }
        
        const { discounts, pageInfo } = result.data
        console.log(`Fetched ${discounts.length} automatic discounts (batch)`)
        
        // Process each discount
        for (const discount of discounts) {
          try {
            // Transform discount data to webhook format
            const webhookPayload = this.transformDiscountToWebhookFormat(discount, true)
            
            // Store in Supabase using webhook handler
            await ShopifyWebhookService.handleDiscountCreated(webhookPayload, shopDomain)
            synced++
          } catch (discountError) {
            const errorMsg = `Failed to sync automatic discount ${discount.title || discount.id}: ${discountError instanceof Error ? discountError.message : 'Unknown error'}`
            console.error(errorMsg)
            errors.push(errorMsg)
          }
        }
        
        // Update pagination
        hasNextPage = pageInfo?.hasNextPage || false
        cursor = pageInfo?.endCursor || undefined
        
        // Small delay to respect rate limits
        if (hasNextPage) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (batchError) {
        const errorMsg = `Automatic discount batch fetch error: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
        hasNextPage = false // Stop on critical error
      }
    }
    
    return synced
  }
  
  /**
   * Transform GraphQL discount data to webhook payload format
   */
  private static transformDiscountToWebhookFormat(discount: any, isAutomatic: boolean): any {
    // Determine discount type and class
    const typename = discount.__typename || ''
    // Map to allowed values per shopify_discounts_raw_discount_type_check
    // Allowed: 'basic_amount', 'basic_percentage', 'bxgy', 'free_shipping', 'automatic', 'app', 'fixed_amount', 'percentage'
    let discountType = 'basic'
    let discountClass: 'product' | 'order' | 'shipping' = 'product'
    
    if (typename.includes('Basic')) {
      // We'll decide amount vs percentage below based on value type
      discountType = 'basic'
      discountClass = 'product'
    } else if (typename.includes('Bxgy') || typename.includes('BuyXGetY')) {
      discountType = 'bxgy'
      discountClass = 'product'
    } else if (typename.includes('FreeShipping')) {
      discountType = 'free_shipping'
      discountClass = 'shipping'
    } else if (typename.includes('App')) {
      discountType = 'app'
      discountClass = 'product'
    }
    
    // Extract codes (for code discounts only)
    const codes = discount.codes?.edges?.map((edge: any) => edge.node.code) || []
    const primaryCode = codes[0] || null
    
    // Extract customer selection
    let customerSelection = 'all'
    const prerequisiteCustomers: any[] = []
    if (discount.customerSelection) {
      if (discount.customerSelection.__typename === 'DiscountCustomerAll' || 
          discount.customerSelection.allCustomers) {
        customerSelection = 'all'
      } else if (discount.customerSelection.__typename === 'DiscountCustomerSegments') {
        customerSelection = 'prerequisite'
        if (discount.customerSelection.segments) {
          prerequisiteCustomers.push(...discount.customerSelection.segments.map((s: any) => ({ id: s.id, name: s.name })))
        }
      }
    }
    
    // Extract entitled products and collections
    const entitledProducts: string[] = []
    const entitledCollections: string[] = []
    
    if (discount.customerGets?.items) {
      const items = discount.customerGets.items
      if (items.products?.edges) {
        entitledProducts.push(...items.products.edges.map((e: any) => e.node.id))
      }
      if (items.collections?.edges) {
        entitledCollections.push(...items.collections.edges.map((e: any) => e.node.id))
      }
    }
    
    // Extract discount value
    let valueType = 'percentage'
    let valueAmount = null
    let valuePercentage = null
    
    if (discount.customerGets?.value) {
      const value = discount.customerGets.value
      if (value.__typename === 'DiscountAmount' && value.amount) {
        valueType = 'fixed_amount'
        valueAmount = parseFloat(value.amount.amount)
      } else if (value.__typename === 'DiscountPercentage') {
        valueType = 'percentage'
        valuePercentage = parseFloat(value.percentage)
      }
    }
    
    // Extract combinesWith
    const combinesWith = discount.combinesWith || {}
    
    // Extract minimum requirement
    let minimumRequirement = null
    let minimumAmount = null
    if (discount.minimumRequirement) {
      const minReq = discount.minimumRequirement
      if (minReq.__typename === 'DiscountMinimumSubtotal' && minReq.greaterThanOrEqualToSubtotal) {
        minimumRequirement = 'subtotal'
        minimumAmount = parseFloat(minReq.greaterThanOrEqualToSubtotal.amount)
      } else if (minReq.__typename === 'DiscountMinimumQuantity') {
        minimumRequirement = 'quantity'
        minimumAmount = parseFloat(minReq.greaterThanOrEqualToQuantity)
      }
    }
    
    // Extract destination countries (for free shipping)
    const entitledCountries: string[] = []
    if (discount.destinationSelection) {
      if (discount.destinationSelection.countries) {
        entitledCountries.push(...discount.destinationSelection.countries)
      }
    }
    
    const payload = {
      id: discount.id,
      title: discount.title,
      summary: discount.summary || null,
      status: discount.status,
      discountType,
      discountClass,
      isAutomatic,
      code: primaryCode,
      codes,
      codesCount: codes.length,
      valueType,
      valueAmount,
      valuePercentage,
      usageLimit: discount.usageLimit || null,
      asyncUsageCount: discount.asyncUsageCount || 0,
      totalSales: discount.totalSales?.amount ? parseFloat(discount.totalSales.amount) : 0,
      appliesOncePerCustomer: discount.appliesOncePerCustomer || false,
      startsAt: discount.startsAt,
      endsAt: discount.endsAt,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
      customerSelection,
      prerequisiteCustomers,
      entitledProducts,
      entitledCollections,
      entitledCountries,
      combinesWithOrderDiscounts: combinesWith.orderDiscounts || false,
      combinesWithProductDiscounts: combinesWith.productDiscounts || false,
      combinesWithShippingDiscounts: combinesWith.shippingDiscounts || false,
      minimumRequirement,
      minimumAmount,
      // Store full raw data for complete preservation
      rawData: discount
    }

    // Adjust discountType to satisfy DB constraint
    if (payload.discountClass === 'shipping') {
      payload.discountType = 'free_shipping'
    } else if (discountType === 'basic') {
      // Map based on valueType
      if (payload.valueType === 'fixed_amount') payload.discountType = 'basic_amount'
      else if (payload.valueType === 'percentage') payload.discountType = 'basic_percentage'
    }

    return payload
  }
}

