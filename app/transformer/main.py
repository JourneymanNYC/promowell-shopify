from datetime import datetime, timezone
from app.transformer.transformations.discount_class import DiscountClass

def run_for_shop_daily(shop_id: int = None, start_date: datetime = None, end_date: datetime = None):
    discounts = DiscountClass.get_all(shop_id=shop_id)
    all_metrics = []
    for d in discounts:
        days = d.calculate_daily_metrics(start_date=start_date, end_date=end_date, force_refresh=True)
        all_metrics.extend(days)
    # use discount_class_id + period_date as unique constraint for daily rows
    resp = DiscountClass.upsert_many(all_metrics, conflict_keys=["discount_class_id", "period_date"])
    print("Upsert response:", getattr(resp, "data", resp))
    return resp

if __name__ == "__main__":
    # example: run for 2025-11-01 through 2025-11-07 (UTC)
    start = datetime(2025, 11, 1, tzinfo=timezone.utc)
    end = datetime(2025, 11, 7, tzinfo=timezone.utc)
    run_for_shop_daily(shop_id=42, start_date=start, end_date=end)