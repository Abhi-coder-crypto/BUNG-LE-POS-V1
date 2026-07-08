import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Printer, Plus, Trash2, Wifi, WifiOff, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PrinterDevice } from "@shared/schema";

interface PrinterWithStatus extends PrinterDevice {
  online?: boolean;
  checking?: boolean;
}

export default function PrinterConfigPage() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PrinterDevice | null>(null);
  const [printerStatuses, setPrinterStatuses] = useState<Record<string, boolean | null>>({});
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  // Form state
  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: "9100",
    type: "KOT" as "KOT" | "Bill" | "Label",
    autoPrint: true,
  });

  const { data: printers = [], isLoading } = useQuery<PrinterDevice[]>({
    queryKey: ["/api/printers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/printers", {
        name: data.name,
        ip: data.ip,
        port: parseInt(data.port) || 9100,
        type: data.type,
        autoPrint: data.autoPrint,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      setShowAddDialog(false);
      setForm({ name: "", ip: "", port: "9100", type: "KOT", autoPrint: true });
      toast({ title: "Printer added successfully" });
    },
    onError: () => toast({ title: "Failed to add printer", variant: "destructive" }),
  });

  const toggleAutoPrintMutation = useMutation({
    mutationFn: async ({ id, autoPrint }: { id: string; autoPrint: boolean }) => {
      const res = await apiRequest("PATCH", `/api/printers/${id}`, { autoPrint });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/printers"] }),
    onError: () => toast({ title: "Failed to update printer", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/printers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/printers"] });
      setDeleteTarget(null);
      toast({ title: "Printer removed" });
    },
    onError: () => toast({ title: "Failed to remove printer", variant: "destructive" }),
  });

  const checkStatus = async (printer: PrinterDevice) => {
    setCheckingIds(prev => new Set(prev).add(printer.id));
    try {
      const res = await fetch(`/api/printers/${printer.id}/status`);
      const data = await res.json();
      setPrinterStatuses(prev => ({ ...prev, [printer.id]: data.online }));
    } catch {
      setPrinterStatuses(prev => ({ ...prev, [printer.id]: false }));
    } finally {
      setCheckingIds(prev => { const s = new Set(prev); s.delete(printer.id); return s; });
    }
  };

  const handleTestPrint = async (printer: PrinterDevice) => {
    try {
      const res = await apiRequest("POST", `/api/printers/${printer.id}/test`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Test print sent", description: `${printer.name} printed successfully` });
        setPrinterStatuses(prev => ({ ...prev, [printer.id]: true }));
      } else {
        // Fallback: browser print dialog
        toast({
          title: "Printer unreachable — opening print dialog",
          description: data.error || "Could not connect to printer",
        });
        openBrowserPrintDialog(printer);
      }
    } catch {
      toast({ title: "Test print failed", variant: "destructive" });
    }
  };

  const openBrowserPrintDialog = (printer: PrinterDevice) => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Test Print — ${printer.name}</title>
      <style>body{font-family:monospace;padding:20px}h2{text-align:center}p{margin:4px 0}hr{border-top:1px dashed #000}</style>
      </head><body>
      <h2>TEST PRINT</h2><hr/>
      <p>Printer: <b>${printer.name}</b></p>
      <p>IP: ${printer.ip}:${printer.port}</p>
      <p>Type: ${printer.type}</p>
      <p>Time: ${new Date().toLocaleString()}</p>
      <hr/><p style="text-align:center"><b>Printer is configured!</b></p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.ip.trim()) {
      toast({ title: "Name and IP are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  const getStatusIndicator = (printer: PrinterDevice) => {
    const status = printerStatuses[printer.id];
    const checking = checkingIds.has(printer.id);
    if (checking) return <Badge className="bg-yellow-500 text-white">Checking…</Badge>;
    if (status === true)  return <Badge className="bg-success text-white flex items-center gap-1"><Wifi className="h-3 w-3" />Online</Badge>;
    if (status === false) return <Badge className="bg-danger text-white flex items-center gap-1"><WifiOff className="h-3 w-3" />Offline</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  const typeColors: Record<string, string> = {
    KOT: "bg-orange-100 text-orange-700 border-orange-200",
    Bill: "bg-blue-100 text-blue-700 border-blue-200",
    Label: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader title="Printer Configuration" showSearch={false} />

      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              Total Printers: <span className="font-semibold">{printers.length}</span>
            </span>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-printer">
            <Plus className="h-4 w-4 mr-2" /> Add Printer
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading printers…</div>
        ) : printers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Printer className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-base font-medium">No printers configured</p>
            <p className="text-sm mt-1">Add a printer to enable KOT auto-printing</p>
          </div>
        ) : (
          <div className="space-y-4">
            {printers.map((printer) => (
              <div key={printer.id} className="bg-card border rounded-xl p-5 shadow-sm">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <Printer className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">{printer.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {printer.ip}:{printer.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIndicator(printer)}
                    <button
                      onClick={() => checkStatus(printer)}
                      disabled={checkingIds.has(printer.id)}
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                    >
                      Check
                    </button>
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${typeColors[printer.type] ?? ""}`}>
                      {printer.type}
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={printer.autoPrint}
                        onCheckedChange={(v) =>
                          toggleAutoPrintMutation.mutate({ id: printer.id, autoPrint: v })
                        }
                        data-testid={`switch-autoprint-${printer.id}`}
                      />
                      <span className="text-sm">Auto-print</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none gap-1.5"
                      onClick={() => handleTestPrint(printer)}
                      data-testid={`button-test-print-${printer.id}`}
                    >
                      <TestTube className="h-3.5 w-3.5" />
                      Test Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300"
                      onClick={() => setDeleteTarget(printer)}
                      data-testid={`button-delete-${printer.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Auto-print hint */}
                {printer.autoPrint && printer.type === "KOT" && (
                  <p className="mt-3 text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-md">
                    ✓ New KOT orders will automatically print to this printer
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Printer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Printer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Printer Name</Label>
              <Input
                placeholder="e.g. Kitchen Printer 1"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="192.168.1.100"
                  value={form.ip}
                  onChange={e => setForm(f => ({ ...f, ip: e.target.value }))}
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  placeholder="9100"
                  value={form.port}
                  onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Printer Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KOT">KOT (Kitchen Order Ticket)</SelectItem>
                  <SelectItem value="Bill">Bill / Invoice</SelectItem>
                  <SelectItem value="Label">Label</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.autoPrint}
                onCheckedChange={v => setForm(f => ({ ...f, autoPrint: v }))}
              />
              <div>
                <p className="text-sm font-medium">Auto-print</p>
                <p className="text-xs text-muted-foreground">
                  {form.type === "KOT"
                    ? "Automatically print new KOT orders to this printer"
                    : "Automatically send print jobs to this printer"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding…" : "Add Printer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This printer will be removed from the configuration. Auto-print will stop for this printer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
