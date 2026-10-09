import React from "react";
import { NavLink } from "react-router-dom";
import { ShoppingCart, Package, Users, FileText, BookOpen } from "lucide-react";

const links = [
  { to: "/", label: "پوائنٹ آف سیل", icon: ShoppingCart },
  { to: "/products", label: "پروڈکٹس", icon: Package },
  { to: "/clients", label: "کلائنٹس", icon: Users },
  { to: "/ledger", label: "لیجر / کھاتہ", icon: BookOpen },
  { to: "/reports", label: "رپورٹس", icon: FileText },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white min-h-screen p-4 shadow-xl">
      <div className="text-center py-6 border-b border-blue-700 mb-4">
        <div className="text-4xl mb-2">🥚</div>
        <h1 className="text-xl font-bold leading-loose">انڈہ ہول سیل شاپ</h1>
        <p className="text-xs text-blue-200 mt-1">پوائنٹ آف سیل سسٹم</p>
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all leading-loose ${
                  isActive
                    ? "bg-white text-blue-900 shadow-lg font-bold"
                    : "hover:bg-blue-700 text-blue-100"
                }`
              }
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="absolute bottom-4 left-4 right-4 text-xs text-blue-200 text-center border-t border-blue-700 pt-4">
        | &copy; 2024 HB Digital | All Rights Reserved |
      </div>
    </aside>
  );
}
