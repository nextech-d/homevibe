import type { ReactNode } from "react";
import type { CatalogProduct } from "../lib/inventory";
import type { FeaturedColumnIds } from "../lib/storefront";
import FeaturedColumnGrid from "./FeaturedColumnGrid";

type FeaturedProductsGridProps = {
  inventory: CatalogProduct[];
  featuredColumns: FeaturedColumnIds[];
  renderItem: (appliance: CatalogProduct) => ReactNode;
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
    // Flex rather than grid so a short last row - nine products across four
    // columns - sits centred instead of leaving one card stranded on the left.
    // The widths are the grid's: two across (one gap), four across from lg.
    return (
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-8">
        {featured.map((appliance) => (
          <div
            key={appliance.id}
            className={`${itemClassName} basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-3.75rem)/4)]`}
          >
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
