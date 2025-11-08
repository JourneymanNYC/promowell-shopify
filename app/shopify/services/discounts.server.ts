import { ShopifyService, getShopIdFromDomain } from "../client"
import type { ShopifyDiscount, DiscountsPageInfo } from "../types"

export class DiscountService {
  /**
   * Get code-based discounts (discount codes like SAVE20)
   * @param admin - Shopify admin API instance
   * @param shopDomain - Shop domain
   * @param first - Number of discounts to fetch
   * @param after - Cursor for pagination
   * @returns Code discounts with pagination info
   */
  static async getCodeDiscounts(
    admin: any, 
    shopDomain: string, 
    first: number = 250, 
    after?: string
  ): Promise<{ success: boolean; data?: { discounts: ShopifyDiscount[]; pageInfo: DiscountsPageInfo }; error?: string }> {
    try {
      console.log("DiscountService.getCodeDiscounts called with shopDomain:", shopDomain)
      
      if (!shopDomain) {
        throw new Error("Shop domain is required")
      }

      const shopId = await getShopIdFromDomain(shopDomain)
      console.log("Shop ID found:", shopId)
      
      if (!shopId) {
        console.log("Shop not found in database, proceeding with Shopify API call")
      }

      const query = `
        query getCodeDiscounts($first: Int!, $after: String) {
          codeDiscountNodes(first: $first, after: $after) {
            edges {
              node {
                id
                codeDiscount {
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
                    totalSales {
                      amount
                      currencyCode
                    }
                    codes(first: 10) {
                      edges {
                        node {
                          id
                          code
                        }
                      }
                    }
                    customerGets {
                      value {
                        ... on DiscountAmount {
                          amount {
                            amount
                            currencyCode
                          }
                        }
                        ... on DiscountPercentage {
                          percentage
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                        ... on DiscountProducts {
                          products(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                        ... on DiscountCollections {
                          collections(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                    customerSelection {
                      ... on DiscountCustomerAll {
                        allCustomers
                      }
                      ... on DiscountCustomerSegments {
                        segments {
                          id
                          name
                        }
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                    minimumRequirement {
                      ... on DiscountMinimumSubtotal {
                        greaterThanOrEqualToSubtotal {
                          amount
                          currencyCode
                        }
                      }
                      ... on DiscountMinimumQuantity {
                        greaterThanOrEqualToQuantity
                      }
                    }
                    usageLimit
                  }
                  ... on DiscountCodeBxgy {
                    title
                    status
                    summary
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    appliesOncePerCustomer
                    asyncUsageCount
                    totalSales {
                      amount
                      currencyCode
                    }
                    codes(first: 10) {
                      edges {
                        node {
                          id
                          code
                        }
                      }
                    }
                    customerBuys {
                      value {
                        ... on DiscountQuantity {
                          quantity
                        }
                        ... on DiscountPurchaseAmount {
                          amount
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                        ... on DiscountProducts {
                          products(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                        ... on DiscountCollections {
                          collections(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                    customerGets {
                      value {
                        ... on DiscountOnQuantity {
                          quantity {
                            quantity
                          }
                          effect {
                            ... on DiscountPercentage {
                              percentage
                            }
                          }
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                        ... on DiscountProducts {
                          products(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                        ... on DiscountCollections {
                          collections(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                    customerSelection {
                      ... on DiscountCustomerAll {
                        allCustomers
                      }
                      ... on DiscountCustomerSegments {
                        segments {
                          id
                          name
                        }
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                    usageLimit
                  }
                  ... on DiscountCodeFreeShipping {
                    title
                    status
                    summary
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    appliesOncePerCustomer
                    asyncUsageCount
                    totalSales {
                      amount
                      currencyCode
                    }
                    codes(first: 10) {
                      edges {
                        node {
                          id
                          code
                        }
                      }
                    }
                    customerSelection {
                      ... on DiscountCustomerAll {
                        allCustomers
                      }
                      ... on DiscountCustomerSegments {
                        segments {
                          id
                          name
                        }
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                    minimumRequirement {
                      ... on DiscountMinimumSubtotal {
                        greaterThanOrEqualToSubtotal {
                          amount
                          currencyCode
                        }
                      }
                      ... on DiscountMinimumQuantity {
                        greaterThanOrEqualToQuantity
                      }
                    }
                    destinationSelection {
                      ... on DiscountCountryAll {
                        allCountries
                      }
                      ... on DiscountCountries {
                        countries
                      }
                    }
                  }
                  ... on DiscountCodeApp {
                    title
                    status
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    appliesOncePerCustomer
                    asyncUsageCount
                    codes(first: 10) {
                      edges {
                        node {
                          id
                          code
                        }
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
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

      const result = await ShopifyService.executeQuery(admin, query, { first, after })
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
      }

      const discounts = result.data?.codeDiscountNodes?.edges?.map((edge: any) => ({
        id: edge.node.id,
        ...edge.node.codeDiscount
      })) || []
      
      return {
        success: true,
        data: {
          discounts,
          pageInfo: result.data?.codeDiscountNodes?.pageInfo || { hasNextPage: false, endCursor: null }
        }
      }
    } catch (error) {
      console.error("Error fetching code discounts:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Get automatic discounts (auto-applied discounts)
   * @param admin - Shopify admin API instance
   * @param shopDomain - Shop domain
   * @param first - Number of discounts to fetch
   * @param after - Cursor for pagination
   * @returns Automatic discounts with pagination info
   */
  static async getAutomaticDiscounts(
    admin: any, 
    shopDomain: string, 
    first: number = 250, 
    after?: string
  ): Promise<{ success: boolean; data?: { discounts: ShopifyDiscount[]; pageInfo: DiscountsPageInfo }; error?: string }> {
    try {
      console.log("DiscountService.getAutomaticDiscounts called with shopDomain:", shopDomain)
      
      if (!shopDomain) {
        throw new Error("Shop domain is required")
      }

      const shopId = await getShopIdFromDomain(shopDomain)
      console.log("Shop ID found:", shopId)
      
      if (!shopId) {
        console.log("Shop not found in database, proceeding with Shopify API call")
      }

      const query = `
        query getAutomaticDiscounts($first: Int!, $after: String) {
          automaticDiscountNodes(first: $first, after: $after) {
            edges {
              node {
                id
                automaticDiscount {
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
                      value {
                        ... on DiscountAmount {
                          amount {
                            amount
                            currencyCode
                          }
                        }
                        ... on DiscountPercentage {
                          percentage
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                        ... on DiscountProducts {
                          products(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                        ... on DiscountCollections {
                          collections(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                    minimumRequirement {
                      ... on DiscountMinimumSubtotal {
                        greaterThanOrEqualToSubtotal {
                          amount
                          currencyCode
                        }
                      }
                      ... on DiscountMinimumQuantity {
                        greaterThanOrEqualToQuantity
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                  }
                  ... on DiscountAutomaticBxgy {
                    title
                    status
                    summary
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    asyncUsageCount
                    customerBuys {
                      value {
                        ... on DiscountQuantity {
                          quantity
                        }
                        ... on DiscountPurchaseAmount {
                          amount
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                        ... on DiscountProducts {
                          products(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                        ... on DiscountCollections {
                          collections(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                    customerGets {
                      value {
                        ... on DiscountOnQuantity {
                          quantity {
                            quantity
                          }
                          effect {
                            ... on DiscountPercentage {
                              percentage
                            }
                          }
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                        ... on DiscountProducts {
                          products(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                        ... on DiscountCollections {
                          collections(first: 250) {
                            edges {
                              node {
                                id
                              }
                            }
                          }
                        }
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                  }
                  ... on DiscountAutomaticFreeShipping {
                    title
                    status
                    summary
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    asyncUsageCount
                    minimumRequirement {
                      ... on DiscountMinimumSubtotal {
                        greaterThanOrEqualToSubtotal {
                          amount
                          currencyCode
                        }
                      }
                      ... on DiscountMinimumQuantity {
                        greaterThanOrEqualToQuantity
                      }
                    }
                    destinationSelection {
                      ... on DiscountCountryAll {
                        allCountries
                      }
                      ... on DiscountCountries {
                        countries
                      }
                    }
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
                    }
                  }
                  ... on DiscountAutomaticApp {
                    title
                    status
                    createdAt
                    updatedAt
                    startsAt
                    endsAt
                    asyncUsageCount
                    combinesWith {
                      orderDiscounts
                      productDiscounts
                      shippingDiscounts
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

      const result = await ShopifyService.executeQuery(admin, query, { first, after })
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
      }

      const discounts = result.data?.automaticDiscountNodes?.edges?.map((edge: any) => ({
        id: edge.node.id,
        ...edge.node.automaticDiscount
      })) || []
      
      return {
        success: true,
        data: {
          discounts,
          pageInfo: result.data?.automaticDiscountNodes?.pageInfo || { hasNextPage: false, endCursor: null }
        }
      }
    } catch (error) {
      console.error("Error fetching automatic discounts:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }
}
