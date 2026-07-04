"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createService, updateService, deleteService } from "@/actions/admin/services";
import { toast } from "sonner";

interface Service {
  id: number;
  nameBg: string;
  nameEn: string;
  descriptionBg: string | null;
  descriptionEn: string | null;
  durationMinutes: number;
  priceBgn: string;
  displayOrder: number;
  active: boolean;
}

export default function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const t = useTranslations("admin");
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formActive, setFormActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("active", formActive ? "on" : "off");

    if (editingId) {
      const result = await updateService(editingId, formData);
      if ("error" in result) {
        toast.error("Error saving service");
        return;
      }
      toast.success("Service updated");
      setEditingId(null);
    } else {
      const result = await createService(formData);
      if ("error" in result) {
        toast.error("Error creating service");
        return;
      }
      toast.success("Service created");
    }

    setShowForm(false);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    const result = await deleteService(id);
    if ("error" in result) {
      toast.error("Error deleting service");
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast.success("Service deleted");
    setDeleteConfirm(null);
  };

  const editingService = editingId ? services.find((s) => s.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-foreground text-2xl">{t("services")}</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormActive(true);
            setShowForm(true);
          }}
        >
          {t("create")}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">No services found</p>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-foreground text-sm font-medium">{s.nameBg}</p>
                      <span className="text-muted-foreground text-xs">({s.nameEn})</span>
                      <Badge variant={s.active ? "default" : "secondary"}>
                        {s.active ? t("active") : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {s.durationMinutes} min · €{s.priceBgn} · Order: {s.displayOrder}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(s.id);
                        setFormActive(s.active);
                        setShowForm(true);
                      }}
                    >
                      {t("edit")}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(s.id)}>
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
              {editingId ? t("edit") : t("create")} {t("services").toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("name")} (BG)</Label>
              <Input name="nameBg" defaultValue={editingService?.nameBg ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label>{t("name")} (EN)</Label>
              <Input name="nameEn" defaultValue={editingService?.nameEn ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label>{t("description")} (BG)</Label>
              <Textarea
                name="descriptionBg"
                defaultValue={editingService?.descriptionBg ?? ""}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("description")} (EN)</Label>
              <Textarea
                name="descriptionEn"
                defaultValue={editingService?.descriptionEn ?? ""}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("duration")} (min)</Label>
              <Input
                name="durationMinutes"
                type="number"
                defaultValue={editingService?.durationMinutes ?? 30}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("price")} (€)</Label>
              <Input
                name="priceBgn"
                type="number"
                step="0.01"
                defaultValue={editingService?.priceBgn ?? "0.00"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("displayOrder")}</Label>
              <Input
                name="displayOrder"
                type="number"
                defaultValue={editingService?.displayOrder ?? 0}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="service-active"
                checked={formActive}
                onCheckedChange={(c) => setFormActive(c === true)}
              />
              <Label htmlFor="service-active">{t("active")}</Label>
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
              Are you sure? Active bookings using this service will remain.
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
