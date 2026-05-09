import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, BedDouble, User, Users, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Community", href: "/community", icon: Users },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "Market", href: "/marketplace", icon: ShoppingBag },
  { label: "Rooms", href: "/rooms", icon: BedDouble },
  { label: "Profile", href: "/dashboard", icon: User },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 pb-safe font-sans">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-colors duration-200",
                isActive
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-all relative",
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 rounded-lg blur-[2px]" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors relative z-10",
                    isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-zinc-500"
                  )}
                />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
