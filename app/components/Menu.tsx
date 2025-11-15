interface Discount {
  id: string;
  code: string;
  title: string;
  status: string;
  discount_type: string;
}

interface DiscountMenuProps {
  discounts: Discount[];
  selectedDiscount: string;
  onSelectDiscount: (discountId: string) => void;
}

export function DiscountMenu({ discounts, selectedDiscount, onSelectDiscount }: DiscountMenuProps) {
  // Safety check - ensure discounts is an array
  const safeDiscounts = Array.isArray(discounts) ? discounts : [];

  // Get active and inactive discounts
  const activeDiscounts = safeDiscounts.filter(d => d.status === 'ACTIVE');
  const inactiveDiscounts = safeDiscounts.filter(d => d.status !== 'ACTIVE');

  // Get display text for selected discount
  const getSelectedText = () => {
    if (selectedDiscount === 'all') return 'All discounts';
    const discount = safeDiscounts.find(d => d.id === selectedDiscount);
    return discount ? (discount.code || discount.title) : 'All discounts';
  };

  console.log('DiscountMenu rendered:', { discountCount: safeDiscounts.length, selectedDiscount });

  return (
    <>
      <s-button commandFor="discount-menu">
        {getSelectedText()} <s-icon type="caret-down"></s-icon>
      </s-button>

      <s-menu id="discount-menu" accessibilityLabel="Select discount">
        <s-section>
          <s-button onClick={() => onSelectDiscount('all')}>
            <s-text type={selectedDiscount === 'all' ? 'strong' : undefined}>
              All discounts
            </s-text>
          </s-button>
        </s-section>

        {activeDiscounts.length > 0 && (
          <s-section heading="Active Discounts">
            {activeDiscounts.map((discount) => (
              <s-button
                key={discount.id}
                onClick={() => onSelectDiscount(discount.id)}
              >
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-text type={selectedDiscount === discount.id ? 'strong' : undefined}>
                    {discount.code || discount.title}
                  </s-text>
                  <s-badge tone="success" size="base">Active</s-badge>
                </s-stack>
              </s-button>
            ))}
          </s-section>
        )}

        {inactiveDiscounts.length > 0 && (
          <s-section heading="Inactive Discounts">
            {inactiveDiscounts.map((discount) => (
              <s-button
                key={discount.id}
                onClick={() => onSelectDiscount(discount.id)}
              >
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-text
                    color="subdued"
                    type={selectedDiscount === discount.id ? 'strong' : undefined}
                  >
                    {discount.code || discount.title}
                  </s-text>
                  <s-badge tone="neutral" size="base">{discount.status}</s-badge>
                </s-stack>
              </s-button>
            ))}
          </s-section>
        )}
      </s-menu>
    </>
  );
}
  