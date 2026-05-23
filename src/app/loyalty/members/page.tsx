"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Heart, Phone, Search, Star, UserPlus, Users } from "lucide-react";
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

function LookupPanel() {
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
      toast.success("Dang ky thanh vien thanh cong");
    } catch {
      toast.error("Dang ky that bai, vui long kiem tra lai so dien thoai");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-[var(--cela-paper)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Tra cứu thành viên</h3>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setMember(null);
                setNotFound(false);
              }}
              placeholder="Nhập số điện thoại..."
              className="h-11 w-full pl-9 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
              style={{ border: "1px solid var(--cela-mist)" }}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !phone.trim()}
            className="h-11 px-5 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {isSearching ? "Đang tìm..." : "ìm kiếm"}
          </button>
        </form>
      </div>

      {member && (
        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[var(--cela-rose)] rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">{member.fullName[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-[var(--cela-espresso)]">{member.fullName}</p>
              <p className="text-sm text-[var(--cela-stone)]">{member.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[rgba(201,168,122,0.14)] rounded-lg p-3 text-center">
              <p className="text-[28px] font-bold text-[var(--cela-gold)]">
                {member.pointBalance.toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-[var(--cela-gold)] mt-1">Điểm hiện có</p>
            </div>

            <div className="bg-[var(--cela-fog)] rounded-lg p-3 text-center">
              <p className="text-sm font-bold text-[var(--cela-cocoa)]">
                {new Date(member.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-xs text-[var(--cela-stone)] mt-1">Ngày tham gia</p>
            </div>
          </div>
        </div>
      )}

      {notFound && !showRegister && (
        <div className="bg-[var(--cela-paper)] rounded-xl p-6 text-center">
          <Users className="w-12 h-12 text-[var(--cela-mist)] mx-auto mb-3" />
          <p className="text-[var(--cela-stone)] mb-4">Không tìm thấy thành viên với số điện thoại này</p>
          <button
            onClick={() => {
              setShowRegister(true);
              setRegPhone(phone);
            }}
            className="px-5 py-2.5 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            Đăng ký thành viên mới
          </button>
        </div>
      )}

      {showRegister && (
        <div className="bg-[var(--cela-paper)] rounded-xl p-6">
          <h3 className="font-semibold text-[var(--cela-espresso)] mb-4">Đăng ký thành viên mới</h3>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nguyen Thi An"
                className="h-11 w-full rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{ border: "1px solid var(--cela-mist)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cela-cocoa)] mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0901234567"
                className="h-11 w-full rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                style={{ border: "1px solid var(--cela-mist)" }}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="flex-1 h-11 rounded-xl text-sm font-medium text-[var(--cela-cocoa)] hover:bg-[var(--cela-fog)]"
                style={{ border: "1px solid var(--cela-mist)" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isRegistering || !regName.trim() || !regPhone.trim()}
                className="flex-1 h-11 bg-[var(--cela-espresso)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
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

  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isCashier) return;

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
  }, [isCashier, search, page]);

  const totalPoints = members.reduce((sum, m) => sum + m.pointBalance, 0);

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-[var(--cela-rose)]" />
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--cela-cocoa)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              BEAUTY ERP
            </p>
            <h1
              style={{
                fontFamily: "var(--cela-display)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--cela-espresso)",
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              Thanh viên <span style={{ color: "var(--cela-rose)" }}>Loyalty</span>
            </h1>
          </div>
        </div>

        <LookupPanel />

        {!isCashier && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  icon: Users,
                  label: "Tổng thành viên",
                  value: totalElements.toLocaleString("vi-VN"),
                  color: "text-[var(--cela-cocoa)]",
                  bg: "bg-[rgba(120,140,180,0.12)]",
                },
                {
                  icon: Star,
                  label: "Tổng điểm hiện có",
                  value: `${totalPoints.toLocaleString("vi-VN")} điểm`,
                  color: "text-[var(--cela-gold)]",
                  bg: "bg-[rgba(201,168,122,0.14)]",
                },
                {
                  icon: UserPlus,
                  label: "Thành viên mới",
                  value: "-",
                  color: "text-[var(--cela-success)]",
                  bg: "bg-[rgba(107,142,106,0.10)]",
                },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-[var(--cela-paper)] rounded-xl p-5 flex items-center gap-4">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--cela-stone)]">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl p-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cela-stone)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Tìm theo tên hoặc SDT..."
                  className="h-10 w-full pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(183,110,121,0.18)]"
                  style={{ border: "1px solid var(--cela-mist)" }}
                />
              </div>
            </div>

            <div className="bg-[var(--cela-paper)] rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <svg className="animate-spin w-6 h-6 text-[var(--cela-rose)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <Heart className="w-12 h-12 text-[var(--cela-mist)] mb-3" />
                  <p className="text-[var(--cela-stone)]">Chưa có thành viên nào</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-[var(--cela-fog)] text-xs text-[var(--cela-stone)] uppercase" style={{ borderBottom: "1px solid var(--cela-mist)" }}>
                    <tr>
                      <th className="text-left px-6 py-3">Họ tên</th>
                      <th className="text-left px-4 py-3">Mã thành viên</th>
                      <th className="text-left px-4 py-3">Số điện thoại</th>
                      <th className="text-right px-4 py-3">Điểm hiện có</th>
                      <th className="text-left px-4 py-3">Ngày đăng ký</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-[var(--cela-fog)] transition-colors"
                        style={{ borderBottom: "1px solid var(--cela-fog)" }}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-[var(--cela-espresso)]">{member.fullName}</td>
                        <td className="px-4 py-4 text-sm font-mono text-[var(--cela-stone)]">{member.memberCode}</td>
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{member.phone}</td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-[var(--cela-rose)]">
                            {member.pointBalance.toLocaleString("vi-VN")} điểm
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-[var(--cela-stone)]">{formatDate(member.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--cela-stone)]">Trang {page + 1} / {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)]"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  >
                    Truoc
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--cela-fog)]"
                    style={{ border: "1px solid var(--cela-mist)" }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ERPLayout>
  );
}
