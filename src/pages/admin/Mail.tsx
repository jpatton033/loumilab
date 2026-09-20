import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import MailEditor from "@/components/admin/mail/MailEditor";
import RecipientField from "@/components/admin/mail/RecipientField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { buildBrandedEmail } from "@/lib/admin/mailFrame";
import {
  formatBytes,
  MAX_ATTACHMENT_TOTAL,
  saveDraft,
  uploadMailFile,
  useDeleteMessage,
  useDeleteTemplate,
  useMailMessages,
  useMailTemplates,
  useSaveSignature,
  useSaveTemplate,
  useSendMail,
  useSignature,
  type MailAttachment,
  type MailMessage,
  type MailTemplate,
} from "@/lib/admin/mail";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Mail as MailIcon,
  Paperclip,
  PenLine,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-700",
  queued: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  bounced: "bg-destructive/10 text-destructive",
  complained: "bg-destructive/10 text-destructive",
  suppressed: "bg-amber-500/10 text-amber-700",
  draft: "bg-muted text-muted-foreground",
};

const EMPTY_BODY = "<p></p>";

const Mail = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState("compose");

  // composer state
  const [draftId, setDraftId] = useState<string | undefined>();
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState(EMPTY_BODY);
  const [displayName, setDisplayName] = useState("Loumilab");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [attachments, setAttachments] = useState<MailAttachment[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [outcome, setOutcome] = useState<{ email: string; ok: boolean; error?: string }[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: signature = "" } = useSignature();
  const { data: sentMessages = [], isLoading: sentLoading } = useMailMessages("sent");
  const { data: drafts = [] } = useMailMessages("draft");
  const { data: templates = [] } = useMailTemplates();
  const send = useSendMail();
  const saveTemplate = useSaveTemplate();
  const deleteTemplate = useDeleteTemplate();
  const deleteMessage = useDeleteMessage();
  const saveSignatureMutation = useSaveSignature();

  const attachmentTotal = attachments.reduce((s, a) => s + a.size_bytes, 0);
  const hasContent = bodyHtml.replace(/<[^>]*>/g, "").trim().length > 0;

  const previewHtml = useMemo(
    () =>
      buildBrandedEmail({
        bodyHtml,
        signatureHtml: includeSignature ? signature : "",
        attachments: attachments.map((a) => ({ name: a.file_name, url: a.url ?? "#", size: a.size_bytes })),
      }),
    [bodyHtml, includeSignature, signature, attachments],
  );

  /* autosave draft every 20s once there is something worth keeping */
  useEffect(() => {
    if (!hasContent && !subject) return;
    const t = setTimeout(async () => {
      try {
        const id = await saveDraft({ id: draftId, to, cc, bcc, subject, bodyHtml, displayName, templateId });
        setDraftId(id);
      } catch {
        /* autosave stays quiet */
      }
    }, 20_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, cc, bcc, subject, bodyHtml, displayName, templateId]);

  const resetComposer = () => {
    setDraftId(undefined);
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject("");
    setBodyHtml(EMPTY_BODY);
    setAttachments([]);
    setTemplateId(null);
    setDisplayName("Loumilab");
  };

  const handleSaveDraft = async () => {
    try {
      const id = await saveDraft({ id: draftId, to, cc, bcc, subject, bodyHtml, displayName, templateId });
      setDraftId(id);
      toast({ title: "Draft saved" });
    } catch (e) {
      toast({ title: "Couldn't save the draft", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleUpload = async (file: File) => {
    if (attachmentTotal + file.size > MAX_ATTACHMENT_TOTAL) {
      throw new Error("That would take the attachments over 25 MB.");
    }
    const uploaded = await uploadMailFile(file);
    return uploaded.url!;
  };

  const addAttachment = async (file: File) => {
    if (attachmentTotal + file.size > MAX_ATTACHMENT_TOTAL) {
      toast({ title: "Too large", description: "Attachments must stay under 25 MB in total.", variant: "destructive" });
      return;
    }
    try {
      const uploaded = await uploadMailFile(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!to.length) return toast({ title: "Add at least one recipient", variant: "destructive" });
    if (!subject.trim()) return toast({ title: "Add a subject", variant: "destructive" });
    if (!hasContent) return toast({ title: "Write a message first", variant: "destructive" });

    try {
      const result = await send.mutateAsync({
        id: draftId,
        to,
        cc,
        bcc,
        subject,
        bodyHtml,
        displayName,
        templateId,
        attachments,
        includeSignature,
      });
      setOutcome(result.results);
      if (result.failed === 0) {
        toast({ title: `Sent to ${result.sent} ${result.sent === 1 ? "recipient" : "recipients"}` });
        resetComposer();
        setTab("sent");
      } else {
        toast({
          title: `${result.sent} sent, ${result.failed} failed`,
          description: "See the delivery list below.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Couldn't send", description: (e as Error).message, variant: "destructive" });
    }
  };

  const loadTemplate = (t: MailTemplate) => {
    setSubject(t.subject);
    setBodyHtml(t.body_html || EMPTY_BODY);
    setTemplateId(t.id);
    setTab("compose");
    toast({ title: `Started from “${t.name}”` });
  };

  const openDraft = (m: MailMessage) => {
    setDraftId(m.id);
    setTo(m.to_addresses ?? []);
    setCc(m.cc_addresses ?? []);
    setBcc(m.bcc_addresses ?? []);
    setShowCc(Boolean(m.cc_addresses?.length || m.bcc_addresses?.length));
    setSubject(m.subject);
    setBodyHtml(m.body_html || EMPTY_BODY);
    setDisplayName(m.display_name || "Loumilab");
    setTemplateId(m.template_id);
    setTab("compose");
  };

  const saveAsTemplate = async () => {
    const name = window.prompt("Template name");
    if (!name) return;
    try {
      await saveTemplate.mutateAsync({ name, subject, body_html: bodyHtml });
      toast({ title: "Template saved" });
    } catch (e) {
      toast({ title: "Couldn't save the template", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <AdminShell
      title="Mail"
      description="Write and send Loumilab-branded email"
      actions={
        <Button size="sm" variant="outline" onClick={resetComposer} className="gap-1.5">
          <PenLine className="h-4 w-4" /> New message
        </Button>
      }
    >
      <SEOHead title="Mail | Loumilab Admin" description="Send Loumilab-branded email." noindex />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="drafts">Drafts{drafts.length ? ` (${drafts.length})` : ""}</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="signature">Signature</TabsTrigger>
        </TabsList>

        {/* ------------------------------ COMPOSE ----------------------------- */}
        <TabsContent value="compose" className="space-y-4">
          <div className="space-y-2">
            <RecipientField label="To" value={to} onChange={setTo} withPicker />
            {showCc ? (
              <>
                <RecipientField label="Cc" value={cc} onChange={setCc} />
                <RecipientField label="Bcc" value={bcc} onChange={setBcc} />
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Add Cc / Bcc
              </button>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sender name"
                aria-label="Sender name"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sends from your verified Loumilab address · replies go to hello@loumilab.com · use{" "}
              <code className="rounded bg-muted px-1">{"{{first_name}}"}</code> for a personal greeting
            </p>
          </div>

          <MailEditor value={bodyHtml} onChange={setBodyHtml} onUploadImage={handleUpload} />

          {/* attachments */}
          <div className="rounded-2xl border border-border bg-background p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                <Paperclip className="h-4 w-4" /> Attach files
              </Button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  for (const f of files) await addAttachment(f);
                }}
              />
              <span className="text-xs text-muted-foreground">
                {formatBytes(attachmentTotal)} of 25 MB · files are sent as secure download links
              </span>
            </div>
            {attachments.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {attachments.map((a) => (
                  <li key={a.storage_path} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{a.file_name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(a.size_bytes)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${a.file_name}`}
                      onClick={() => setAttachments((prev) => prev.filter((p) => p.storage_path !== a.storage_path))}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSend} disabled={send.isPending} className="gap-1.5">
              <Send className="h-4 w-4" /> {send.isPending ? "Sending…" : `Send${to.length > 1 ? ` (${to.length})` : ""}`}
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} className="gap-1.5">
              <Save className="h-4 w-4" /> Save draft
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(true)} className="gap-1.5">
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <Button variant="ghost" onClick={saveAsTemplate} className="gap-1.5">
              <FileText className="h-4 w-4" /> Save as template
            </Button>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
              />
              Include my signature
            </label>
          </div>

          {outcome && (
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="mb-2 text-sm font-semibold">Delivery</p>
              <ul className="space-y-1 text-sm">
                {outcome.map((r) => (
                  <li key={r.email} className="flex items-start gap-2">
                    {r.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{r.email}</span>
                    {!r.ok && <span className="text-xs text-muted-foreground">{r.error}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* -------------------------------- SENT ------------------------------ */}
        <TabsContent value="sent">
          <MessageList
            messages={sentMessages}
            loading={sentLoading}
            emptyText="Nothing sent yet."
            onDelete={(id) => deleteMessage.mutate(id)}
          />
        </TabsContent>

        {/* ------------------------------- DRAFTS ----------------------------- */}
        <TabsContent value="drafts">
          {drafts.length === 0 ? (
            <EmptyState text="No saved drafts." />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-4">
                  <MailIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <button type="button" onClick={() => openDraft(d)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium">{d.subject || "(no subject)"}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {d.to_addresses?.join(", ") || "No recipients"} · saved{" "}
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMessage.mutate(d.id)} aria-label="Delete draft">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ------------------------------ TEMPLATES --------------------------- */}
        <TabsContent value="templates">
          {templates.length === 0 ? (
            <EmptyState text="No templates yet — write a message and choose “Save as template”." />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-4">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.subject || "(no subject)"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadTemplate(t)}>
                    Use
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTemplate.mutate(t.id)} aria-label="Delete template">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ------------------------------ SIGNATURE --------------------------- */}
        <TabsContent value="signature">
          <SignatureEditor
            initial={signature}
            onSave={async (html) => {
              await saveSignatureMutation.mutateAsync(html);
              toast({ title: "Signature saved" });
            }}
            onUploadImage={handleUpload}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            {(["desktop", "mobile"] as const).map((w) => (
              <Button
                key={w}
                type="button"
                size="sm"
                variant={previewWidth === w ? "default" : "outline"}
                onClick={() => setPreviewWidth(w)}
              >
                {w === "desktop" ? "Desktop" : "Phone"}
              </Button>
            ))}
          </div>
          <div className="overflow-auto rounded-xl border border-border bg-surface-subtle p-3">
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              className={cn("mx-auto h-[60vh] w-full border-0 bg-background", previewWidth === "mobile" && "max-w-[390px]")}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">{text}</div>
);

function MessageList({
  messages,
  loading,
  emptyText,
  onDelete,
}: {
  messages: MailMessage[];
  loading: boolean;
  emptyText: string;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState<MailMessage | null>(null);

  if (loading) return <EmptyState text="Loading…" />;
  if (!messages.length) return <EmptyState text={emptyText} />;

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
        {messages.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
            <button type="button" onClick={() => setOpen(m)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{m.subject || "(no subject)"}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {m.to_addresses?.join(", ")} · {new Date(m.sent_at ?? m.created_at).toLocaleString()}
                {m.sent_by_email ? ` · ${m.sent_by_email}` : ""}
              </span>
              {m.error_text && <span className="mt-1 block truncate text-xs text-destructive">{m.error_text}</span>}
            </button>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                STATUS_STYLES[m.status] ?? "bg-muted text-muted-foreground",
              )}
            >
              {m.status}
            </span>
            <Button variant="ghost" size="sm" onClick={() => onDelete(m.id)} aria-label="Remove from list">
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{open?.subject}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">To {open?.to_addresses?.join(", ")}</p>
          <iframe title="Sent message" srcDoc={open?.body_html ?? ""} className="h-[60vh] w-full rounded-xl border border-border bg-background" />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SignatureEditor({
  initial,
  onSave,
  onUploadImage,
}: {
  initial: string;
  onSave: (html: string) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
}) {
  const [html, setHtml] = useState(initial || EMPTY_BODY);

  useEffect(() => {
    setHtml(initial || EMPTY_BODY);
  }, [initial]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Appended to every message you send, unless you switch it off while composing.
      </p>
      <MailEditor value={html} onChange={setHtml} onUploadImage={onUploadImage} placeholder="Your name, role, phone…" />
      <Button onClick={() => onSave(html)} className="gap-1.5">
        <Save className="h-4 w-4" /> Save signature
      </Button>
    </div>
  );
}

export default Mail;
