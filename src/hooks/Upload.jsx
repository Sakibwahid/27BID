import { useState } from "react";
import { ArrowLeft, Database, UploadCloud } from "lucide-react";
import { uploadPlayersToFirestore } from "../uploadPlayers";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function Upload() {
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const handleUpload = async () => {
    setStatus({ type: "loading", message: "" });
    try {
      const { uploaded } = await uploadPlayersToFirestore();
      localStorage.removeItem("player_filter_cache");
      setStatus({
        type: "success",
        message: `${uploaded} player${uploaded === 1 ? "" : "s"} imported successfully.`,
      });
    } catch (error) {
      console.error("Player import failed:", error);
      setStatus({
        type: "error",
        message: error.message || "Player import failed. Please try again.",
      });
    }
  };

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-fifa-bg px-4 py-10 text-fifa-text sm:px-6 sm:py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-fifa-border bg-fifa-surface p-5 sm:p-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-fifa-text-muted transition hover:text-fifa-text"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl border border-fifa-accent/20 bg-fifa-accent/[0.07] text-fifa-accent">
          <Database size={21} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fifa-text">
          Import player roster
        </h1>
        <p className="mt-3 text-sm leading-6 text-fifa-text-secondary">
          Import the prepared CSV into the player database when you are ready.
          Nothing is uploaded until you start the import.
        </p>

        <div className="mt-6 rounded-xl border border-fifa-warning/20 bg-fifa-warning/[0.05] p-4 text-sm leading-6 text-fifa-text-secondary">
          This writes player records to the live database. Review your CSV and
          confirm before continuing.
        </div>

        {status.message && (
          <p
            role={status.type === "error" ? "alert" : "status"}
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              status.type === "error"
                ? "border-fifa-danger/25 bg-fifa-danger/[0.06] text-fifa-danger"
                : "border-fifa-success/25 bg-fifa-success/[0.06] text-fifa-success"
            }`}
          >
            {status.message}
          </p>
        )}

        <Button
          type="button"
          onClick={handleUpload}
          disabled={status.type === "loading"}
          className="mt-6 inline-flex min-h-11 w-full items-center gap-2 rounded-xl bg-fifa-accent px-5 font-medium text-fifa-bg shadow-none disabled:cursor-wait disabled:opacity-60"
        >
          <UploadCloud size={17} />
          {status.type === "loading" ? "Importing roster..." : "Start import"}
        </Button>
      </section>
    </main>
  );
}