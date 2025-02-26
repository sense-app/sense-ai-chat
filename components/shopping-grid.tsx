import type { ShoppingResults } from '@/lib/ai/agents/shopper';
import { StoreProductGrid } from './store-product-grid';
import { ProductStoreGrid } from './product-store-grid';

interface ShoppingGridProps {
  results: ShoppingResults;
}

export const ShoppingGrid = ({ results }: ShoppingGridProps) => {
  if (!results) {
    return <div className="text-center py-12">No shopping results available</div>;
  }

  return (
    <div className="space-y-10">
      {results.summary && <p>{results.summary}</p>}

      {/* Products Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Products</h2>
        {results.productsGroup && results.productsGroup.length > 0 ? (
          <ProductStoreGrid productGroups={results.productsGroup} />
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">No product groups available</p>
          </div>
        )}
      </div>

      {/* Stores Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Stores</h2>
        {results.storeGroup && results.storeGroup.length > 0 ? (
          <StoreProductGrid storeGroups={results.storeGroup} />
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">No store groups available</p>
          </div>
        )}
      </div>
    </div>
  );
};
