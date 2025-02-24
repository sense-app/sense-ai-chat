import { ProductCard } from './product-card';

import type { ProductGroup, StoreGroup, ShoppingResults } from '@/lib/ai/agents/shopper';

interface ProductGridProps {
  data: ShoppingResults;
  className?: string;
}

export function ProductGrid({ data, className }: ProductGridProps) {
  const { productsGroup, storeGroup } = data;

  if (!productsGroup?.length && !storeGroup?.length) {
    return <div className="text-center text-muted-foreground py-8">No products found</div>;
  }

  const renderProductGroup = (products: ProductGroup[]) => {
    return products.map((product, index) => <ProductCard key={`product-${product.name}-${index}`} {...product} />);
  };

  const renderStoreGroup = (stores: StoreGroup[]) => {
    return stores.flatMap((store, storeIndex) =>
      store.products.map((product, productIndex) => (
        <ProductCard
          key={`store-${store.name}-${storeIndex}-${productIndex}`}
          name={product.name}
          shortDescription={product.shortDescription}
          imageUrl={product.imageUrl}
          category={product.category}
          stores={[
            {
              name: store.name,
              imageUrl: store.imageUrl,
              shopUrl: store.shopUrl,
              price: product.price,
              productURL: product.productURL,
              review: product.review,
              originalPrice: product.originalPrice,
              currencyCode: product.currencyCode,
              currencySymbol: product.currencySymbol,
              deliveryDetails: product.deliveryDetails,
              remarks: product.remarks,
              latestOffers: product.latestOffers,
              reason: 'Primary store', // Default reason for store group items
            },
          ]}
        />
      )),
    );
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {productsGroup && renderProductGroup(productsGroup)}
        {storeGroup && renderStoreGroup(storeGroup)}
      </div>
    </div>
  );
}
