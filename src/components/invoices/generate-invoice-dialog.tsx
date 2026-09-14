"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { generateInvoice, getInvoiceableVideos } from "@/app/actions/work";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, Video } from "@/db/schema";
import { formatCurrency } from "@/lib/currency";
import { FileText, Plus } from "lucide-react";

function firstOfMonth(offsetMonths: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offsetMonths);
  return d.toISOString().slice(0, 10);
}

function lastOfMonth(offsetMonths: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offsetMonths + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

export function GenerateInvoiceDialog({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState(firstOfMonth(-1));
  const [periodEnd, setPeriodEnd] = useState(lastOfMonth(-1));
  const [eligible, setEligible] = useState<Video[]>([]);
  const [isPreviewing, startPreview] = useTransition();
  const [isGenerating, startGenerate] = useTransition();

  useEffect(() => {
    if (!open) return;
    startPreview(async () => {
      if (!clientId || !periodStart || !periodEnd) {
        setEligible([]);
        return;
      }
      const rows = await getInvoiceableVideos(clientId, periodStart, periodEnd);
      setEligible(rows);
    });
  }, [open, clientId, periodStart, periodEnd]);

  const total = eligible.reduce((sum, v) => sum + v.price, 0);

  function handleGenerate() {
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("periodStart", periodStart);
    formData.set("periodEnd", periodEnd);

    startGenerate(async () => {
      const result = await generateInvoice(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invoice generated");
        setOpen(false);
        if (result.id) window.open(`/api/invoices/${result.id}/pdf`, "_blank");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Generate invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>
            Pick a client and billing period — every unbilled video in range gets added.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="invoice-client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="invoice-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="periodStart">From</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="periodEnd">To</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            {!clientId ? (
              <p className="text-sm text-muted-foreground">Select a client to preview.</p>
            ) : isPreviewing ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : eligible.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No unbilled videos for this client in that period.
              </p>
            ) : (
              <div className="space-y-1.5">
                {eligible.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{v.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatCurrency(v.price)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-1.5 text-sm font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleGenerate} disabled={isGenerating || eligible.length === 0}>
            <FileText className="size-4" />
            {isGenerating ? "Generating..." : "Generate invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
