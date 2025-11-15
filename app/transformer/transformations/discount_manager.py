from typing import Dict, Optional, Any
from datetime import datetime, timedelta, timezone, date

from app.transformer.transformations.discount_class import DiscountClass


class DiscountManager:
    """
    Manager class for scheduling and running discount performance metric calculations.
    Supports both daily processing and historical backfilling.
    """

    def __init__(self, shop_id: str):
        """
        Initialize DiscountManager for a specific shop.

        Args:
            shop_id: UUID of the shop to process metrics for
        """
        self.shop_id = shop_id

    def process_daily_metrics(self, target_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Process and upsert discount metrics for a single day.

        Args:
            target_date: Date to process (YYYY-MM-DD format). Defaults to yesterday.

        Returns:
            Dictionary with processing results
        """
        try:
            print(f"Processing metrics for shop {self.shop_id}, date: {target_date or 'yesterday'}")

            # Calculate metrics for the target date
            metrics = DiscountClass.calculate_all_metrics(
                shop_id=self.shop_id,
                target_date=target_date
            )

            if not metrics:
                return {
                    'success': True,
                    'date': target_date,
                    'discounts_processed': 0,
                    'message': 'No discounts found for this shop'
                }

            # Upsert to database
            upsert_result = DiscountClass.upsert_metrics_to_daily_table(metrics)

            # Add date info to result
            result_date = target_date or (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat()
            upsert_result['date'] = result_date
            upsert_result['discounts_processed'] = len(metrics)

            print(f"✓ {upsert_result['message']}")
            return upsert_result

        except Exception as e:
            error_msg = f"Error processing daily metrics: {str(e)}"
            print(f"✗ {error_msg}")
            return {
                'success': False,
                'date': target_date,
                'discounts_processed': 0,
                'message': error_msg
            }

    def process_historical_metrics(
        self,
        start_date: str,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process and upsert discount metrics for a date range (historical backfill).

        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format). Defaults to 60 days.

        Returns:
            Dictionary with processing results for all dates
        """
        try:
            # Parse dates
            start = datetime.fromisoformat(start_date).date()
            if end_date:
                end = datetime.fromisoformat(end_date).date()
            else:
                end = (datetime.now(timezone.utc) - timedelta(days=60)).date()

            # Validate date range
            if start > end:
                return {
                    'success': False,
                    'message': 'start_date must be before or equal to end_date',
                    'dates_processed': 0,
                    'results': []
                }

            print(f"\n{'='*60}")
            print(f"Historical Sync: {start_date} to {end.isoformat()}")
            print(f"Shop ID: {self.shop_id}")
            print(f"{'='*60}\n")

            # Process each date in the range
            current_date = start
            results = []
            success_count = 0
            fail_count = 0

            while current_date <= end:
                date_str = current_date.isoformat()
                print(f"Processing {date_str}...")

                result = self.process_daily_metrics(target_date=date_str)
                results.append(result)

                if result['success']:
                    success_count += 1
                else:
                    fail_count += 1

                current_date += timedelta(days=1)

            print(f"\n{'='*60}")
            print(f"Historical Sync Complete")
            print(f"Total dates processed: {len(results)}")
            print(f"Successful: {success_count}")
            print(f"Failed: {fail_count}")
            print(f"{'='*60}\n")

            return {
                'success': fail_count == 0,
                'start_date': start_date,
                'end_date': end.isoformat(),
                'dates_processed': len(results),
                'successful': success_count,
                'failed': fail_count,
                'results': results,
                'message': f'Processed {len(results)} days ({success_count} successful, {fail_count} failed)'
            }

        except Exception as e:
            error_msg = f"Error processing historical metrics: {str(e)}"
            print(f"✗ {error_msg}")
            return {
                'success': False,
                'message': error_msg,
                'dates_processed': 0,
                'results': []
            }

    def sync_yesterday(self) -> Dict[str, Any]:
        """
        Convenience method to sync yesterday's metrics.
        Use this for daily scheduled jobs (cron/scheduler).

        Returns:
            Dictionary with processing results
        """
        return self.process_daily_metrics()


# Example Usage:
if __name__ == "__main__":
    # Initialize manager for a shop
    manager = DiscountManager(shop_id="e2bd9e4b-1e1e-4d9c-9d39-ba68f0f63e52")

    # Daily sync (for cron jobs) - processes yesterday
    # result = manager.sync_yesterday()
    # print(result)

    # Process a specific date
    # result = manager.process_daily_metrics(target_date="2025-01-15")
    # print(result)

    # Historical backfill - sync last 60 days
    result = manager.process_historical_metrics(
        start_date="2025-01-01",
        end_date="2025-11-15"
    )
    print(result)

    pass