import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-pink-50 to-rose-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Khám phá vẻ đẹp của bạn
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Mỹ phẩm chính hãng, giá tốt nhất. Hơn 1000+ sản phẩm từ các thương hiệu uy tín.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
                Mua ngay
              </Button>
            </Link>
            <Link href="/sale">
              <Button size="lg" variant="outline">
                Xem khuyến mãi
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Danh mục nổi bật</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Chăm sóc da", "Trang điểm", "Nước hoa", "Chăm sóc tóc"].map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className="rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors p-6 text-center font-medium text-gray-700"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Sale banner */}
      <section className="bg-pink-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Ưu đãi hôm nay</h2>
          <p className="mb-6 opacity-90">Giảm đến 50% cho hàng trăm sản phẩm</p>
          <Link href="/sale">
            <Button size="lg" variant="secondary">
              Xem ngay
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
