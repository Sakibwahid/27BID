import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Info,
  LogOut,
  Medal,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase/config";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/auction", label: "Auction", Icon: Trophy },
  { to: "/user/squad", label: "Squad", Icon: UsersRound, authenticatedOnly: true },
  { to: "/players", label: "Player market", Icon: Search },
  { to: "/about", label: "About", Icon: Info },
];

const desktopLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
    isActive
      ? "bg-fifa-elevated text-fifa-text"
      : "text-fifa-text-secondary hover:bg-fifa-elevated hover:text-fifa-text"
  }`;

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const dashboardPath = userData?.role === "admin" ? "/admin" : "/user";
  const homePath = user ? dashboardPath : "/";
  const isHomePage = pathname === "/";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 hidden border-b border-fifa-border bg-fifa-surface/80 text-fifa-text backdrop-blur-xl md:block">
      <nav
        className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link
          to={homePath}
          className="group flex shrink-0 items-center gap-3"
          aria-label="Auction22 home"
        >
          
          <span className="font-[orbitron] text-sm font-bold tracking-[0.13em] text-fifa-text sm:text-base">
            AUCTION<span className="text-fifa-accent">22</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links
            .filter(({ authenticatedOnly }) => !authenticatedOnly || user)
            .map(({ to, label, Icon }) => {
            const target = to === "/" ? homePath : to;
            return (
              <NavLink
                key={to}
                to={target}
                end={to === "/"}
                className={desktopLinkClass}
              >
                {Icon && <Icon size={15} />}
                {label}
              </NavLink>
            );
          })}
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

      </nav>
    </header>
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-fifa-border/80 bg-fifa-surface/75 pb-[env(safe-area-inset-bottom)] text-fifa-text shadow-[0_-8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
        <NavLink
          to={homePath}
          end
          aria-label="Home"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition ${
              isActive
                ? "text-fifa-accent"
                : "text-fifa-text-secondary hover:text-fifa-text"
            }`
          }
        >
          <span className="font-[orbitron] text-xl font-bold tracking-[0.08em]">
            22
          </span>
          <span className="sr-only">Home</span>
        </NavLink>
        <NavLink
          to="/auction"
          aria-label="Auction"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center justify-center transition ${
              isActive
                ? "text-fifa-accent"
                : "text-fifa-text-secondary hover:text-fifa-text"
            }`
          }
        >
          <Trophy size={22} aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/user/squad"
          aria-label="Squad"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center justify-center transition ${
              isActive
                ? "text-fifa-accent"
                : "text-fifa-text-secondary hover:text-fifa-text"
            }`
          }
        >
          <UsersRound size={22} aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/players"
          aria-label="Player market"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center justify-center transition ${
              isActive
                ? "text-fifa-accent"
                : "text-fifa-text-secondary hover:text-fifa-text"
            }`
          }
        >
          <Search size={22} aria-hidden="true" />
        </NavLink>
        <NavLink
          to="/tournamentstats"
          aria-label="Tournament standings"
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center justify-center transition ${
              isActive
                ? "text-fifa-accent"
                : "text-fifa-text-secondary hover:text-fifa-text"
            }`
          }
        >
          <Medal size={22} aria-hidden="true" />
        </NavLink>
      </div>
    </nav>
    </>
  );
}
