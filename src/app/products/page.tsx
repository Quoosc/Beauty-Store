import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tất cả sản phẩm</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Tìm kiếm sản phẩm..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Tất cả", "Chăm sóc da", "Trang điểm", "Nước hoa", "Chăm sóc tóc"].map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full border text-sm hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center py-20 text-gray-400">
        <p>Kết nối API để hiển thị sản phẩm</p>
      </div>
    </div>
  );
}
