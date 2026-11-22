import React, { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CircleDot,
  Info,
  LogOut,
  Menu,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase/config";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/auction", label: "Auction", Icon: Trophy },
  { to: "/about", label: "About", Icon: Info },
];

const desktopLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
    isActive
      ? "bg-fifa-elevated text-fifa-text"
      : "text-fifa-text-secondary hover:bg-fifa-elevated hover:text-fifa-text"
  }`;

const mobileLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
    isActive
      ? "bg-fifa-accent/10 text-fifa-accent"
      : "text-fifa-text-secondary hover:bg-fifa-elevated hover:text-fifa-text"
  }`;

export function Navbar() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const dashboardPath = userData?.role === "admin" ? "/admin" : "/user";
  const isHomePage = pathname === "/";

  const closeMenu = () => setMobileMenu(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      closeMenu();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-fifa-border bg-fifa-surface text-fifa-text backdrop-blur-xl">
      <nav
        className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3"
          aria-label="Auction22 home"
        >
          
          <span className="font-[orbitron] text-sm font-bold tracking-[0.13em] text-fifa-text sm:text-base">
            AUCTION<span className="text-fifa-accent">22</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={desktopLinkClass}
            >
              {Icon && <Icon size={15} />}
              {label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/user/squad" className={desktopLinkClass}>
              <UserRound size={15} />
              Squad
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="rounded-full px-4 py-2 text-sm text-fifa-text-secondary transition hover:text-fifa-text"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-fifa-border text-fifa-text-secondary transition hover:border-fifa-danger/50 hover:text-fifa-danger"
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm text-fifa-text-secondary transition hover:text-fifa-text"
              >
                Sign in
              </Link>
              {!isHomePage && (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-fifa-accent px-4 py-2.5 text-sm font-semibold text-fifa-bg transition hover:bg-fifa-accent-hover"
                >
                  Get started <ArrowUpRight size={16} />
                </Link>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenu((open) => !open)}
          aria-label={mobileMenu ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenu}
          aria-controls="mobile-navigation"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-fifa-border text-fifa-text-secondary transition hover:bg-fifa-elevated hover:text-fifa-text md:hidden"
        >
          {mobileMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileMenu && (
        <div
          id="mobile-navigation"
          className="border-t border-fifa-border bg-fifa-surface px-4 pb-5 pt-3 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={closeMenu}
                className={mobileLinkClass}
              >
                {Icon && <Icon size={17} />}
                {label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink
                  to="/user/squad"
                  onClick={closeMenu}
                  className={mobileLinkClass}
                >
                  <UserRound size={17} /> Squad
                </NavLink>
                <Link
                  to={dashboardPath}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm text-fifa-text-secondary hover:bg-fifa-elevated hover:text-fifa-text"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-fifa-text-secondary hover:bg-fifa-elevated hover:text-fifa-text"
                >
                  <LogOut size={17} /> Sign out
                </button>
              </>
            ) : (
              <div
                className={`mt-2 grid gap-3 border-t border-fifa-border pt-4 ${
                  isHomePage ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-full border border-fifa-border px-4 py-3 text-center text-sm text-fifa-text"
                >
                  Sign in
                </Link>
                {!isHomePage && (
                  <Link
                    to="/signup"
                    onClick={closeMenu}
                    className="rounded-full bg-fifa-accent px-4 py-3 text-center text-sm font-semibold text-fifa-bg"
                  >
                    Get started
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
