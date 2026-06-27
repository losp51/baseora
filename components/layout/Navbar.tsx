"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { NetworkBadge }  from "@/components/ui/NetworkBadge";
import { cn } from "@/lib/utils";
import { Menu, X, Zap, Sun, Moon } from "lucide-react";

const NAV_LINKS = [
  { href: "/swap",        label: "Swap" },
  { href: "/agent",       label: "AI Agent" },
  { href: "/stats",       label: "Stats" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile",     label: "Profile" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const isLight = resolvedTheme === "light";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-xl"
         style={{ borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/swap" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-base flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Baseora</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                    isActive
                      ? "text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                  )}
                  style={isActive ? { color: "var(--text-primary)" } : undefined}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-base-blue"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NetworkBadge className="hidden sm:flex" />

            {/* Theme toggle — hidden on mobile */}
            <button
              onClick={() => setTheme(isLight ? "dark" : "light")}
              className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center transition-all hover:bg-bg-secondary border border-border"
              title={isLight ? "Switch to dark mode" : "Switch to light mode"}
              style={{ borderColor: "var(--border)" }}
            >
              {isLight
                ? <Moon className="w-4 h-4 text-text-secondary" />
                : <Sun  className="w-4 h-4 text-text-secondary" />
              }
            </button>

            <ConnectButton />

            <button
              className="md:hidden p-3 rounded-lg hover:bg-bg-secondary transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen
                ? <X    className="w-5 h-5 text-text-secondary" />
                : <Menu className="w-5 h-5 text-text-secondary" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border backdrop-blur-xl"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-base-blue/10 text-base-blue border border-base-blue/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 pb-1 flex items-center gap-3">
                <NetworkBadge />
                <button
                  onClick={() => setTheme(isLight ? "dark" : "light")}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all"
                >
                  {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  {isLight ? "Dark mode" : "Light mode"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
