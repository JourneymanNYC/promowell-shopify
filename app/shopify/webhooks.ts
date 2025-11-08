import { supabaseAdmin } from '../supabase/client'

export interface WebhookPayload {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  totalPrice: string
  subtotalPrice: string
  totalTax: string
  totalDiscounts?: string
  currencyCode: string
  discountCodes?: string[]
  discountApplications?: any[]
  lineItems?: any[]
}

export class ShopifyWebhookService {
  // Get a minimal Admin GraphQL client for a shop using stored access token
  static async getAdminClient(shopDomain: string): Promise<any | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('shops')
        .select('access_token')
        .eq('shop_domain', shopDomain)
        .single()

      if (error || !data?.access_token) {
        console.error('Unable to get access token for shop:', shopDomain, error)
        return null
      }

      const adminEndpoint = `https://${shopDomain}/admin/api/2025-01/graphql.json`
      const token = data.access_token
      // Minimal client that mimics admin.graphql returning a Response-like object
      const admin = {
        graphql: async (query: string, opts?: { variables?: any }) => {
          const resp = await fetch(adminEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': token
            },
            body: JSON.stringify({ query, variables: opts?.variables || {} })
          })
          return {
            json: async () => await resp.json()
          }
        }
      }
      return admin
    } catch (e) {
      console.error('Error creating admin client for shop:', shopDomain, e)
      return null
    }
  }

  // Fetch full discount node by GID to get GraphQL shape
  static async fetchDiscountNodeByGid(admin: any, gid: string): Promise<any | null> {
    try {
      const query = `
        query getDiscountNode($id: ID!) {
          node(id: $id) {
            __typename
            ... on DiscountCodeNode {
              id
              codeDiscount {
                __typename
                ... on DiscountCodeBasic {
                  title
                  status
                  summary
                  createdAt
                  updatedAt
                  startsAt
                  endsAt
                  appliesOncePerCustomer
                  asyncUsageCount
                  totalSales { amount currencyCode }
                  codes(first: 25) { edges { node { id code } } }
                  customerGets {
                    value { __typename ... on DiscountAmount { amount { amount currencyCode } } ... on DiscountPercentage { percentage } }
                    items {
                      ... on AllDiscountItems { allItems }
                      ... on DiscountProducts { products(first: 250) { edges { node { id } } } }
                      ... on DiscountCollections { collections(first: 250) { edges { node { id } } } }
                    }
                  }
                  customerSelection {
                    __typename
                    ... on DiscountCustomerAll { allCustomers }
                    ... on DiscountCustomerSegments { segments { id name } }
                  }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                  minimumRequirement {
                    __typename
                    ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } }
                    ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity }
                  }
                  usageLimit
                }
                ... on DiscountCodeBxgy {
                  title status summary createdAt updatedAt startsAt endsAt appliesOncePerCustomer asyncUsageCount
                  totalSales { amount currencyCode }
                  codes(first: 25) { edges { node { id code } } }
                  customerBuys {
                    value { __typename ... on DiscountQuantity { quantity } ... on DiscountPurchaseAmount { amount } }
                    items {
                      ... on AllDiscountItems { allItems }
                      ... on DiscountProducts { products(first: 250) { edges { node { id } } } }
                      ... on DiscountCollections { collections(first: 250) { edges { node { id } } } }
                    }
                  }
                  customerGets {
                    value { __typename ... on DiscountOnQuantity { quantity { quantity } effect { ... on DiscountPercentage { percentage } } } }
                    items {
                      ... on AllDiscountItems { allItems }
                      ... on DiscountProducts { products(first: 250) { edges { node { id } } } }
                      ... on DiscountCollections { collections(first: 250) { edges { node { id } } } }
                    }
                  }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                  usageLimit
                }
                ... on DiscountCodeFreeShipping {
                  title status summary createdAt updatedAt startsAt endsAt appliesOncePerCustomer asyncUsageCount
                  totalSales { amount currencyCode }
                  codes(first: 25) { edges { node { id code } } }
                  customerSelection { __typename ... on DiscountCustomerAll { allCustomers } ... on DiscountCustomerSegments { segments { id name } } }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                  minimumRequirement { __typename ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } } ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity } }
                  destinationSelection { __typename ... on DiscountCountryAll { allCountries } ... on DiscountCountries { countries } }
                }
                ... on DiscountCodeApp {
                  title status createdAt updatedAt startsAt endsAt appliesOncePerCustomer asyncUsageCount
                  codes(first: 25) { edges { node { id code } } }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                }
              }
            }
            ... on DiscountAutomaticNode {
              id
              automaticDiscount {
                __typename
                ... on DiscountAutomaticBasic {
                  title
                  status
                  summary
                  createdAt
                  updatedAt
                  startsAt
                  endsAt
                  asyncUsageCount
                  customerGets {
                    value { __typename ... on DiscountAmount { amount { amount currencyCode } } ... on DiscountPercentage { percentage } }
                    items {
                      ... on AllDiscountItems { allItems }
                      ... on DiscountProducts { products(first: 250) { edges { node { id } } } }
                      ... on DiscountCollections { collections(first: 250) { edges { node { id } } } }
                    }
                  }
                  minimumRequirement {
                    __typename
                    ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } }
                    ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity }
                  }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                }
                ... on DiscountAutomaticBxgy {
                  title status summary createdAt updatedAt startsAt endsAt asyncUsageCount
                  customerBuys {
                    value { __typename ... on DiscountQuantity { quantity } ... on DiscountPurchaseAmount { amount } }
                    items {
                      ... on AllDiscountItems { allItems }
                      ... on DiscountProducts { products(first: 250) { edges { node { id } } } }
                      ... on DiscountCollections { collections(first: 250) { edges { node { id } } } }
                    }
                  }
                  customerGets {
                    value { __typename ... on DiscountOnQuantity { quantity { quantity } effect { ... on DiscountPercentage { percentage } } } }
                    items {
                      ... on AllDiscountItems { allItems }
                      ... on DiscountProducts { products(first: 250) { edges { node { id } } } }
                      ... on DiscountCollections { collections(first: 250) { edges { node { id } } } }
                    }
                  }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                }
                ... on DiscountAutomaticFreeShipping {
                  title status summary createdAt updatedAt startsAt endsAt asyncUsageCount
                  minimumRequirement { __typename ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } } ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity } }
                  destinationSelection { __typename ... on DiscountCountryAll { allCountries } ... on DiscountCountries { countries } }
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                }
                ... on DiscountAutomaticApp {
                  title status createdAt updatedAt startsAt endsAt asyncUsageCount
                  combinesWith { orderDiscounts productDiscounts shippingDiscounts }
                }
              }
            }
          }
        }
      `
      const res = await admin.graphql(query, { variables: { id: gid } })
      const data = await res.json()
      if (data?.data?.node?.codeDiscount) {
        return { id: data.data.node.id, codeDiscount: data.data.node.codeDiscount }
      }
      if (data?.data?.node?.automaticDiscount) {
        return { id: data.data.node.id, automaticDiscount: data.data.node.automaticDiscount }
      }
      return null
    } catch (e) {
      console.error('Error fetching discount node by GID:', e)
      return null
    }
  }

  // Fetch full order node by GID to capture discount applications and allocations
  static async fetchOrderNodeByGid(admin: any, gid: string): Promise<any | null> {
    try {
      const query = `
        query getOrder($id: ID!) {
          node(id: $id) {
            __typename
            ... on Order {
              id
              name
              currencyCode
              discountApplications(first: 100) {
                nodes {
                  __typename
                  ... on DiscountCodeApplication {
                    code
                    allocationMethod
                    targetSelection
                    targetType
                    value { __typename ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
                  }
                  ... on AutomaticDiscountApplication {
                    title
                    allocationMethod
                    targetSelection
                    targetType
                  }
                  ... on ManualDiscountApplication {
                    title
                    allocationMethod
                    targetSelection
                    targetType
                    value { __typename ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
                  }
                  ... on ScriptDiscountApplication {
                    title
                    allocationMethod
                    targetSelection
                    targetType
                  }
                }
              }
              lineItems(first: 250) {
                edges {
                  node {
                    id
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
        }
      `
      const res = await admin.graphql(query, { variables: { id: gid } })
      const data = await res.json()
      if (data?.data?.node && data.data.node.__typename === 'Order') {
        return data.data.node
      }
      return null
    } catch (e) {
      console.error('Error fetching order node by GID:', e)
      return null
    }
  }
  // Helper: extract numeric ID from GraphQL GID or return number directly
  static extractShopifyId(gidOrNum: string | number): number {
    if (typeof gidOrNum === 'number') return gidOrNum
    if (typeof gidOrNum === 'string') {
      if (/^\d+$/.test(gidOrNum)) return parseInt(gidOrNum, 10)
      const match = gidOrNum.match(/gid:\/\/shopify\/\w+\/(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    }
    return 0
  }

  // Normalize REST (snake_case) order payload to expected camelCase when GraphQL-like fields are missing
  static normalizeOrderPayload(orderData: any) {
    if (!orderData || typeof orderData !== 'object') return orderData
    // If payload already looks like GraphQL (camelCase), return as-is
    if (orderData.totalPrice !== undefined || orderData.currencyCode !== undefined) return orderData
    return {
      ...orderData,
      id: orderData.id,
      name: orderData.name,
      totalPrice: orderData.total_price,
      subtotalPrice: orderData.subtotal_price,
      totalTax: orderData.total_tax,
      totalDiscounts: orderData.total_discounts ?? orderData.current_total_discounts,
      currencyCode: orderData.currency,
      // Extract channel indicators from REST payload
      channel_source_name: orderData.source_name || null,
      channel_app_id: orderData.app_id || null
    }
  }

  // Helper function to get shop_id from shop domain
  static async getShopIdFromDomain(shopDomain: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('shops')
        .select('id')
        .eq('shop_domain', shopDomain)
        .single()

      if (error || !data) {
        console.error('Error getting shop_id:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error in getShopIdFromDomain:', error)
      return null
    }
  }

  // Handle app uninstalled webhook
  static async handleAppUninstalled(shopDomain: string) {
    try {
      // Get shop_id first
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        console.error(`Shop not found for domain: ${shopDomain}`)
        return
      }

      // Clean up shop data from raw tables
      await supabaseAdmin
        .from('shopify_orders_raw')
        .delete()
        .eq('shop_id', shopId)

      await supabaseAdmin
        .from('shopify_products_raw')
        .delete()
        .eq('shop_id', shopId)

      await supabaseAdmin
        .from('shopify_variants_raw')
        .delete()
        .eq('shop_id', shopId)

      await supabaseAdmin
        .from('shopify_customers_raw')
        .delete()
        .eq('shop_id', shopId)

      await supabaseAdmin
        .from('shopify_discounts_raw')
        .delete()
        .eq('shop_id', shopId)

      // Update shop status to inactive
      await supabaseAdmin
        .from('shops')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', shopId)

      console.log(`Cleaned up data for shop: ${shopDomain}`)
    } catch (error) {
      console.error('Error cleaning up shop data:', error)
      throw error
    }
  }

  // Handle scopes update webhook
  static async handleScopesUpdate(shopDomain: string, scopes: string[]) {
    try {
      // Update shop scopes in database
      await supabaseAdmin
        .from('shops')
        .update({
          scope: scopes,
          updated_at: new Date().toISOString()
        })
        .eq('shop_domain', shopDomain)

      console.log(`Updated scopes for shop: ${shopDomain}`)
    } catch (error) {
      console.error('Error updating shop scopes:', error)
      throw error
    }
  }

  // Handle order creation webhook - store in raw table
  static async handleOrderCreated(orderData: WebhookPayload, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      // Normalize payload across REST/GraphQL shapes
      const normalized = this.normalizeOrderPayload(orderData as any)

      const shopifyOrderId = this.extractShopifyId((normalized as any).id)
      
      // Extract discount applications; prefer GraphQL, otherwise try REST field
      let discountApplications: any[] = (normalized as any).discountApplications || []
      if (discountApplications.length === 0 && (orderData as any).discount_applications) {
        discountApplications = (orderData as any).discount_applications
      }
      // If we still don't have GraphQL-shaped applications, fetch the order node by GID for full details
      let lineItemDiscountAllocations: any[] = []
      if (!discountApplications.some((a: any) => a && a.__typename) && (orderData as any).admin_graphql_api_id) {
        const admin = await this.getAdminClient(shopDomain)
        if (admin) {
          const orderNode = await this.fetchOrderNodeByGid(admin, (orderData as any).admin_graphql_api_id)
          if (orderNode?.discountApplications?.nodes) {
            discountApplications = orderNode.discountApplications.nodes
          }
          if (orderNode?.lineItems?.edges) {
            lineItemDiscountAllocations = orderNode.lineItems.edges.flatMap((edge: any) => {
              const li = edge.node
              return (li.discountAllocations || []).map((alloc: any) => ({
                lineItemId: li.id,
                allocatedAmount: alloc.allocatedAmount,
                application: alloc.discountApplication
              }))
            })
          }
        }
      }
      
      // Resolve discount IDs for code applications (by code) and automatic applications (by title)
      let resolvedCodeToDiscount: Record<string, { shopify_discount_id: number; id: string }> = {}
      let resolvedAutoTitleToDiscount: Record<string, { shopify_discount_id: number; id: string }> = {}
      try {
        const codes = Array.from(new Set(
          (discountApplications || [])
            .filter((a: any) => a?.__typename === 'DiscountCodeApplication' && a.code)
            .map((a: any) => String(a.code))
        ))
        const autoTitles = Array.from(new Set(
          (discountApplications || [])
            .filter((a: any) => a?.__typename === 'AutomaticDiscountApplication' && a.title)
            .map((a: any) => String(a.title))
        ))
        if (codes.length > 0) {
          const { data: discountRows } = await supabaseAdmin
            .from('shopify_discounts_raw')
            .select('id, shopify_discount_id, code')
            .eq('shop_id', shopId)
            .in('code', codes)
          if (discountRows) {
            for (const row of discountRows) {
              if (row.code) resolvedCodeToDiscount[row.code] = { shopify_discount_id: row.shopify_discount_id as any, id: row.id }
            }
          }
        }
        if (autoTitles.length > 0) {
          const { data: autoRows } = await supabaseAdmin
            .from('shopify_discounts_raw')
            .select('id, shopify_discount_id, title')
            .eq('shop_id', shopId)
            .eq('is_automatic', true)
            .in('title', autoTitles)
          if (autoRows) {
            for (const row of autoRows) {
              if (row.title) resolvedAutoTitleToDiscount[row.title] = { shopify_discount_id: row.shopify_discount_id as any, id: row.id }
            }
          }
        }
      } catch (e) {
        console.warn('Failed resolving discount IDs for order applications:', e)
      }

      // Enrich applications with resolved discount IDs
      discountApplications = (discountApplications || []).map((app: any) => {
        if (app?.__typename === 'DiscountCodeApplication' && app.code && resolvedCodeToDiscount[app.code]) {
          return { ...app, shopifyDiscountId: resolvedCodeToDiscount[app.code].shopify_discount_id, discountRecordId: resolvedCodeToDiscount[app.code].id }
        }
        if (app?.__typename === 'AutomaticDiscountApplication' && app.title && resolvedAutoTitleToDiscount[app.title]) {
          return { ...app, shopifyDiscountId: resolvedAutoTitleToDiscount[app.title].shopify_discount_id, discountRecordId: resolvedAutoTitleToDiscount[app.title].id }
        }
        return app
      })

      // Enrich line-item allocations with resolved discount IDs
      lineItemDiscountAllocations = (lineItemDiscountAllocations || []).map((alloc: any) => {
        const code = alloc?.application?.code
        if (code && resolvedCodeToDiscount[code]) {
          return { ...alloc, shopifyDiscountId: resolvedCodeToDiscount[code].shopify_discount_id, discountRecordId: resolvedCodeToDiscount[code].id }
        }
        const title = alloc?.application?.title
        if (title && resolvedAutoTitleToDiscount[title]) {
          return { ...alloc, shopifyDiscountId: resolvedAutoTitleToDiscount[title].shopify_discount_id, discountRecordId: resolvedAutoTitleToDiscount[title].id }
        }
        return alloc
      })

      // Categorize discount applications
      const automaticDiscounts = discountApplications.filter((app: any) => app.__typename === 'AutomaticDiscountApplication')
      const manualDiscounts = discountApplications.filter((app: any) => app.__typename === 'ManualDiscountApplication')
      const scriptDiscounts = discountApplications.filter((app: any) => app.__typename === 'ScriptDiscountApplication')

      const orderToInsert: any = {
        shop_id: shopId,
        shopify_order_id: shopifyOrderId,
        raw_data: orderData,
        order_number: (normalized as any).name || (orderData as any).order_number,
        total_price: parseFloat(((normalized as any).totalPrice ?? (orderData as any).total_price ?? '0').toString()),
        subtotal_price: parseFloat(((normalized as any).subtotalPrice ?? (orderData as any).subtotal_price ?? '0').toString()),
        total_tax: parseFloat(((normalized as any).totalTax ?? (orderData as any).total_tax ?? '0').toString()),
        total_discounts: (normalized as any).totalDiscounts ? parseFloat((normalized as any).totalDiscounts) : parseFloat(((orderData as any).total_discounts ?? (orderData as any).current_total_discounts ?? 0).toString()),
        currency: (normalized as any).currencyCode,
        discount_applications: discountApplications,
        discount_allocations: lineItemDiscountAllocations,
        automatic_discount_applications: automaticDiscounts,
        manual_discount_applications: manualDiscounts,
        script_discount_applications: scriptDiscounts,
        processed_at: null
      }

      // Channel fields (prefer GraphQL if available later)
      if ((normalized as any).channel_source_name) orderToInsert.channel_source_name = (normalized as any).channel_source_name
      if ((normalized as any).channel_app_id) orderToInsert.channel_app_id = (normalized as any).channel_app_id

      const { data, error } = await supabaseAdmin
        .from('shopify_orders_raw')
        .upsert(orderToInsert, { 
          onConflict: 'shopify_order_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing order in raw table:', error)
        throw error
      }

      console.log(`Order ${orderData.name} stored in raw table for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleOrderCreated:', error)
      throw error
    }
  }

  // Handle order updated webhook - update raw table
  static async handleOrderUpdated(orderData: WebhookPayload, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      const shopifyOrderId = this.extractShopifyId(orderData.id)
      
      // Extract discount applications; prefer GraphQL, otherwise try REST
      let discountApplications: any[] = (orderData as any).discountApplications || []
      if (discountApplications.length === 0 && (orderData as any).discount_applications) {
        discountApplications = (orderData as any).discount_applications
      }
      // Optionally enrich via GraphQL if __typename is missing and GID present
      let lineItemDiscountAllocations: any[] = []
      if (!discountApplications.some((a: any) => a && a.__typename) && (orderData as any).admin_graphql_api_id) {
        const admin = await this.getAdminClient(shopDomain)
        if (admin) {
          const orderNode = await this.fetchOrderNodeByGid(admin, (orderData as any).admin_graphql_api_id)
          if (orderNode?.discountApplications?.nodes) {
            discountApplications = orderNode.discountApplications.nodes
          }
          if (orderNode?.lineItems?.edges) {
            lineItemDiscountAllocations = orderNode.lineItems.edges.flatMap((edge: any) => {
              const li = edge.node
              return (li.discountAllocations || []).map((alloc: any) => ({
                lineItemId: li.id,
                allocatedAmount: alloc.allocatedAmount,
                application: alloc.discountApplication
              }))
            })
          }
        }
      }
      
      // Resolve discount IDs for code applications (by code) and automatic applications (by title)
      let resolvedCodeToDiscount: Record<string, { shopify_discount_id: number; id: string }> = {}
      let resolvedAutoTitleToDiscount: Record<string, { shopify_discount_id: number; id: string }> = {}
      try {
        const codes = Array.from(new Set(
          (discountApplications || [])
            .filter((a: any) => a?.__typename === 'DiscountCodeApplication' && a.code)
            .map((a: any) => String(a.code))
        ))
        const autoTitles = Array.from(new Set(
          (discountApplications || [])
            .filter((a: any) => a?.__typename === 'AutomaticDiscountApplication' && a.title)
            .map((a: any) => String(a.title))
        ))
        if (codes.length > 0) {
          const { data: discountRows } = await supabaseAdmin
            .from('shopify_discounts_raw')
            .select('id, shopify_discount_id, code')
            .eq('shop_id', shopId)
            .in('code', codes)
          if (discountRows) {
            for (const row of discountRows) {
              if (row.code) resolvedCodeToDiscount[row.code] = { shopify_discount_id: row.shopify_discount_id as any, id: row.id }
            }
          }
        }
        if (autoTitles.length > 0) {
          const { data: autoRows } = await supabaseAdmin
            .from('shopify_discounts_raw')
            .select('id, shopify_discount_id, title')
            .eq('shop_id', shopId)
            .eq('is_automatic', true)
            .in('title', autoTitles)
          if (autoRows) {
            for (const row of autoRows) {
              if (row.title) resolvedAutoTitleToDiscount[row.title] = { shopify_discount_id: row.shopify_discount_id as any, id: row.id }
            }
          }
        }
      } catch (e) {
        console.warn('Failed resolving discount IDs for order applications:', e)
      }

      // Enrich applications with resolved discount IDs
      discountApplications = (discountApplications || []).map((app: any) => {
        if (app?.__typename === 'DiscountCodeApplication' && app.code && resolvedCodeToDiscount[app.code]) {
          return { ...app, shopifyDiscountId: resolvedCodeToDiscount[app.code].shopify_discount_id, discountRecordId: resolvedCodeToDiscount[app.code].id }
        }
        if (app?.__typename === 'AutomaticDiscountApplication' && app.title && resolvedAutoTitleToDiscount[app.title]) {
          return { ...app, shopifyDiscountId: resolvedAutoTitleToDiscount[app.title].shopify_discount_id, discountRecordId: resolvedAutoTitleToDiscount[app.title].id }
        }
        return app
      })

      // Enrich line-item allocations with resolved discount IDs
      lineItemDiscountAllocations = (lineItemDiscountAllocations || []).map((alloc: any) => {
        const code = alloc?.application?.code
        if (code && resolvedCodeToDiscount[code]) {
          return { ...alloc, shopifyDiscountId: resolvedCodeToDiscount[code].shopify_discount_id, discountRecordId: resolvedCodeToDiscount[code].id }
        }
        const title = alloc?.application?.title
        if (title && resolvedAutoTitleToDiscount[title]) {
          return { ...alloc, shopifyDiscountId: resolvedAutoTitleToDiscount[title].shopify_discount_id, discountRecordId: resolvedAutoTitleToDiscount[title].id }
        }
        return alloc
      })

      // Categorize discount applications
      const automaticDiscounts = discountApplications.filter((app: any) => app.__typename === 'AutomaticDiscountApplication')
      const manualDiscounts = discountApplications.filter((app: any) => app.__typename === 'ManualDiscountApplication')
      const scriptDiscounts = discountApplications.filter((app: any) => app.__typename === 'ScriptDiscountApplication')

      // Build partial update to avoid overwriting with empty values
      const orderToUpdate: any = { raw_data: orderData, updated_at: new Date().toISOString() }
      if (orderData.name) orderToUpdate.order_number = orderData.name
      if (orderData.totalPrice) orderToUpdate.total_price = parseFloat(orderData.totalPrice)
      if (orderData.subtotalPrice) orderToUpdate.subtotal_price = parseFloat(orderData.subtotalPrice)
      if (orderData.totalTax !== undefined) orderToUpdate.total_tax = parseFloat(orderData.totalTax || '0')
      if (orderData.totalDiscounts !== undefined) orderToUpdate.total_discounts = orderData.totalDiscounts ? parseFloat(orderData.totalDiscounts) : 0
      if (orderData.currencyCode) orderToUpdate.currency = orderData.currencyCode
      if (discountApplications && discountApplications.length >= 0) orderToUpdate.discount_applications = discountApplications
      if (lineItemDiscountAllocations && lineItemDiscountAllocations.length >= 0) orderToUpdate.discount_allocations = lineItemDiscountAllocations
      if (automaticDiscounts && automaticDiscounts.length >= 0) orderToUpdate.automatic_discount_applications = automaticDiscounts
      if (manualDiscounts && manualDiscounts.length >= 0) orderToUpdate.manual_discount_applications = manualDiscounts
      if (scriptDiscounts && scriptDiscounts.length >= 0) orderToUpdate.script_discount_applications = scriptDiscounts
      // Partial update for channel fields
      if ((orderData as any).source_name) orderToUpdate.channel_source_name = (orderData as any).source_name
      if ((orderData as any).app_id) orderToUpdate.channel_app_id = (orderData as any).app_id

      const { data, error } = await supabaseAdmin
        .from('shopify_orders_raw')
        .update(orderToUpdate)
        .eq('shopify_order_id', shopifyOrderId)
        .eq('shop_id', shopId)

      if (error) {
        console.error('Error updating order in raw table:', error)
        throw error
      }

      console.log(`Order ${orderData.name} updated in raw table for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleOrderUpdated:', error)
      throw error
    }
  }

  // Handle product creation/update webhook - store in raw table
  static async handleProductUpdated(productData: any, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      const shopifyProductId = this.extractShopifyId(productData.id)

      const productToInsert = {
        shop_id: shopId,
        shopify_product_id: shopifyProductId,
        raw_data: productData,
        title: productData.title,
        handle: productData.handle,
        product_type: productData.productType,
        vendor: productData.vendor,
        status: productData.status
      }

      const { data, error } = await supabaseAdmin
        .from('shopify_products_raw')
        .upsert(productToInsert, { 
          onConflict: 'shopify_product_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing product in raw table:', error)
        throw error
      }

      // Also store variants if they exist
      if (productData.variants?.edges) {
        await this.handleProductVariantsUpdated(productData, shopDomain)
      }

      console.log(`Product ${productData.title} stored in raw table for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleProductUpdated:', error)
      throw error
    }
  }

  // Handle product variants - store in raw table
  static async handleProductVariantsUpdated(productData: any, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      const shopifyProductId = this.extractShopifyId(productData.id)
      
      // Get product UUID from our database
      const { data: productRecord } = await supabaseAdmin
        .from('shopify_products_raw')
        .select('id')
        .eq('shopify_product_id', shopifyProductId)
        .single()

      if (!productRecord) {
        console.warn(`Product record not found for Shopify product ID: ${shopifyProductId}`)
        return
      }

      const variants = productData.variants?.edges?.map((edge: any) => edge.node) || []
      const variantsToInsert = variants.map((variant: any) => {
        const shopifyVariantId = this.extractShopifyId(variant.id)
        
        return {
          shop_id: shopId,
          product_id: productRecord.id,
          shopify_variant_id: shopifyVariantId,
          raw_data: variant,
          title: variant.title,
          sku: variant.sku,
          price: parseFloat(variant.price || '0'),
          compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
          weight: variant.weight ? parseFloat(variant.weight) : null,
          weight_unit: variant.weightUnit,
          inventory_quantity: variant.inventoryQuantity || 0
        }
      })

      if (variantsToInsert.length === 0) return

      const { data, error } = await supabaseAdmin
        .from('shopify_variants_raw')
        .upsert(variantsToInsert, { 
          onConflict: 'shopify_variant_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing variants in raw table:', error)
        throw error
      }

      console.log(`Stored ${variantsToInsert.length} variants for product ${productData.title}`)
      return data
    } catch (error) {
      console.error('Error in handleProductVariantsUpdated:', error)
      throw error
    }
  }

  // Handle customer creation/update webhook - store in raw table
  static async handleCustomerUpdated(customerData: any, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      const shopifyCustomerId = this.extractShopifyId(customerData.id)

      const customerToInsert = {
        shop_id: shopId,
        shopify_customer_id: shopifyCustomerId,
        raw_data: customerData,
        email: customerData.email,
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        phone: customerData.phone,
        total_spent: parseFloat(customerData.totalSpent || '0'),
        orders_count: customerData.ordersCount || 0,
        state: customerData.state
      }

      const { data, error } = await supabaseAdmin
        .from('shopify_customers_raw')
        .upsert(customerToInsert, { 
          onConflict: 'shopify_customer_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing customer in raw table:', error)
        throw error
      }

      console.log(`Customer ${customerData.email} stored in raw table for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleCustomerUpdated:', error)
      throw error
    }
  }

  // Handle discount code creation/update webhook - store in raw table
  static async handleDiscountCodeUpdated(discountData: any, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      const shopifyDiscountId = this.extractShopifyId(discountData.admin_graphql_api_id || discountData.id)

      // If payload is REST-shaped (no union object), fetch GraphQL node for full details
      let discount = discountData.codeDiscount || discountData.automaticDiscount || discountData
      let isAutomatic = false
      if (!discountData.codeDiscount && !discountData.automaticDiscount && !discountData.__typename && (discountData.admin_graphql_api_id || discountData.id)) {
        const admin = await this.getAdminClient(shopDomain)
        if (admin) {
          const node = await this.fetchDiscountNodeByGid(admin, discountData.admin_graphql_api_id || discountData.id)
          if (node?.codeDiscount) {
            discount = node.codeDiscount
          } else if (node?.automaticDiscount) {
            discount = node.automaticDiscount
            isAutomatic = true
          }
        }
      }

      // Extract common fields based on discount type
      let code = ''
      let codes: string[] = []
      let amount = null
      let percentage = null
      let discountType = ''
      let minimumRequirement = ''
      let minimumAmount = null
      let startsAt = null
      let endsAt = null
      let title = ''
      let summary = ''
      let discountClass: 'product' | 'order' | 'shipping' = 'product'
      
      // Extract combinesWith
      let combinesWithOrderDiscounts = false
      let combinesWithProductDiscounts = false
      let combinesWithShippingDiscounts = false
      
      // Extract customer/product targeting
      let customerSelection = 'all'
      const prerequisiteCustomers: any[] = []
      const entitledProducts: string[] = []
      const entitledCollections: string[] = []
      const entitledCountries: string[] = []

      if (discount.__typename === 'DiscountCodeBasic') {
        title = discount.title
        summary = discount.summary || ''
        code = discount.codes?.edges?.[0]?.node?.code || ''
        codes = discount.codes?.edges?.map((e: any) => e.node.code) || []
        discountType = 'basic'
        discountClass = 'product'
        
        if (discount.customerGets?.value?.__typename === 'DiscountAmount') {
          amount = parseFloat(discount.customerGets.value.amount?.amount || '0')
          discountType = 'basic_amount'
        } else if (discount.customerGets?.value?.__typename === 'DiscountPercentage') {
          percentage = parseFloat(discount.customerGets.value.percentage || '0')
          discountType = 'basic_percentage'
        }

        if (discount.minimumRequirement?.__typename === 'DiscountMinimumSubtotal') {
          minimumRequirement = 'subtotal'
          minimumAmount = parseFloat(discount.minimumRequirement.greaterThanOrEqualToSubtotal?.amount || '0')
        } else if (discount.minimumRequirement?.__typename === 'DiscountMinimumQuantity') {
          minimumRequirement = 'quantity'
          minimumAmount = parseFloat(discount.minimumRequirement.greaterThanOrEqualToQuantity || '0')
        }

        startsAt = discount.startsAt
        endsAt = discount.endsAt
        
        // Extract combinesWith
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
        
        // Extract targeting
        if (discount.customerSelection) {
          if (discount.customerSelection.__typename === 'DiscountCustomerAll' || discount.customerSelection.allCustomers) {
            customerSelection = 'all'
          } else if (discount.customerSelection.__typename === 'DiscountCustomerSegments') {
            customerSelection = 'prerequisite'
            if (discount.customerSelection.segments) {
              prerequisiteCustomers.push(...discount.customerSelection.segments.map((s: any) => ({ id: s.id, name: s.name })))
            }
          }
        }
        
        if (discount.customerGets?.items) {
          if (discount.customerGets.items.products?.edges) {
            entitledProducts.push(...discount.customerGets.items.products.edges.map((e: any) => e.node.id))
          }
          if (discount.customerGets.items.collections?.edges) {
            entitledCollections.push(...discount.customerGets.items.collections.edges.map((e: any) => e.node.id))
          }
        }
      } else if (discount.__typename === 'DiscountCodeBxgy') {
        title = discount.title
        summary = discount.summary || ''
        code = discount.codes?.edges?.[0]?.node?.code || ''
        codes = discount.codes?.edges?.map((e: any) => e.node.code) || []
        discountType = 'bxgy'
        discountClass = 'product'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
      } else if (discount.__typename === 'DiscountCodeFreeShipping') {
        title = discount.title
        summary = discount.summary || ''
        code = discount.codes?.edges?.[0]?.node?.code || ''
        codes = discount.codes?.edges?.map((e: any) => e.node.code) || []
        discountType = 'free_shipping'
        discountClass = 'shipping'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
        
        if (discount.destinationSelection?.countries) {
          entitledCountries.push(...discount.destinationSelection.countries)
        }
      } else if (discount.__typename === 'DiscountCodeApp') {
        title = discount.title
        code = discount.codes?.edges?.[0]?.node?.code || ''
        codes = discount.codes?.edges?.map((e: any) => e.node.code) || []
        discountType = 'app'
        discountClass = 'product'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
      } else if (discount.__typename === 'DiscountAutomaticBasic') {
        isAutomatic = true
        title = discount.title
        summary = discount.summary || ''
        discountType = 'basic'
        discountClass = 'product'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        if (discount.customerGets?.value?.__typename === 'DiscountAmount') {
          amount = parseFloat(discount.customerGets.value.amount?.amount || '0')
          discountType = 'basic_amount'
        } else if (discount.customerGets?.value?.__typename === 'DiscountPercentage') {
          percentage = parseFloat(String(discount.customerGets.value.percentage))
          discountType = 'basic_percentage'
        }
        if (discount.minimumRequirement?.__typename === 'DiscountMinimumSubtotal') {
          minimumRequirement = 'subtotal'
          minimumAmount = parseFloat(discount.minimumRequirement.greaterThanOrEqualToSubtotal?.amount || '0')
        } else if (discount.minimumRequirement?.__typename === 'DiscountMinimumQuantity') {
          minimumRequirement = 'quantity'
          minimumAmount = parseFloat(String(discount.minimumRequirement.greaterThanOrEqualToQuantity))
        }
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
        if (discount.customerGets?.items) {
          const items = discount.customerGets.items
          if (items.products?.edges) entitledProducts.push(...items.products.edges.map((e: any) => e.node.id))
          if (items.collections?.edges) entitledCollections.push(...items.collections.edges.map((e: any) => e.node.id))
        }
      } else if (discount.__typename === 'DiscountAutomaticBxgy') {
        isAutomatic = true
        title = discount.title
        summary = discount.summary || ''
        discountType = 'bxgy'
        discountClass = 'product'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
      } else if (discount.__typename === 'DiscountAutomaticFreeShipping') {
        isAutomatic = true
        title = discount.title
        summary = discount.summary || ''
        discountType = 'free_shipping'
        discountClass = 'shipping'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
        if (discount.destinationSelection?.countries) entitledCountries.push(...discount.destinationSelection.countries)
      } else if (discount.__typename === 'DiscountAutomaticApp') {
        isAutomatic = true
        title = discount.title
        discountType = 'app'
        discountClass = 'product'
        startsAt = discount.startsAt
        endsAt = discount.endsAt
        if (discount.combinesWith) {
          combinesWithOrderDiscounts = discount.combinesWith.orderDiscounts || false
          combinesWithProductDiscounts = discount.combinesWith.productDiscounts || false
          combinesWithShippingDiscounts = discount.combinesWith.shippingDiscounts || false
        }
      }

      // Fetch existing record to avoid overwriting with empty data
      await supabaseAdmin
        .from('shopify_discounts_raw')
        .select('*')
        .eq('shop_id', shopId)
        .eq('shopify_discount_id', shopifyDiscountId)
        .maybeSingle()

      // Prepare partial update - only set fields with meaningful values
      const discountToInsert: any = {
        shop_id: shopId,
        shopify_discount_id: shopifyDiscountId,
        raw_data: discount
      }

      if (title) discountToInsert.title = title
      if (summary !== undefined) discountToInsert.summary = summary
      if (code) discountToInsert.code = code
      if (discountClass) discountToInsert.discount_class = discountClass
      // is_automatic set based on node type
      if (isAutomatic) discountToInsert.is_automatic = true
      else discountToInsert.is_automatic = false

      if (amount !== null) discountToInsert.amount = amount
      if (percentage !== null) discountToInsert.percentage = percentage
      if (amount !== null) discountToInsert.value_type = 'fixed_amount'
      else if (percentage !== null) discountToInsert.value_type = 'percentage'
      if (amount !== null) discountToInsert.value_amount = amount
      if (percentage !== null) discountToInsert.value_percentage = percentage

      if (discountType) discountToInsert.discount_type = discountType
      if (minimumRequirement) discountToInsert.minimum_requirement = minimumRequirement
      if (minimumAmount !== null) discountToInsert.minimum_amount = minimumAmount
      if (discount.usageLimit !== undefined) discountToInsert.usage_limit = discount.usageLimit
      if (discount.usedCount !== undefined) discountToInsert.used_count = discount.usedCount || 0
      if (discount.asyncUsageCount !== undefined) discountToInsert.async_usage_count = discount.asyncUsageCount || 0
      if (codes && codes.length >= 0) discountToInsert.codes_count = codes.length
      if (discount.totalSales?.amount !== undefined) discountToInsert.total_sales = parseFloat(discount.totalSales.amount)
      if (discount.appliesOncePerCustomer !== undefined) discountToInsert.applies_once_per_customer = discount.appliesOncePerCustomer || false

      const startsAtFinal = startsAt || discountData.starts_at || discountData.start_at
      const endsAtFinal = endsAt || discountData.ends_at || discountData.end_at
      if (startsAtFinal) discountToInsert.starts_at = startsAtFinal
      if (endsAtFinal) discountToInsert.ends_at = endsAtFinal
      if (discount.status || discountData.status) discountToInsert.status = discount.status || discountData.status

      if (customerSelection) discountToInsert.customer_selection = customerSelection
      if (prerequisiteCustomers && prerequisiteCustomers.length >= 0) discountToInsert.prerequisite_customers = JSON.stringify(prerequisiteCustomers)
      if (entitledProducts && entitledProducts.length >= 0) discountToInsert.entitled_products = JSON.stringify(entitledProducts)
      if (entitledCollections && entitledCollections.length >= 0) discountToInsert.entitled_collections = JSON.stringify(entitledCollections)
      if (entitledCountries && entitledCountries.length >= 0) discountToInsert.entitled_countries = JSON.stringify(entitledCountries)

      if (combinesWithOrderDiscounts !== undefined) discountToInsert.combines_with_order_discounts = combinesWithOrderDiscounts
      if (combinesWithProductDiscounts !== undefined) discountToInsert.combines_with_product_discounts = combinesWithProductDiscounts
      if (combinesWithShippingDiscounts !== undefined) discountToInsert.combines_with_shipping_discounts = combinesWithShippingDiscounts

      const createdAtFinal = discount.createdAt || discountData.created_at
      const updatedAtFinal = discount.updatedAt || discountData.updated_at
      if (createdAtFinal) discountToInsert.shopify_created_at = createdAtFinal
      if (updatedAtFinal) discountToInsert.shopify_updated_at = updatedAtFinal

      // Normalize discount_type and discount_class for REST-shaped payloads and ensure DB constraint compliance
      if (!discountToInsert.discount_type || discountToInsert.discount_type === '') {
        if (discountToInsert.value_type === 'fixed_amount') {
          discountToInsert.discount_type = 'basic_amount'
        } else if (discountToInsert.value_type === 'percentage') {
          discountToInsert.discount_type = 'basic_percentage'
        } else if (discountToInsert.discount_class === 'shipping') {
          discountToInsert.discount_type = 'free_shipping'
        } else {
          // Fallback when type cannot be inferred
          discountToInsert.discount_type = 'app'
        }
      }

      // Keep type/class consistent: free_shipping must be shipping class
      if (discountToInsert.discount_type === 'free_shipping' && discountToInsert.discount_class !== 'shipping') {
        discountToInsert.discount_class = 'shipping'
      }

      const { data, error } = await supabaseAdmin
        .from('shopify_discounts_raw')
        .upsert(discountToInsert, { 
          onConflict: 'shopify_discount_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing discount code in raw table:', error)
        throw error
      }

      console.log(`Discount code ${code || title} stored in raw table for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleDiscountCodeUpdated:', error)
      throw error
    }
  }

  // Handle discount creation webhook (both code and automatic discounts)
  static async handleDiscountCreated(discountData: any, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      // Check if this is an automatic discount or code discount
      const isAutomatic = discountData.isAutomatic || false
      
      const shopifyDiscountId = this.extractShopifyId(discountData.id)
      
      // Extract values from transformed data
      const discountToInsert = {
        shop_id: shopId,
        shopify_discount_id: shopifyDiscountId,
        raw_data: discountData.rawData || discountData,
        title: discountData.title,
        summary: discountData.summary || null,
        code: discountData.code || null,
        discount_class: discountData.discountClass || 'product',
        is_automatic: isAutomatic,
        amount: discountData.valueAmount,
        percentage: discountData.valuePercentage,
        value_type: discountData.valueType || 'percentage',
        value_amount: discountData.valueAmount,
        value_percentage: discountData.valuePercentage,
        discount_type: discountData.discountType || 'basic',
        minimum_requirement: discountData.minimumRequirement || null,
        minimum_amount: discountData.minimumAmount,
        usage_limit: discountData.usageLimit || null,
        used_count: 0,
        async_usage_count: discountData.asyncUsageCount || 0,
        codes_count: discountData.codesCount || (discountData.code ? 1 : 0),
        total_sales: discountData.totalSales || 0,
        applies_once_per_customer: discountData.appliesOncePerCustomer || false,
        starts_at: discountData.startsAt,
        ends_at: discountData.endsAt,
        status: discountData.status,
        customer_selection: discountData.customerSelection || 'all',
        prerequisite_customers: JSON.stringify(discountData.prerequisiteCustomers || []),
        entitled_products: JSON.stringify(discountData.entitledProducts || []),
        entitled_collections: JSON.stringify(discountData.entitledCollections || []),
        entitled_countries: JSON.stringify(discountData.entitledCountries || []),
        combines_with_order_discounts: discountData.combinesWithOrderDiscounts || false,
        combines_with_product_discounts: discountData.combinesWithProductDiscounts || false,
        combines_with_shipping_discounts: discountData.combinesWithShippingDiscounts || false,
        shopify_created_at: discountData.createdAt,
        shopify_updated_at: discountData.updatedAt
      }

      const { data, error } = await supabaseAdmin
        .from('shopify_discounts_raw')
        .upsert(discountToInsert, { 
          onConflict: 'shopify_discount_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error storing discount in raw table:', error)
        throw error
      }

      console.log(`Discount ${discountData.title || discountData.code} stored in raw table for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleDiscountCreated:', error)
      throw error
    }
  }

  // Handle discount deletion webhook
  static async handleDiscountDeleted(discountData: any, shopDomain: string) {
    try {
      const shopId = await this.getShopIdFromDomain(shopDomain)
      if (!shopId) {
        throw new Error(`Shop not found for domain: ${shopDomain}`)
      }

      const shopifyDiscountId = this.extractShopifyId(discountData.admin_graphql_api_id || discountData.id)

      // Soft delete - update status to inactive rather than deleting
      const { data, error } = await supabaseAdmin
        .from('shopify_discounts_raw')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('shopify_discount_id', shopifyDiscountId)
        .eq('shop_id', shopId)

      if (error) {
        console.error('Error marking discount as deleted in raw table:', error)
        throw error
      }

      console.log(`Discount ${shopifyDiscountId} marked as deleted for shop ${shopDomain}`)
      return data
    } catch (error) {
      console.error('Error in handleDiscountDeleted:', error)
      throw error
    }
  }
}
