from decimal import Decimal, ROUND_HALF_UP, getcontext
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta, timezone

from ..utils.supabase_client import supabase

class DiscountClass:
    """
    Fetches discounts and related orders from Supabase.
    Calculates metrics for each discount.
    Upserts metrics back to Supabase.  
    """

    def __init__(
        self,
        discount_id: int,
        shop_id: int,
        code: str,
        discount_percentage: Decimal,
        active: bool = True,
    ):
        self.discount_id = discount_id
        self.shop_id = shop_id
        self.code = code
        self.discount_percentage = Decimal(discount_percentage)
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
    def get_all(cls, shop_id: Optional[int] = None) -> List['DiscountClass']:
        """Fetch all discounts from shopify_raw_discounts table."""
        query = supabase.table('shopify_raw_discounts').select('*')
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
            supabase.table('shopify_raw_orders')
            .select('*')
            .eq('shop_id', self.shop_id)
            .ilike('discount_codes->>code', f'%{self.code}%')
            .execute()
        )

        return getattr(response, 'data', []) or []

    # ---------- Metrics Stub ----------

    def calculate_metrics(self) -> Dict[str, Any]:
        """
        Placeholder function to calculate metrics for this discount.
        Replace later with actual logic.
        """
        orders = self.fetch_related_orders()

        metrics = {
            "discount_id": self.discount_id,
            "code": self.code,
            "order_count": len(orders),
            # You’ll add more fields later (e.g., total revenue, discount total, AOV, etc.)
        }

        return metrics
    

# Example Usage:
discounts = DiscountClass.get_all(shop_id=123)

for d in discounts:
    metrics = d.calculate_metrics()
    print(metrics)