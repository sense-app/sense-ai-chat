import { ProductType } from "@/lib/ai/agents/answer";
import React from "react";
import { Card, CardContent } from "./ui/card";

const ProductsView = ({ products }: { products: ProductType[] }) => {
  const groupByStore = (products: ProductType[]) => {
    const storeMap = new Map<string, ProductType[]>();
    products.forEach((product) => {
      const storeName = product.store.name;
      const storeProducts = storeMap.get(storeName) || [];
      storeProducts.push(product);
      storeMap.set(storeName, storeProducts);
    });

    return Array.from(storeMap.entries());
  };
  return (
    <div className="grid grid-cols-3 gap-5 max-w-2xl mx-auto w-full">
      {products.map((product, i) => (
        <div key={i} className="w-full">
          <div className="w-full aspect-square rounded-xl overflow-hidden border border-input bg-neutral-100">
            <img
              src={
                "https://asset.conrad.com/media10/isa/160267/c1/-/de/002861955PI00/image.jpg?x=1440&y=1440&format=jpg&ex=1440&ey=1440&align=center"
              }
              alt={product.name}
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
    </div>
  );
};

export default ProductsView;
