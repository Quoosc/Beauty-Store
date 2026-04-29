"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart.store";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-gray-500 mb-6">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
        <Link href="/products">
          <Button className="bg-pink-600 hover:bg-pink-700">Tiếp tục mua sắm</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng ({items.length} sản phẩm)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4 border rounded-xl">
              <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                <Image
                  src={product.images[0] ?? "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{product.name}</h3>
                <p className="text-pink-600 font-bold mt-1">
                  {(product.salePrice ?? product.price).toLocaleString("vi-VN")}₫
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-500 ml-2"
                    onClick={() => removeItem(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border rounded-xl p-6 h-fit space-y-4">
          <h2 className="font-bold text-lg">Tóm tắt đơn hàng</h2>
          <Separator />
          <div className="flex justify-between text-sm">
            <span>Tạm tính</span>
            <span>{totalPrice().toLocaleString("vi-VN")}₫</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Phí vận chuyển</span>
            <span className="text-green-600">Miễn phí</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Tổng cộng</span>
            <span className="text-pink-600">{totalPrice().toLocaleString("vi-VN")}₫</span>
          </div>
          <Button className="w-full bg-pink-600 hover:bg-pink-700">
            Tiến hành thanh toán
          </Button>
        </div>
      </div>
    </div>
  );
}
