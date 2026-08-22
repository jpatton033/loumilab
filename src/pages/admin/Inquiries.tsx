import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, Copy, Eye, Inbox, MessageSquare } from "lucide-react";

type SubmissionStatus = "new" | "read" | "responded" | "archived";

interface Submission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  budget: string | null;
  message: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<
  SubmissionStatus,
  { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Inbox }
> = {
  new: { label: "New", variant: "default", icon: Inbox },
  read: { label: "Read", variant: "secondary", icon: Eye },
  responded: { label: "Responded", variant: "outline", icon: MessageSquare },
  archived: { label: "Archived", variant: "outline", icon: Archive },
};

const AdminInquiries = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | SubmissionStatus>("all");
  const [search, setSearch] = useState("");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: async (): Promise<Submission[]> => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter(
      (s) =>
        (filterStatus === "all" || s.status === filterStatus) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.company ?? "").toLowerCase().includes(q)),
    );
  }, [submissions, filterStatus, search]);

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin"] });
    toast({ title: "Status updated", description: `Marked as ${status}.` });
  };

  const copyEmail = async (email: string) => {
    await navigator.clipboard.writeText(email);
    toast({ title: "Email copied", description: email });
  };

  return (
    <AdminShell title="Inquiries" description="Client inquiries submitted through the contact form.">
      <SEOHead title="Inquiries | Loumilab Admin" description="Manage client inquiries." path="/admin/inquiries" noindex />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, company…"
              className="max-w-xs"
            />
            {(["all", "new", "read", "responded", "archived"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filterStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No inquiries match this filter.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className={`cursor-pointer ${selectedId === s.id ? "bg-accent/10" : ""}`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.email}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[s.status].variant}>{statusConfig[s.status].label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">{selected.name}</h2>
                <Badge variant={statusConfig[selected.status].variant}>
                  {statusConfig[selected.status].label}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="truncate">{selected.email}</span>
                  <button
                    type="button"
                    onClick={() => copyEmail(selected.email)}
                    className="text-muted-foreground transition-colors hover:text-accent"
                    aria-label="Copy email"
                  >
                    <Copy size={13} />
                  </button>
                </p>
                {selected.company && (
                  <p>
                    <span className="text-muted-foreground">Company:</span> {selected.company}
                  </p>
                )}
                {selected.budget && (
                  <p>
                    <span className="text-muted-foreground">Budget:</span> {selected.budget}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium">Message</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{selected.message}</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {(["new", "read", "responded", "archived"] as SubmissionStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant={selected.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStatus(selected.id, status)}
                    >
                      {statusConfig[status].label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`mailto:${selected.email}?subject=Re: your Loumilab inquiry`}>Reply by email</a>
              </Button>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox size={30} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select an inquiry to view details</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminInquiries;
