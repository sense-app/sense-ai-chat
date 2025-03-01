import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreCardProps {
  name: string;
  imageUrl: string;
  shopUrl: string;
  reason?: string;
  className?: string;
}

export const StoreCard = ({ name, imageUrl, shopUrl, reason, className }: StoreCardProps) => {
  return (
    <Card className={cn('h-full flex flex-col transition-all duration-300 hover:shadow-md', className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-10 overflow-hidden rounded-md">
              <img
                src={imageUrl || '/placeholder.svg'}
                alt={name}
                className="size-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <Button size="sm" variant="outline" asChild>
            <a href={shopUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4 mr-1" />
              Visit
            </a>
          </Button>
        </div>
      </CardHeader>
      {reason && (
        <CardContent className="py-2">
          <CardDescription>{reason}</CardDescription>
        </CardContent>
      )}
    </Card>
  );
};
