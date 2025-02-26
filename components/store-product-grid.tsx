import type { StoreGroup } from '@/lib/ai/agents/shopper';
import { ProductCard } from './product-card';
import { StoreCard } from './store-card';

interface StoreProductGridProps {
  storeGroups: StoreGroup[];
}

export const StoreProductGrid = ({ storeGroups }: StoreProductGridProps) => {
  if (!storeGroups || storeGroups.length === 0) {
    return <div className="text-center py-10">No store products found</div>;
  }

  return (
    <div className="space-y-10">
      {storeGroups.map((store, index) => (
        <div key={`${store.name}-${index}`} className="space-y-4">
          <StoreCard name={store.name} imageUrl={store.imageUrl} shopUrl={store.shopUrl} />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {store.products.map((product, productIndex) => (
              <ProductCard
                key={`${product.name}-${productIndex}`}
                name={product.name}
                shortDescription={product.shortDescription}
                imageUrl={product.imageUrl}
                price={product.price}
                originalPrice={product.originalPrice}
                category={product.category}
                productURL={product.productURL}
                currencyCode={product.currencyCode}
                currencySymbol={product.currencySymbol}
                deliveryDetails={product.deliveryDetails}
                latestOffers={product.latestOffers}
                review={product.review}
                storeName={store.name}
                storeImageUrl={store.imageUrl}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
