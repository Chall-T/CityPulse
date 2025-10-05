import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface AdminLayoutProps {
    children: ReactNode;
}

const navItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Events", path: "/admin/events" },
    { name: "Reports", path: "/admin/reports" },
    { name: "Categories", path: "/admin/categories" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 transform bg-white shadow-lg transition-transform duration-200 ease-in-out w-64 z-30 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Admin Panel</h2>
                    <button className="md:hidden" onClick={() => setOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-3 py-2 rounded-md font-medium transition ${location.pathname === item.path
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen w-full">

                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>

        </div>
    );
}
