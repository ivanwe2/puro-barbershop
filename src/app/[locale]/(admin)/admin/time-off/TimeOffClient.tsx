"use client";

import { useState } from "react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createTimeOff, updateTimeOff, deleteTimeOff } from "@/actions/admin/time-off";
import { toast } from "sonner";

interface TimeOffEntry {
  id: number;
  barberId: number;
  barberName: string | null;
  startDatetime: Date;
  endDatetime: Date;
  reason: string | null;
  createdAt: Date;
}

export default function TimeOffClient({
  t,
  initialEntries,
  initialBarbers,
  isSuperAdmin,
  barberId,
}: {
  t: (key: string) => string;
  initialEntries: TimeOffEntry[];
  initialBarbers: { id: number; nameBg: string }[];
  isSuperAdmin: boolean;
  barberId?: number;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [overlappingWarning, setOverlappingWarning] = useState<{
    message: string;
    continueDelete: () => void;
  } | null>(null);

  const isPast = (entry: TimeOffEntry) => new Date(entry.endDatetime) < new Date();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (editingId) {
      formData.set("id", String(editingId));
      const result = await updateTimeOff(editingId, formData);
      if ("error" in result) {
        toast.error(t("error") || "Error");
        return;
      }
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                startDatetime: new Date(formData.get("startDatetime") as string),
                endDatetime: new Date(formData.get("endDatetime") as string),
                reason: (formData.get("reason") as string) || null,
                ...(isSuperAdmin && {
                  barberId: Number(formData.get("barberId")),
                  barberName:
                    initialBarbers.find((b) => b.id === Number(formData.get("barberId")))?.nameBg ||
                    null,
                }),
              }
            : entry,
        ),
      );
      toast.success("Updated");
      setEditingId(null);
    } else {
      if (!isSuperAdmin && barberId) {
        formData.set("barberId", String(barberId));
      }
      const result = await createTimeOff(formData);
      if ("error" in result) {
        toast.error(t("error") || "Error");
        return;
      }
      if ("overlappingBookings" in result && result.overlappingBookings.length > 0) {
        toast.warning(
          `Time off created but overlaps ${result.overlappingBookings.length} booking(s). Please review.`,
        );
      }
      // Refresh from server
      window.location.reload();
      return;
    }

    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    const result = await deleteTimeOff(id);
    if ("error" in result) {
      toast.error(t("error") || "Error");
      return;
    }
    if ("overlappingBookings" in result && result.overlappingBookings.length > 0) {
      setOverlappingWarning({
        message: `This time-off overlaps ${result.overlappingBookings.length} booking(s). Review before continuing.`,
        continueDelete: () => {
          setOverlappingWarning(null);
          setEntries((prev) => prev.filter((e) => e.id !== id));
          toast.success("Deleted");
        },
      });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Deleted");
  };

  const handleEdit = (entry: TimeOffEntry) => {
    setEditingId(entry.id);
    setShowForm(true);
  };

  const editingEntry = editingId ? entries.find((e) => e.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-foreground text-2xl">{t("timeOff")}</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          {t("addTimeOff")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingTimeOff")}</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noTimeOff")}</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${isPast(entry) ? "opacity-50" : ""}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground text-sm font-medium">{entry.barberName}</p>
                      {isPast(entry) && <Badge variant="secondary">Past</Badge>}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(entry.startDatetime), "dd.MM.yyyy HH:mm", { locale: bg })} —{" "}
                      {format(new Date(entry.endDatetime), "dd.MM.yyyy HH:mm", { locale: bg })}
                    </p>
                    {entry.reason && (
                      <p className="text-muted-foreground text-xs">{entry.reason}</p>
                    )}
                  </div>
                  {!isPast(entry) && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                        {t("edit")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirm(entry.id)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingId(null);
          }
        }}
      >
        <DialogContent
          onOpenChange={(open) => {
            if (!open) {
              setShowForm(false);
              setEditingId(null);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{editingId ? t("edit") : t("addTimeOff")}</DialogTitle>
            <DialogDescription>
              {editingId ? "Edit time off entry" : "Add a new time off entry"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Select
                  name="barberId"
                  defaultValue={editingEntry ? String(editingEntry.barberId) : ""}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select barber" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialBarbers.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nameBg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("startDateTime")}</Label>
              <Input
                type="datetime-local"
                name="startDatetime"
                defaultValue={
                  editingEntry
                    ? format(new Date(editingEntry.startDatetime), "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("endDateTime")}</Label>
              <Input
                type="datetime-local"
                name="endDatetime"
                defaultValue={
                  editingEntry
                    ? format(new Date(editingEntry.endDatetime), "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("reason")}</Label>
              <Textarea
                name="reason"
                defaultValue={editingEntry?.reason ?? ""}
                placeholder="Optional reason"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                {t("close")}
              </Button>
              <Button type="submit">{editingId ? t("save") : t("create")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <DialogContent
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time off entry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              {t("close")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlapping Warning Dialog */}
      <Dialog
        open={!!overlappingWarning}
        onOpenChange={(open) => {
          if (!open) setOverlappingWarning(null);
        }}
      >
        <DialogContent
          onOpenChange={(open) => {
            if (!open) setOverlappingWarning(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>⚠️ Overlapping Bookings</DialogTitle>
            <DialogDescription>{overlappingWarning?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOverlappingWarning(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => overlappingWarning?.continueDelete()}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
