import { createElement } from "react";
import { Anchor } from "../components/ui/Anchor";
import {
  ArrowUpRight,
  Database,
  Gavel,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const workflow = [
  {
    step: "01",
    to: "/upload",
    label: "Add player roster",
    description: "Import players when you're ready to populate the market.",
    Icon: Database,
    action: "Import players",
  },
  {
    step: "02",
    to: "/admin/auction",
    label: "Auction control",
    description: "Set up and manage the auction room.",
    Icon: Gavel,
    action: "Open controls",
  },
  {
    step: "03",
    to: "/admin/updatetournament",
    label: "Tournament results",
    description: "Update club standings and record tournament outcomes.",
    Icon: Trophy,
    action: "Manage results",
  },
];

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-fifa-bg px-4 py-8 text-fifa-text sm:px-7 sm:py-12 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-fifa-text-muted">
              <ShieldCheck size={14} />
              Admin workspace
            </div>
            <h1 className="mt-4 font-[manrope] font-bold text-3xl font-medium tracking-[-0.05em] text-fifa-text sm:text-5xl">
              Control room
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-fifa-text-secondary sm:text-base sm:leading-7">
              Set up the player market, run auctions, and keep the competition
              moving from one place.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-fifa-border bg-fifa-surface px-4 py-3 sm:self-auto">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fifa-elevated text-fifa-text-secondary">
              <Database size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-fifa-text">Player market</p>
              <p className="mt-0.5 text-xs text-fifa-text-muted">
                Ready for your roster
              </p>
            </div>
          </div>
        </header>

        {/* Next step banner */}
        <section
          aria-label="Next step"
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-fifa-border bg-fifa-surface p-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fifa-accent"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fifa-text-muted">
                Next step
              </p>
              <h2 className="mt-1.5 text-lg font-medium tracking-tight text-fifa-text sm:text-xl">
                Import your player roster
              </h2>
              <p className="mt-1 max-w-lg text-sm leading-6 text-fifa-text-secondary">
                Player listings will appear as records are added.
              </p>
            </div>
          </div>
          <Anchor
            to="/upload"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-fifa-accent px-5 py-2.5 text-sm font-semibold text-fifa-bg transition hover:bg-fifa-accent-hover"
          >
            Add players <ArrowUpRight size={16} />
          </Anchor>
        </section>

        {/* Workflow */}
        <section aria-label="Workflow" className="mt-10 sm:mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fifa-text-muted">
              Workflow
            </h2>
            <span className="hidden text-xs text-fifa-text-muted sm:block">
              Choose an action to continue
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            {workflow.map(({ step, to, label, description, Icon, action }) => (
              <Anchor
                key={to}
                to={to}
                className="group flex min-h-48 flex-col rounded-2xl border border-fifa-border bg-fifa-surface p-5 transition hover:border-fifa-text-muted hover:bg-fifa-card sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-[manrope] text-sm tracking-tight text-fifa-text-muted">
                    {step}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-fifa-border bg-fifa-elevated text-fifa-text-secondary">
                    {createElement(Icon, { size: 20 })}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-medium text-fifa-text">
                    {label}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-fifa-text-muted">
                    {description}
                  </p>
                </div>

                <span className="mt-auto flex items-center justify-between border-t border-fifa- pt-4 text-xs font-medium text-fifa-text-secondary transition group-hover:text-fifa-accent">
                  {action}
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
              </Anchor>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;