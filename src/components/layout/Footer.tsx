import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-pink-600 mb-3">BeautyStore</h3>
            <p className="text-sm text-gray-500">
              Mỹ phẩm chính hãng, chất lượng cao. Đem đến vẻ đẹp tự nhiên cho bạn.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Liên kết</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/products" className="hover:text-pink-600">Sản phẩm</Link></li>
              <li><Link href="/sale" className="hover:text-pink-600">Khuyến mãi</Link></li>
              <li><Link href="/contact" className="hover:text-pink-600">Liên hệ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Email: support@beautystore.vn</li>
              <li>Hotline: 1800 1234</li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-sm text-gray-400">
          © {new Date().getFullYear()} BeautyStore. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
