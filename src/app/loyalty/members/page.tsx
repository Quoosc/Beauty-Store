"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Search, Users, Star, UserPlus, Heart, X, Phone } from "lucide-react";
import { toast } from "sonner";
import { ERPLayout } from "@/components/layout/ERPLayout";
import { loyaltyService } from "@/services/loyalty.service";
import { useAuthStore } from "@/stores/auth.store";
import type { LoyaltyMember } from "@/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });

interface PointTransaction {
  id: string;
  type: "EARN" | "REDEEM" | "REFUND";
  points: number;
  note: string;
  createdAt: string;
}

const POINT_TYPE: Record<
  string,
  { label: string; className: string; sign: string }
> = {
  EARN: {
    label: "Tích điểm",
    className: "bg-green-100 text-green-700",
    sign: "+",
  },
  REDEEM: {
    label: "Đổi điểm",
    className: "bg-blue-100 text-blue-700",
    sign: "-",
  },
  REFUND: {
    label: "Hoàn điểm",
    className: "bg-amber-100 text-amber-700",
    sign: "+",
  },
};

function CashierLoyaltyView() {
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<LoyaltyMember | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    setMember(null);
    try {
      const data = await loyaltyService.searchByPhone(phone.trim());
      setMember(data);
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    setIsRegistering(true);
    try {
      const data = await loyaltyService.register({
        fullName: regName.trim(),
        phone: regPhone.trim(),
      });
      setMember(data);
      setShowRegister(false);
      toast.success("Đăng ký thành viên thành công!");
    } catch {
      toast.error("Đăng ký thất bại — số điện thoại có thể đã tồn tại");
    } finally {
      setIsRegistering(false);
    }
  }

  const totalOrders = (member as { totalOrders?: number } | null)?.totalOrders;

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tra cứu thành viên</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setMember(null);
                setNotFound(false);
              }}
              placeholder="Nhập số điện thoại..."
              className="h-11 w-full pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !phone.trim()}
            className="h-11 px-5 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {isSearching ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>
      </div>

      {member && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#FF69B4] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {member.fullName[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{member.fullName}</p>
              <p className="text-sm text-gray-500">{member.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">
                {member.pointBalance.toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-amber-600 mt-1">Điểm tích lũy</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {totalOrders ?? "—"}
              </p>
              <p className="text-xs text-blue-600 mt-1">Đơn hàng</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-gray-700">
                {new Date(member.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ngày tham gia</p>
            </div>
          </div>
        </div>
      )}

      {notFound && !showRegister && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            Không tìm thấy thành viên với số điện thoại này
          </p>
          <button
            onClick={() => {
              setShowRegister(true);
              setRegPhone(phone);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            Đăng ký thành viên mới
          </button>
        </div>
      )}

      {showRegister && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Đăng ký thành viên mới
          </h3>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nguyễn Thị An"
                className="h-11 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0901234567"
                className="h-11 w-full border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="flex-1 h-11 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isRegistering || !regName.trim() || !regPhone.trim()}
                className="flex-1 h-11 bg-gradient-to-r from-[#FF69B4] to-[#D946A6] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {isRegistering ? "Đang đăng ký..." : "Xác nhận đăng ký"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LoyaltyMembersPage() {
  const user = useAuthStore((s) => s.user);
  const isCashier = user?.role === "CASHIER";
  const [activeTab, setActiveTab] = useState<"lookup" | "list">(
    isCashier ? "lookup" : "list",
  );

  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(
    null,
  );
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isCashier) setActiveTab("lookup");
  }, [isCashier]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await loyaltyService.getAll({
          page,
          size: 20,
          search: search || undefined,
        });
        const data = result?.content ?? result ?? [];
        setMembers(Array.isArray(data) ? data : []);
        setTotalPages(result?.totalPages ?? 0);
        setTotalElements(result?.totalElements ?? 0);
      } catch {
        toast.error("Không thể tải danh sách thành viên");
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  async function openHistory(member: LoyaltyMember) {
    setSelectedMember(member);
    setIsLoadingHistory(true);
    try {
      const result = await loyaltyService.getPointHistory(member.id, {
        page: 0,
        size: 20,
      });
      const data = result?.content ?? result ?? [];
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Không thể tải lịch sử điểm");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const totalPoints = members.reduce((sum, m) => sum + m.pointBalance, 0);

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Thành viên Loyalty
          </h1>
        </div>

        {!isCashier && (
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { key: "lookup", label: "Tra cứu / Đăng ký" },
              { key: "list", label: "Danh sách thành viên" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as "lookup" | "list")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {(isCashier || activeTab === "lookup") && <CashierLoyaltyView />}

        {!isCashier && activeTab === "list" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  icon: Users,
                  label: "Tổng thành viên",
                  value: totalElements.toLocaleString("vi-VN"),
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  icon: Star,
                  label: "Tổng điểm phát hành",
                  value: totalPoints.toLocaleString("vi-VN") + " điểm",
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  icon: UserPlus,
                  label: "Thành viên tháng này",
                  value: "—",
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
                >
                  <div
                    className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Tìm theo tên hoặc SĐT..."
                  className="h-10 w-full pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <svg
                    className="animate-spin w-6 h-6 text-pink-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Heart className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-gray-500">Chưa có thành viên nào</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-6 py-3">Họ tên</th>
                      <th className="text-left px-4 py-3">Mã thành viên</th>
                      <th className="text-left px-4 py-3">SĐT</th>
                      <th className="text-right px-4 py-3">Điểm hiện có</th>
                      <th className="text-left px-4 py-3">Ngày đăng ký</th>
                      <th className="text-center px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {member.fullName}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-600">
                          {member.memberCode}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {member.phone}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-pink-600">
                            {member.pointBalance.toLocaleString("vi-VN")} điểm
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => openHistory(member)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Xem lịch sử
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Trang {page + 1} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Point history side panel */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSelectedMember(null)}
          />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Lịch sử điểm
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedMember.fullName}
                </p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 p-6">
              {isLoadingHistory ? (
                <div className="flex justify-center py-10">
                  <svg
                    className="animate-spin w-5 h-5 text-pink-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-400 py-10">
                  Chưa có giao dịch điểm nào
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((tx) => {
                    const config = POINT_TYPE[tx.type] ?? {
                      label: tx.type,
                      className: "bg-gray-100 text-gray-600",
                      sign: "",
                    };
                    return (
                      <div
                        key={tx.id}
                        className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{tx.note}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDateTime(tx.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold ml-3 ${tx.type === "REDEEM" ? "text-blue-600" : "text-green-600"}`}
                        >
                          {config.sign}
                          {tx.points.toLocaleString("vi-VN")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ERPLayout>
  );
}
