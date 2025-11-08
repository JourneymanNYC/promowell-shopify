import { supabaseAdmin } from "../supabase/client"

// ==========================
// Helper Functions
// ==========================

export async function getShopIdFromDomain(shopDomain: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single()

    if (error) {
      console.error('Error fetching shop ID:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error in getShopIdFromDomain:', error)
    return null
  }
}

export function extractShopifyId(graphqlId: string): string {
  return graphqlId.split('/').pop() || graphqlId
}

// Shopify GraphQL Helper
export async function executeGraphQL(admin: any, query: string, variables?: any): Promise<any> {
  // Strip undefined values - Shopify GraphQL doesn't accept them
  const cleanVariables = Object.fromEntries(
    Object.entries(variables || {}).filter(([_, v]) => v !== undefined)
  )

  console.log('[GraphQL] Variables being sent:', JSON.stringify(cleanVariables, null, 2))

  // Shopify API requires: { variables: {...} } wrapper
  const response = await admin.graphql(query, {
    variables: cleanVariables
  })
  const result = await response.json()

  if (result.errors) {
    console.error('[GraphQL] Errors:', JSON.stringify(result.errors, null, 2))
  }

  return result
}

// ==========================
// Base Shopify Service
// ==========================

export class ShopifyService {
  // Generic method for executing any GraphQL query
  static async executeQuery(admin: any, query: string, variables?: any): Promise<any> {
    return await executeGraphQL(admin, query, variables)
  }
}