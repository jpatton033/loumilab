import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Inbox, Eye, MessageSquare, Archive, RefreshCw } from "lucide-react";

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

const statusConfig: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Inbox }> = {
  new: { label: "New", variant: "default", icon: Inbox },
  read: { label: "Read", variant: "secondary", icon: Eye },
  responded: { label: "Responded", variant: "outline", icon: MessageSquare },
  archived: { label: "Archived", variant: "outline", icon: Archive },
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some((r: { role: string }) => r.role === "admin")) {
      navigate("/login");
      return;
    }

    fetchSubmissions();
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load submissions.", variant: "destructive" });
    } else {
      setSubmissions((data as Submission[]) || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: SubmissionStatus) => {
    const { error } = await supabase
      .from("contact_submissions")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    } else {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
      toast({ title: "Updated", description: `Status changed to ${status}.` });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filtered = filterStatus === "all"
    ? submissions
    : submissions.filter((s) => s.status === filterStatus);

  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === "new").length,
    read: submissions.filter((s) => s.status === "read").length,
    responded: submissions.filter((s) => s.status === "responded").length,
  };

  return (
    <Layout>
      <section className="section-padding pt-32 lg:pt-40">
        <div className="section-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage contact form submissions</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchSubmissions}>
                <RefreshCw size={14} /> Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={14} /> Sign Out
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "New", value: stats.new, color: "text-accent" },
              { label: "Read", value: stats.read, color: "text-muted-foreground" },
              { label: "Responded", value: stats.responded, color: "text-green-400" },
            ].map((stat) => (
              <div key={stat.label} className="surface-elevated rounded-lg p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Submissions list */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-secondary/50">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{filtered.length} submissions</span>
              </div>

              {loading ? (
                <p className="text-muted-foreground py-8 text-center">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No submissions yet.</p>
              ) : (
                <div className="surface-elevated rounded-lg overflow-hidden">
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
                      {filtered.map((s) => {
                        const config = statusConfig[s.status];
                        return (
                          <TableRow
                            key={s.id}
                            className={`cursor-pointer ${selectedSubmission?.id === s.id ? "bg-accent/10" : ""}`}
                            onClick={() => setSelectedSubmission(s)}
                          >
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-muted-foreground">{s.email}</TableCell>
                            <TableCell>
                              <Badge variant={config.variant}>{config.label}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(s.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="surface-elevated rounded-lg p-6">
              {selectedSubmission ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedSubmission.name}</h3>
                    <Badge variant={statusConfig[selectedSubmission.status].variant}>
                      {statusConfig[selectedSubmission.status].label}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Email:</span> {selectedSubmission.email}</p>
                    {selectedSubmission.company && (
                      <p><span className="text-muted-foreground">Company:</span> {selectedSubmission.company}</p>
                    )}
                    {selectedSubmission.budget && (
                      <p><span className="text-muted-foreground">Budget:</span> {selectedSubmission.budget}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {new Date(selectedSubmission.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium mb-2">Message</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSubmission.message}</p>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {(["new", "read", "responded", "archived"] as SubmissionStatus[]).map((status) => (
                        <Button
                          key={status}
                          variant={selectedSubmission.status === status ? "accent" : "outline"}
                          size="sm"
                          onClick={() => updateStatus(selectedSubmission.id, status)}
                        >
                          {statusConfig[status].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Inbox size={32} className="mx-auto mb-3 opacity-50" />
                  <p>Select a submission to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
