"use client";

import { Button } from "@/components/ui/button";
import { ComingSoonDialog } from "@/components/ui/coming-soon-dialog";
import { logout } from "@/lib/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Settings, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState, useTransition } from "react";

interface NavBarProps {
  userName: string;
  userEmail: string;
  isAdmin?: boolean;
}

export function NavBar({ userName, userEmail, isAdmin = false }: NavBarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navItems = isAdmin
    ? [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, comingSoon: false },
        { href: "/admin/clients", label: "Clients", icon: Phone, comingSoon: true },
        { href: "/admin/settings", label: "Settings", icon: Settings, comingSoon: true },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, comingSoon: false },
        { href: "/dashboard/call-history", label: "Call History", icon: Phone, comingSoon: false },
        { href: "/dashboard/settings", label: "Settings", icon: Settings, comingSoon: false },
        { href: "/dashboard/billing", label: "Billing", icon: CreditCard, comingSoon: false },
      ];

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg font-bold text-white">BS</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                BookedSolid AI
              </span>
              {isAdmin && (
                <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const className = `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`;

              if (item.comingSoon) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setComingSoonOpen(true)}
                    className={className}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={className}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isPending}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const className = `block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 ${
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`;

              if (item.comingSoon) {
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setComingSoonOpen(true);
                    }}
                    className={className}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={className}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t">
            <div className="px-4 mb-3">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start px-4"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      )}

      {/* Coming Soon Dialog */}
      <ComingSoonDialog
        isOpen={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
      />
    </nav>
  );
}
