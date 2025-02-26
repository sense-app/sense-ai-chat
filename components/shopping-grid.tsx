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
      {results.productsGroup?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Products</h2>
          <ProductStoreGrid productGroups={results.productsGroup} />
        </div>
      )}

      {/* Stores Section */}
      {results.storeGroup?.length > 0 && results.storeGroup.some((store) => (store.products?.length ?? 0) > 0) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Stores</h2>
          <StoreProductGrid storeGroups={results.storeGroup} />
        </div>
      )}
    </div>
  );
};
