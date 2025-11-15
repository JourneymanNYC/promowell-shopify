from decimal import Decimal, ROUND_HALF_UP, getcontext
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta, timezone
import json

from app.transformer.utils.supabase_client import supabase

class DiscountClass:
    """
    Fetches discounts and related orders from Supabase.
    Calculates metrics for each discount.
    Upserts metrics back to Supabase.  
    """

    def __init__(
        self,
        shop_id,
        discount_id,
        code,
        discount_percentage,
        active
    ):
        self.shop_id = shop_id
        self.discount_id = discount_id
        self.code = code
        self.discount_percentage = discount_percentage
        self.active = active

    # ---------- Factory Methods ----------

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DiscountClass':
        """Create DiscountClass instance from Supabase record."""
        
        return cls(
            discount_id=data.get('discount_id') or data.get('id'),
            shop_id=data['shop_id'],
            code=data['code'],
            discount_percentage=Decimal(data.get('discount_percentage', '0')),
            active=data.get('active', True),
        )

    @classmethod
    def get_discounts(cls, shop_id: Optional[int] = None) -> List['DiscountClass']:
        
        """Fetch all discounts from shopify_raw_discounts table."""
        
        query = supabase.table('shopify_discounts_raw').select('*')
        if shop_id:
            query = query.eq('shop_id', shop_id)
        response = query.execute()

        data = getattr(response, 'data', None)
        if not data:
            raise Exception(f"No discounts found or Supabase error: {getattr(response, 'error', None)}")

        return [cls.from_dict(item) for item in data]

    # ---------- Data Fetching ----------

    def fetch_related_orders(self) -> List[Dict]:
        """
        Fetch all orders from shopify_raw_orders that used this discount.
        (Assumes discount_codes JSON array contains `code` field.)
        """
        response = (
            supabase.table('shopify_orders_raw')
            .select('*')
            .eq('shop_id', self.shop_id)
            .execute()
        )

        return getattr(response, 'data', []) or []

    # ---------- Metrics Stub ----------

    @classmethod
    def calculate_all_metrics(cls, shop_id):
        
        discounts = cls.get_discounts(shop_id)
        results = {}

        for discount in discounts:
            results[discount.code] = {
                "discount_id": discount.discount_id,
                "shop_id": discount.shop_id,
                "code": discount.code,
                "discount_percentage": discount.discount_percentage,
                "active": discount.active,
                "order_count": 0,
                "total_revenue": Decimal('0.00'),
                "total_discount_expense": Decimal('0.00'),
                "average_discount_per_order": Decimal('0.00'),
                "average_order_value": Decimal('0.00'),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        
        orders = discount.fetch_related_orders()

        for order in orders:
            raw_data = order.get('raw_data', {})
            if not raw_data:
                continue

            if isinstance(raw_data, str):
                try:
                    raw_data = json.loads(raw_data)
                except json.JSONDecodeError:
                    continue
            
            line_items = raw_data.get('lineItems', [])

            for item in line_items:
                for alloc in item.get('discountAllocations', []):
                    discount_code = alloc.get('discountApplication', {}).get('code', '')
                    amount = Decimal(alloc.get('allocatedAmount', '0').get('amount', '0'))

                    if discount_code in results:
                        results[discount_code]['order_count'] += 1
                        results[discount_code]['total_discount_expense'] += amount
                           
        for code, metrics in results.items():
            if metrics['order_count'] > 0:
                metrics['average_discount_per_order'] = (metrics['total_discount_expense'] / metrics['order_count']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                metrics['average_order_value'] = (metrics['total_revenue'] / metrics['order_count']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            
            order_count = metrics['order_count']
            metrics['created_at'] = datetime.now(timezone.utc).isoformat()
            metrics['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        return results

# Example Usage:
discount = DiscountClass.calculate_all_metrics(shop_id="e2bd9e4b-1e1e-4d9c-9d39-ba68f0f63e52")

for code, metrics in discount.items():
    print("=" * 40)
    print(f"Metrics for {code}:")
    print("=" * 40)
    for key, value in metrics.items():
        print(f"{key}: {value}")