from decimal import Decimal, ROUND_HALF_UP, getcontext
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta, timezone
import json

from app.transformer.utils.supabase_client import supabase_admin

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
        shopify_discount_id,
        code,
        discount_percentage,
        active,
        title=None,
        discount_type=None,
        is_automatic=False
    ):
        self.shop_id = shop_id
        self.discount_id = discount_id
        self.shopify_discount_id = shopify_discount_id
        self.code = code
        self.discount_percentage = discount_percentage
        self.active = active
        self.title = title
        self.discount_type = discount_type
        self.is_automatic = is_automatic

    # ---------- Factory Methods ----------

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DiscountClass':
        """Create DiscountClass instance from Supabase record."""

        return cls(
            discount_id=data.get('discount_id') or data.get('id'),
            shop_id=data['shop_id'],
            shopify_discount_id=data['shopify_discount_id'],
            code=data['code'],
            discount_percentage=Decimal(data.get('discount_percentage', '0')),
            active=data.get('active', True),
            title=data.get('title'),
            discount_type=data.get('discount_type'),
            is_automatic=data.get('is_automatic', False)
        )

    @classmethod
    def get_discounts(cls, shop_id: Optional[int] = None) -> List['DiscountClass']:
        
        """Fetch all discounts from shopify_raw_discounts table."""
        
        query = supabase_admin.table('shopify_discounts_raw').select('*')
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
            supabase_admin.table('shopify_orders_raw')
            .select('*')
            .eq('shop_id', self.shop_id)
            .execute()
        )

        return getattr(response, 'data', []) or []

    # ---------- Metrics Stub ----------

    @classmethod
    def calculate_all_metrics(cls, shop_id, target_date=None):
        """
        Calculate metrics for all discounts for a specific date.

        Args:
            shop_id: The shop ID to process
            target_date: Date to process (string 'YYYY-MM-DD', date object, or None for yesterday)

        Returns:
            Dictionary of discount metrics by discount_id
        """

        # Default to yesterday if no date provided
        if target_date is None:
            target_date = (datetime.now(timezone.utc) - timedelta(days=1)).date()
        elif isinstance(target_date, str):
            target_date = datetime.fromisoformat(target_date).date()
        elif isinstance(target_date, datetime):
            target_date = target_date.date()

        # Calculate start and end of the target day (UTC)
        start_datetime = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_datetime = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=timezone.utc)

        discounts = cls.get_discounts(shop_id)
        results = {}

        for discount in discounts:
            results[discount.discount_id] = {
                "discount_id": discount.discount_id,
                "shop_id": discount.shop_id,
                "shopify_discount_id": discount.shopify_discount_id,
                "code": discount.code,
                "title": discount.title,
                "discount_type": discount.discount_type,
                "is_automatic": discount.is_automatic,
                "active": discount.active,
                "date": target_date.isoformat(),  # Date for daily aggregation
                "order_count": 0,
                "total_revenue": Decimal('0.00'),
                "total_discount_expense": Decimal('0.00'),
                "average_discount_per_order": Decimal('0.00'),
                "average_order_value": Decimal('0.00'),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            # Process orders for THIS discount (now inside the loop)
            metrics = results[discount.discount_id]
            orders = discount.fetch_related_orders()

            for order in orders:
                # Filter orders by target date
                order_date_str = order.get('processed_at') or order.get('created_at')
                if order_date_str:
                    try:
                        # Parse ISO format date (handles both with and without 'Z')
                        order_datetime = datetime.fromisoformat(order_date_str.replace('Z', '+00:00'))
                        # Skip if order is not from target date
                        if not (start_datetime <= order_datetime <= end_datetime):
                            continue
                    except (ValueError, AttributeError):
                        # Skip orders with invalid date format
                        continue
                else:
                    # Skip orders without a date
                    continue

                order_discount_id = order.get('shopify_discount_id')
                order_discount_codes = order.get('discount_codes', [])

                # Check if order matches this discount by ID or by code
                matches_by_id = order_discount_id == discount.shopify_discount_id
                matches_by_code = discount.code and discount.code in order_discount_codes

                if not (matches_by_id or matches_by_code):
                    continue

                metrics['order_count'] += 1
                metrics['total_revenue'] += Decimal(str(order.get('total_price', '0.00')))
                metrics['total_discount_expense'] += Decimal(str(order.get('total_discounts', '0.00')))

            # Calculate averages after processing all orders for this discount
            if metrics['order_count'] > 0:
                metrics['average_discount_per_order'] = (metrics['total_discount_expense'] / metrics['order_count']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                metrics['average_order_value'] = (metrics['total_revenue'] / metrics['order_count']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            metrics['created_at'] = datetime.now(timezone.utc).isoformat()
            metrics['updated_at'] = datetime.now(timezone.utc).isoformat()

        return results

    @classmethod
    def upsert_metrics_to_daily_table(cls, metrics_results: Dict) -> Dict:
        """
        Upsert metrics from calculate_all_metrics to discount_performance_daily table.

        Args:
            metrics_results: Dictionary returned from calculate_all_metrics

        Returns:
            Dictionary with success status and upserted count
        """
        records_to_upsert = []

        for discount_id, metrics in metrics_results.items():
            # Map metrics to discount_performance_daily schema
            record = {
                'shop_id': metrics['shop_id'],
                'discount_code': metrics['code'],
                'discount_id': metrics['shopify_discount_id'],  # BIGINT shopify discount ID
                'discount_title': metrics['title'],
                'discount_type': metrics['discount_type'],
                'is_automatic': metrics['is_automatic'],
                'date': metrics['date'],
                'orders_count': metrics['order_count'],
                'total_orders_value': float(metrics['total_revenue']),
                'average_order_value': float(metrics['average_order_value']),
                'total_discount_expense': float(metrics['total_discount_expense']),
                'average_discount_amount': float(metrics['average_discount_per_order']),
                # Additional fields with defaults
                'average_order_value_impact': 0.00,
                'unique_customers': 0,
                'customer_acquisition': 0,
                'new_customers': 0,
                'returning_customers': 0,
                'revenue_uplift': 0.00,
                'profit_uplift': 0.00,
                'conversion_rate': None,
                'channel_breakdown': {},
                'time_based_performance': {}
            }

            records_to_upsert.append(record)

        if not records_to_upsert:
            return {'success': True, 'upserted': 0, 'message': 'No records to upsert'}

        try:
            # Upsert to discount_performance_daily table
            # on_conflict uses the UNIQUE constraint: (shop_id, discount_code, date)
            response = supabase_admin.table('discount_performance_daily').upsert(
                records_to_upsert,
                on_conflict='shop_id,discount_code,date'
            ).execute()

            return {
                'success': True,
                'upserted': len(records_to_upsert),
                'message': f'Successfully upserted {len(records_to_upsert)} records'
            }
        except Exception as e:
            return {
                'success': False,
                'upserted': 0,
                'message': f'Error upserting to database: {str(e)}'
            }

# Example Usage:
# Process yesterday's data (default) and upsert to database
# metrics = DiscountClass.calculate_all_metrics(shop_id="e2bd9e4b-1e1e-4d9c-9d39-ba68f0f63e52")
# result = DiscountClass.upsert_metrics_to_daily_table(metrics)
# print(result)

# Process specific date and upsert
# metrics = DiscountClass.calculate_all_metrics(
#     shop_id="e2bd9e4b-1e1e-4d9c-9d39-ba68f0f63e52",
#     target_date="2025-01-15"
# )
# result = DiscountClass.upsert_metrics_to_daily_table(metrics)
# print(result)

# View metrics before upserting
# for discount_id, metric_data in metrics.items():
#     print("=" * 40)
#     print(f"Metrics for {metric_data['code']} on {metric_data['date']}:")
#     print("=" * 40)
#     for key, value in metric_data.items():
#         print(f"{key}: {value}")