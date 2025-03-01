'use client';

import { ShopperLogo, ShoppingIcon } from '@/components/icons';
import { useTheme } from 'next-themes';

export function BrandingHeader() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex flex-col items-center gap-4 mb-12">
      <ShoppingIcon stroke={resolvedTheme === 'dark' ? '#FFFFFF' : '#000000'} size={48} />
      <ShopperLogo className="scale-[0.8]" fill={resolvedTheme === 'dark' ? '#FFFFFF' : '#000000'} />
      {/* <h1 className="text-2xl font-bold text-primary">Shopper AI</h1> */}
      <h3 className="text-lg font-normal dark:text-zinc-50">Shopping deep search with cashback</h3>
    </div>
  );
}
