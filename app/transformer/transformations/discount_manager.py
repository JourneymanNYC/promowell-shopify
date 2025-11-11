from decimal import Decimal, ROUND_HALF_UP, getcontext
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta, timezone

from app.transformer.transformations.discount_class import DiscountClass

from app.transformer.utils.supabase_client import supabase

class DiscountManager:
    def __init__(self, shop_id: Optional[int] = None):
        self.shop_id = shop_id

    def fetch_all_discounts(self) -> List[DiscountClass]:
        return DiscountClass.get_all(shop_id=self.shop_id)

    def calculate_all_metrics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        force_refresh: bool = False,
    ) -> List[Dict[str, Any]]:
        discounts = self.fetch_all_discounts()
        all_metrics = []

        for discount in discounts:
            try:
                metrics = discount.calculate_metrics(start_date, end_date, force_refresh)
                all_metrics.append(metrics)
            except Exception as e:
                print(f"Error calculating metrics for {discount.name}: {e}")

        return all_metrics

    def upsert_all_metrics(
        self,
        metrics_list: List[Dict[str, Any]],
        table_name: str = "discount_metrics",
        conflict_keys: Optional[List[str]] = None,
    ):
        if not metrics_list:
            return None
        return DiscountClass.upsert_many(metrics_list, table_name, conflict_keys)
    


'''
Example Usage:

manager = DiscountManager(shop_id=123)
metrics = manager.calculate_all_metrics()
manager.upsert_all_metrics(metrics)
'''