import { formatItemOptions, type OrderItemOption } from "../../shared/order-options";

/**
 * The options chosen for a cart line or order item, under its name:
 * "Length: 45M". Renders nothing for an item with none.
 */
export default function ItemOptions({
  options,
  className = "",
}: {
  options: OrderItemOption[] | undefined;
  className?: string;
}) {
  const text = formatItemOptions(options);
  if (!text) return null;
  return <span className={`block text-xs font-medium text-neutral-600 ${className}`}>{text}</span>;
}
