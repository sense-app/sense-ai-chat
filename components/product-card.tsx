import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

import type { ProductGroup } from '@/lib/ai/agents/shopper';

interface ProductCardProps extends Omit<ProductGroup, 'stores'> {
  stores: ProductGroup['stores'];
  className?: string;
}

export function ProductCard({ name, shortDescription, imageUrl, category, stores, className }: ProductCardProps) {
  const primaryStore = stores[0];

  const handleBuyClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex-none">
        <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
          <img
            src={imageUrl}
            alt={name}
            className="object-cover w-full h-full"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.png';
            }}
          />
        </div>
        <CardTitle className="line-clamp-2">{name}</CardTitle>
        {shortDescription && <CardDescription className="line-clamp-2">{shortDescription}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground mb-2">{category}</div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="font-semibold">
              {primaryStore.currencySymbol || primaryStore.currencyCode}
              {primaryStore.price.toLocaleString()}
            </div>
            {primaryStore.originalPrice && (
              <div className="text-sm text-muted-foreground line-through">
                {primaryStore.currencySymbol || primaryStore.currencyCode}
                {primaryStore.originalPrice.toLocaleString()}
              </div>
            )}
          </div>
          {primaryStore.latestOffers && (
            <div className="text-sm text-green-600 dark:text-green-400">{primaryStore.latestOffers}</div>
          )}
          {primaryStore.review && <div className="text-sm text-muted-foreground">{primaryStore.review}</div>}
          <div className="flex items-center justify-between mt-4">
            <img src={primaryStore.imageUrl} alt={primaryStore.name} className="h-6 object-contain" />
            <Button onClick={() => handleBuyClick(primaryStore.productURL)} className="ml-2">
              Buy Now
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-none">
        {primaryStore.deliveryDetails && (
          <div className="text-sm text-muted-foreground">{primaryStore.deliveryDetails}</div>
        )}
      </CardFooter>
    </Card>
  );
}
