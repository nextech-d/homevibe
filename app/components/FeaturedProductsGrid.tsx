import type { ReactNode } from "react";
import type { Appliance } from "../data/products";
import type { FeaturedColumnIds } from "../lib/storefront";
import FeaturedColumnGrid from "./FeaturedColumnGrid";

type FeaturedProductsGridProps = {
  inventory: Appliance[];
  featuredColumns: FeaturedColumnIds[];
  renderItem: (appliance: Appliance) => ReactNode;
  itemClassName?: string;
};

export default function FeaturedProductsGrid({
  inventory,
  featuredColumns,
  renderItem,
  itemClassName = "w-full",
}: FeaturedProductsGridProps) {
  const featured = inventory.filter((item) => item.isFeatured);
  if (featured.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
        {featured.map((appliance) => (
          <div key={appliance.id} className={itemClassName}>
            {renderItem(appliance)}
          </div>
        ))}
      </div>
    );
  }

  const byId = new Map(inventory.map((item) => [item.id, item]));

  const columns = featuredColumns.flatMap((column) => {
    const top = byId.get(column.topProductId);
    if (!top) return [];
    const bottom = column.bottomProductId ? byId.get(column.bottomProductId) : undefined;
    return [{ top, bottom }];
  });

  return (
    <FeaturedColumnGrid
      columns={columns}
      getKey={(appliance) => String(appliance.id)}
      renderItem={renderItem}
      itemClassName={itemClassName}
    />
  );
}
