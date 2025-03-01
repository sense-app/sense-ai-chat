
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  name: string;
  shortDescription?: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category: string;
  productURL: string;
  currencyCode: string;
  currencySymbol?: string;
  deliveryDetails?: string;
  latestOffers?: string;
  review?: string;
  className?: string;
  storeName?: string;
  storeImageUrl?: string;
}

export const ProductCard = ({
  name,
  shortDescription,
  imageUrl,
  price,
  originalPrice,
  category,
  productURL,
  currencyCode,
  currencySymbol = getCurrencySymbol(currencyCode),
  deliveryDetails,
  latestOffers,
  review,
  className,
  storeName,
  storeImageUrl,
}: ProductCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <Card className={cn('h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md', className)}>
      <CardHeader className="p-3">
        <AspectRatio ratio={1} className="bg-muted rounded-md overflow-hidden mb-2">
          <img
            src={imageUrl || '/placeholder.svg'}
            alt={name}
            className="object-cover size-full transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </AspectRatio>
        {discount > 0 && <Badge className="absolute top-5 left-5 bg-red-500">{discount}% OFF</Badge>}
      </CardHeader>
      <CardContent className="grow p-4 pt-0">
        {storeName && storeImageUrl && (
          <div className="flex items-center gap-2 mb-2">
            <div className="size-6 rounded-full overflow-hidden">
              <img
                src={storeImageUrl || '/placeholder.svg'}
                alt={storeName}
                className="size-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{storeName}</span>
          </div>
        )}
        <CardTitle className="text-lg line-clamp-2 h-12 mb-1">{name}</CardTitle>
        {shortDescription && (
          <CardDescription className="text-sm line-clamp-2 mb-3">{shortDescription}</CardDescription>
        )}
        <div className="flex flex-col gap-2 mt-auto">
          {deliveryDetails && <div className="text-xs text-muted-foreground">{deliveryDetails}</div>}
          {latestOffers && <div className="text-xs text-green-600 font-medium">{latestOffers}</div>}
          {review && <div className="text-xs italic text-muted-foreground">&ldquo;{review}&rdquo;</div>}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold">
            {currencySymbol}
            {price.toLocaleString()}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {currencySymbol}
              {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Button size="sm" asChild>
          <a href={productURL} target="_blank" rel="noopener noreferrer">
            <ShoppingBag className="size-4 mr-2" />
            Buy
          </a>
        </Button>
      </CardFooter>
    </Card>
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
