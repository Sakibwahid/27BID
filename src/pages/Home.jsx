import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Anchor } from "../components/ui/Anchor";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user, userData } = useAuth();
  const dashboardPath = userData?.role === "admin" ? "/admin" : "/user";

  return (
    <main className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center justify-center overflow-hidden bg-fifa-bg px-2 py-12 text-center sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[26rem] w-[38rem] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E633D]/30 blur-[110px]"
      />
      <section className="flex w-full max-w-7xl flex-col items-center gap-8 sm:gap-10">
        <h1 className="flex flex-col items-center whitespace-nowrap font-[manrope] text-[clamp(.15rem,7.6vw,5.75rem)] font-bold leading-[1.08] tracking-[-0.07em]">
          <span className="home-headline-line  text-text-fifa-text-secondary">SAME GAME,</span>
          <span className="home-headline-line-delayed text-text-fifa-text">
            DIFFERENT EXPERIENCE
          </span>
        </h1>

        <div className="flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Anchor
            to={user ? dashboardPath : "/signup"}
            className="w-full sm:w-auto"
          >
            <span className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-fifa-accent px-6 py-3 text-sm font-semibold text-fifa-bg transition hover:bg-fifa-accent-hover sm:w-auto">
              {user ? "Go to your dashboard" : "Create your account"}
              <ArrowUpRight size={17} />
            </span>
          </Anchor>
          <Anchor to="/about" className="w-full sm:w-auto">
            <span className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-fifa-border px-6 py-3 text-sm font-medium text-fifa-text transition hover:border-fifa-accent/40 hover:bg-fifa-elevated sm:w-auto">
              Discover how it works
              <ArrowRight size={16} />
            </span>
          </Anchor>
        </div>
      </section>
    </main>
  );
};

export default Home;
