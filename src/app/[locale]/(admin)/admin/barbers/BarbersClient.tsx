"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createBarber, updateBarber, deleteBarber } from "@/actions/admin/barbers";
import { toast } from "sonner";

interface Barber {
  id: number;
  nameBg: string;
  nameEn: string;
  bioBg: string | null;
  bioEn: string | null;
  photoUrl: string | null;
  displayOrder: number;
  active: boolean;
  userId: number | null;
}

export default function BarbersClient({
  t,
  initialBarbers,
}: {
  t: (key: string) => string;
  initialBarbers: Barber[];
}) {
  const [barbers, setBarbers] = useState(initialBarbers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (editingId) {
      const result = await updateBarber(editingId, formData);
      if ("error" in result) {
        toast.error("Error saving barber");
        return;
      }
      setBarbers((prev) =>
        prev.map((b) =>
          b.id === editingId ? { ...b, ...Object.fromEntries(formData.entries()) } : b,
        ),
      );
      toast.success("Barber updated");
      setEditingId(null);
    } else {
      const result = await createBarber(formData);
      if ("error" in result) {
        toast.error("Error creating barber");
        return;
      }
      toast.success("Barber created");
    }

    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    const result = await deleteBarber(id);
    if ("error" in result) {
      toast.error("Error deleting barber");
      return;
    }
    setBarbers((prev) => prev.filter((b) => b.id !== id));
    toast.success("Barber deleted");
    setDeleteConfirm(null);
  };

  const editingBarber = editingId ? barbers.find((b) => b.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-foreground text-2xl">{t("barbers")}</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          {t("create")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("barbers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {barbers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No barbers found</p>
          ) : (
            <div className="space-y-3">
              {barbers.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground text-sm font-medium">{b.nameBg}</p>
                      <span className="text-muted-foreground text-xs">({b.nameEn})</span>
                      <Badge variant={b.active ? "default" : "secondary"}>
                        {b.active ? t("active") : "Inactive"}
                      </Badge>
                    </div>
                    {b.bioBg && (
                      <p className="text-muted-foreground line-clamp-1 text-xs">{b.bioBg}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Order: {b.displayOrder}
                      {b.userId ? `, User ID: ${b.userId}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(b.id);
                        setShowForm(true);
                      }}
                    >
                      {t("edit")}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(b.id)}>
                      {t("delete")}
                    </Button>
                  </div>
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
            <DialogTitle>
              {editingId ? t("edit") : t("create")} {t("barbers").toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("name")} (BG)</Label>
              <Input name="nameBg" defaultValue={editingBarber?.nameBg ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label>{t("name")} (EN)</Label>
              <Input name="nameEn" defaultValue={editingBarber?.nameEn ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label>{t("bio")} (BG)</Label>
              <Textarea name="bioBg" defaultValue={editingBarber?.bioBg ?? ""} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{t("bio")} (EN)</Label>
              <Textarea name="bioEn" defaultValue={editingBarber?.bioEn ?? ""} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{t("photo")} URL</Label>
              <Input name="photoUrl" defaultValue={editingBarber?.photoUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>{t("displayOrder")}</Label>
              <Input
                name="displayOrder"
                type="number"
                defaultValue={editingBarber?.displayOrder ?? 0}
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

      {/* Delete Confirmation */}
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
              Are you sure? This will also delete working hours.
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
    </div>
  );
}
