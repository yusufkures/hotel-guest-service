"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: "▦" },
  { label: "Guest Homepage", href: "/admin/services", icon: "⌂" },
  { label: "Restaurants & Menus", href: "/admin/restaurants", icon: "♨" },
  { label: "Staff & Permissions", href: "/admin/staff", icon: "♙" },
  { label: "Guest Requests", href: "/admin/requests", icon: "☷" },
  { label: "Rooms & QR Codes", href: "/admin/rooms", icon: "⌑" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-6 px-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          The Biltmore
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Administration
        </h2>
      </div>

      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {menuItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span aria-hidden="true" className="text-lg">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="mt-6 block rounded-lg px-3 py-3 text-sm text-slate-500 hover:bg-slate-100"
      >
        Back to Guest Homepage
      </Link>
    </aside>
  );
}
