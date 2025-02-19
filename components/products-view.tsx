import { ProductType } from "@/lib/ai/agents/answer";
import React from "react";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";

const ProductsView = ({ products }: { products: ProductType[] }) => {
  const groupByStore = React.useMemo(() => {
    const storeMap = new Map<
      string,
      { store: ProductType["store"]; products: ProductType[] }
    >();
    products.forEach((product) => {
      const storeName = product.store.name;
      const storeProducts = storeMap.get(storeName)?.products || [];
      storeMap.set(storeName, {
        store: product.store,
        products: [...storeProducts, product]
      });
    });

    return Array.from(storeMap.values());
  }, [products]);

  return (
    <div className="grid grid-cols-3 gap-5 max-w-2xl mx-auto w-full">
      {groupByStore.map(({ products, store }, i) => (
        <React.Fragment key={i}>
          <div className="col-span-3 flex flex-row gap-x-2">
            <Image
              className="size-10 rounded-lg"
              alt={store.name}
              width={40}
              height={40}
              src={
                store.imageUrl.startsWith("http")
                  ? store.imageUrl
                  : "https://loremflickr.com/320/240?random=1"
              }
            />
            <div className="">
              <h2>{store.name}</h2>
              <p className="text-xs line-clamp-1">{store.description}</p>
            </div>
          </div>
          {products.map((product, j) => (
            <div key={i} className="w-full space-y-2">
              <div className="w-full aspect-square relative rounded-xl overflow-hidden border border-input bg-neutral-100">
                <Image
                  src={
                    product.imageUrl.startsWith("http")
                      ? product.imageUrl
                      : "https://loremflickr.com/320/240?random=" + j + i
                  }
                  alt={product.name}
                  fill
                  className="size-full object-cover"
                />
              </div>
              <div className="w-full">
                <h3 className="text-sm">{product.name}</h3>
                <p className="text-sm font-medium">
                  {product.currencyCode} {product.price}
                </p>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProductsView;
