import type { ProductGroup } from '@/lib/ai/agents/shopper';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

interface ProductStoreGridProps {
  productGroups: ProductGroup[];
}

export const ProductStoreGrid = ({ productGroups }: ProductStoreGridProps) => {
  if (!productGroups || productGroups.length === 0) {
    return <div className="text-center py-10">No product groups found</div>;
  }

  return (
    <div className="space-y-12">
      {productGroups
        .filter((product) => {
          // Skip products with missing required fields
          return (
            product.name &&
            product.imageUrl &&
            product.category &&
            Array.isArray(product.stores) &&
            product.stores.length > 0
          );
        })
        .map((product, index) => (
          <div key={`${product.name}-${index}`} className="space-y-4">
            <Card className="overflow-hidden">
              <div className="md:grid md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <AspectRatio ratio={1} className="bg-muted overflow-hidden">
                    <img
                      src={product.imageUrl || '/placeholder.svg'}
                      alt={product.name}
                      className="object-cover size-full"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </AspectRatio>
                </div>
                <div className="p-6 md:col-span-3">
                  <div className="flex flex-col h-full">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{product.category}</Badge>
                        {product.stores.length > 0 && (
                          <Badge variant="secondary">{product.stores.length} store options</Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                      {product.shortDescription && (
                        <CardDescription className="text-base mb-4">{product.shortDescription}</CardDescription>
                      )}
                    </div>

                    <div className="mt-4 grow">
                      <h3 className="font-medium mb-2">Available from:</h3>
                      <Tabs defaultValue={product.stores[0]?.name || 'default'} className="w-full">
                        <TabsList className="w-full justify-start overflow-auto mb-2">
                          {product.stores.map((store, storeIndex) => (
                            <TabsTrigger key={`${store.name}-${storeIndex}`} value={store.name} className="min-w-max">
                              <div className="flex items-center gap-2">
                                <div className="size-5 rounded-full overflow-hidden">
                                  <img
                                    src={store.imageUrl || '/placeholder.svg'}
                                    alt={store.name}
                                    className="size-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                                {store.name}
                              </div>
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {product.stores.map((store, storeIndex) => (
                          <TabsContent key={`${store.name}-${storeIndex}-content`} value={store.name} className="mt-0">
                            <Card className="border-0 shadow-none">
                              <CardContent className="p-0 space-y-3">
                                {store.reason && (
                                  <div className="bg-muted/50 p-3 rounded-md">
                                    <p className="text-sm">{store.reason}</p>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    {store.deliveryDetails && (
                                      <p className="text-sm">
                                        <strong>Delivery:</strong> {store.deliveryDetails}
                                      </p>
                                    )}
                                    {store.latestOffers && (
                                      <p className="text-sm text-green-600">
                                        <strong>Offer:</strong> {store.latestOffers}
                                      </p>
                                    )}
                                    {store.review && (
                                      <p className="text-sm italic mt-2">&ldquo;{store.review}&rdquo;</p>
                                    )}
                                  </div>
                                  <div className="flex flex-col justify-between items-end">
                                    <div className="text-right">
                                      <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-2xl font-bold">
                                          {store.currencySymbol || getCurrencySymbol(store.currencyCode)}
                                          {store.price.toLocaleString()}
                                        </span>
                                        {store.originalPrice && store.originalPrice > store.price && (
                                          <span className="text-sm text-muted-foreground line-through">
                                            {store.currencySymbol || getCurrencySymbol(store.currencyCode)}
                                            {store.originalPrice.toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                      {store.originalPrice && store.originalPrice > store.price && (
                                        <Badge className="bg-red-500">
                                          {Math.round(
                                            ((store.originalPrice - store.price) / store.originalPrice) * 100,
                                          )}
                                          % OFF
                                        </Badge>
                                      )}
                                    </div>
                                    <Button className="mt-4" asChild>
                                      <a href={store.productURL} target="_blank" rel="noopener noreferrer">
                                        <ShoppingBag className="size-4 mr-2" />
                                        Buy from {store.name}
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
    </div>
  );
};

function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
  };

  return symbols[currencyCode] || currencyCode;
}
