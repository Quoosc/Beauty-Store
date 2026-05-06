import { redirect } from "next/navigation";

/**
 * Root page — redirect về /login
 * Middleware sẽ xử lý: nếu đã có cookie jwt → redirect đến dashboard theo role
 */
export default function RootPage() {
  redirect("/login");
}
