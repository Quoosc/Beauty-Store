"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCartStore } from "@/stores/cart.store";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.images[0] ?? "/placeholder.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-pink-600">
              -{discount}%
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <p className="text-xs text-gray-400 mb-1">{product.category.name}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-pink-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-500">
            {product.rating} ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            {product.salePrice ? (
              <div>
                <span className="font-bold text-pink-600">
                  {product.salePrice.toLocaleString("vi-VN")}₫
                </span>
                <span className="text-xs text-gray-400 line-through ml-1">
                  {product.price.toLocaleString("vi-VN")}₫
                </span>
              </div>
            ) : (
              <span className="font-bold text-gray-800">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 hover:bg-pink-600 hover:text-white hover:border-pink-600"
            onClick={() => addItem(product)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
