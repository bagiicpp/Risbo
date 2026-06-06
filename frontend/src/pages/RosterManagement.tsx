import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Loader2,
  AlertCircle,
  ChevronRight,
  Activity,
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Athlete {
  id: string;
  name: string;
  email: string;
  status: string;
}

export default function RosterManagement() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const res = await api.get("/roster/athletes");
      setAthletes(res.data);
    } catch (error) {
      console.error("Failed to fetch roster:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteLoading(true);

    try {
      await api.post("/roster/invite", { email: inviteEmail });

      // Reset state and close modal
      setInviteEmail("");
      setIsInviteOpen(false);

      // Re-fetch to seamlessly update the table
      await fetchRoster();
    } catch (err: any) {
      // Explicitly catch the 400 and 404 from FastAPI
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 404) {
        setInviteError("User not found, or not registered as an athlete.");
      } else if (status === 400) {
        setInviteError(detail || "Invalid invite request.");
      } else {
        setInviteError("An unexpected system error occurred.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const filteredAthletes = athletes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bricolage font-bold text-foreground tracking-tight">
                Manage Roster
              </h1>
              <p className="text-muted-foreground mt-1">
                Invite athletes to your team to monitor their telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input
                  placeholder="Search athletes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full md:w-64 bg-background border-border/50 focus:border-primary/50"
                />
              </div>
              <Button
                onClick={() => setIsInviteOpen(true)}
                className="font-semibold shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-all cursor-pointer"
              >
                <UserPlus size={16} className="mr-2" />
                Invite Athlete
              </Button>
            </div>
          </div>

          {/* High-Density Data Table */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5 pl-2">Athlete / Email</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3">System ID</div>
              <div className="col-span-1 text-right pr-2">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-4 p-4 items-center animate-pulse"
                  >
                    <div className="col-span-5 flex flex-col gap-2 pl-2">
                      <div className="h-4 bg-border/40 rounded w-1/2" />
                      <div className="h-3 bg-border/40 rounded w-3/4" />
                    </div>
                    <div className="col-span-3 h-5 bg-border/40 rounded-full w-16" />
                    <div className="col-span-3 h-4 bg-border/40 rounded w-full" />
                    <div className="col-span-1 h-5 bg-border/40 rounded w-5 justify-self-end mr-2" />
                  </div>
                ))
              ) : filteredAthletes.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-muted-foreground border-dashed border-2 border-border/50 m-4 rounded-xl bg-background/50">
                  <Activity size={32} className="mb-3 opacity-50" />
                  <span className="font-medium">No athletes found</span>
                  <span className="text-sm mt-1 text-center max-w-sm">
                    Your roster is currently empty. Click "Invite Athlete" to
                    send an authorization request.
                  </span>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredAthletes.map((athlete, index) => (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 cursor-pointer transition-colors group"
                    >
                      <div className="col-span-5 pl-2 flex flex-col truncate">
                        <span className="font-semibold text-foreground truncate">
                          {athlete.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                          {athlete.email}
                        </span>
                      </div>

                      <div className="col-span-3 flex items-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            athlete.status === "active"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                          }`}
                        >
                          {athlete.status}
                        </span>
                      </div>

                      <div className="col-span-3 font-mono text-xs text-muted-foreground truncate">
                        {athlete.id}
                      </div>

                      <div className="col-span-1 flex justify-end pr-2 opacity-50 group-hover:opacity-100 transition-all group-hover:text-primary">
                        <ChevronRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Strict Industrial Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-2xl font-dmsans">
          <DialogHeader>
            <DialogTitle className="text-xl font-bricolage font-bold text-foreground">
              Invite Athlete
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Enter the email address of a registered Risbo athlete to link
              their telemetry to your dashboard.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="athlete@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="bg-background border-border/50 h-11"
              />
            </div>

            <AnimatePresence>
              {inviteError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-sm font-medium">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{inviteError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                className="border-border/50 hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteLoading || !inviteEmail.trim()}
              >
                {inviteLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Send Invite"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
