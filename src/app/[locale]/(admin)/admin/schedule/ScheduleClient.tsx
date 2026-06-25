"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";
import { bg } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { updateBookingStatus, createWalkInBooking } from "@/actions/admin/schedule";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingRow } from "./types";

const dayLabels: Record<number, string> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  0: "sunday",
};

export default function ScheduleClient({
  initialBookings,
  initialBarbers,
  initialTimeOff,
  initialServices,
  isSuperAdmin,
  userBarberId,
}: {
  initialBookings: BookingRow[];
  initialBarbers: { id: number; nameBg: string }[];
  initialTimeOff: {
    id: number;
    barberId: number;
    startDatetime: Date;
    endDatetime: Date;
    reason?: string | null;
  }[];
  initialServices: { id: number; nameBg: string; nameEn: string }[];
  isSuperAdmin: boolean;
  userBarberId: number | undefined;
}) {
  const t = useTranslations("admin");
  const [view, setView] = useState<"day" | "week">("week");
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>("all");
  const [bookings, setBookings] = useState(initialBookings);
  const [timeOff] = useState(initialTimeOff);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    bookingId: number;
    action: "cancel" | "noShow" | "complete";
  } | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInMsg, setWalkInMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const filteredBookings = useMemo(() => {
    if (selectedBarberId === "all") return bookings;
    return bookings.filter((b) => b.barberId === Number(selectedBarberId));
  }, [bookings, selectedBarberId]);

  const filteredTimeOff = useMemo(() => {
    if (selectedBarberId === "all") return timeOff;
    return timeOff.filter((to) => to.barberId === Number(selectedBarberId));
  }, [timeOff, selectedBarberId]);

  const isToday = (day: Date) => isSameDay(day, new Date());

  const handleNav = (dir: -1 | 1) => {
    setWeekStart(dir === -1 ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1));
  };

  const handleToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleAction = async (bookingId: number, action: "cancel" | "noShow" | "complete") => {
    const statusMap: Record<string, string> = {
      cancel: "cancelled",
      noShow: "no_show",
      complete: "completed",
    };
    const newStatus = statusMap[action]!;
    const result = await updateBookingStatus(
      bookingId,
      newStatus as "completed" | "cancelled" | "no_show",
    );
    if ("success" in result && result.success) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
      );
      setConfirmAction(null);
      setSelectedBooking(null);
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/20 text-emerald-300";
      case "completed":
        return "bg-blue-500/20 text-blue-300";
      case "cancelled":
        return "bg-red-500/20 text-red-300";
      case "no_show":
        return "bg-amber-500/20 text-amber-300";
      default:
        return "";
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      confirmed: "statusConfirmed",
      completed: "statusCompleted",
      cancelled: "statusCancelled",
      no_show: "statusNoShow",
    };
    return t(map[status] ?? status);
  };

  const bookingsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return filteredBookings.filter((b) => format(b.startDatetime, "yyyy-MM-dd") === dayStr);
  };

  const timeOffForDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return filteredTimeOff.filter((to) => {
      const toStart = new Date(to.startDatetime);
      toStart.setHours(0, 0, 0, 0);
      const toEnd = new Date(to.endDatetime);
      toEnd.setHours(23, 59, 59, 999);
      return dayStart >= toStart && dayStart <= toEnd;
    });
  };

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Week view
  if (view === "week") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-heading text-foreground text-2xl">{t("schedule")}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setWalkInOpen(true)}>
              + {t("addWalkIn")}
            </Button>
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("filterBarber")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allBarbers")}</SelectItem>
                {initialBarbers.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.nameBg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
              <TabsList>
                <TabsTrigger value="day">{t("viewDay")}</TabsTrigger>
                <TabsTrigger value="week">{t("viewWeek")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleNav(-1)}>
            ← {t("prevWeek")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            {t("today")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleNav(1)}>
            {t("nextWeek")} →
          </Button>
          <span className="text-muted-foreground ml-2 text-sm">
            {format(weekStart, "dd.MM.yyyy")} — {format(weekEnd, "dd.MM.yyyy")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-7 gap-2">
            {days.map((day) => {
              const dayBookings = bookingsForDay(day);
              const dayTimeOff = timeOffForDay(day);
              const today = isToday(day);
              const dayOfWeek = day.getDay();

              return (
                <div key={day.toISOString()} className="flex min-h-[250px] flex-col">
                  <div
                    className={`mb-2 rounded-lg p-2 text-center ${today ? "bg-accent/20" : "bg-muted/40"}`}
                  >
                    <div className="text-muted-foreground text-xs">{t(dayLabels[dayOfWeek]!)}</div>
                    <div
                      className={`text-sm font-medium ${today ? "text-accent" : "text-foreground"}`}
                    >
                      {format(day, "dd.MM")}
                    </div>
                  </div>

                  {dayTimeOff.map((to) => (
                    <div
                      key={to.id}
                      className="mb-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300"
                    >
                      {to.reason ?? "🕐"}
                    </div>
                  ))}

                  {dayBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`hover:bg-muted/60 mb-1 rounded border p-2 text-left text-xs transition-colors ${b.barberColor}`}
                    >
                      <div className="font-medium">
                        {format(b.startDatetime, "HH:mm")}–{format(b.endDatetime, "HH:mm")}
                      </div>
                      <div>{b.customerName}</div>
                      <div className="text-muted-foreground">{b.serviceName}</div>
                    </button>
                  ))}

                  {dayBookings.length === 0 && dayTimeOff.length === 0 && (
                    <div className="text-muted-foreground/50 mt-4 text-center text-xs">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dialogs */}
        <BookingDetailDialog
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onAction={(bookingId, action) => setConfirmAction({ bookingId, action })}
          t={t}
          statusBadgeClass={statusBadgeClass}
          statusLabel={statusLabel}
        />

        <ConfirmActionDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          t={t}
        />

        <WalkInDialog
          open={walkInOpen}
          onClose={() => {
            setWalkInOpen(false);
            setWalkInMsg(null);
          }}
          message={walkInMsg}
          t={t}
          barbers={initialBarbers}
          services={initialServices}
          isSuperAdmin={isSuperAdmin}
          userBarberId={userBarberId}
          onSuccess={(msg) => {
            setWalkInMsg({ type: "success", text: msg });
          }}
          onError={(msg) => {
            setWalkInMsg({ type: "error", text: msg });
          }}
        />
      </div>
    );
  }

  // Day view
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-foreground text-2xl">{t("schedule")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setWalkInOpen(true)}>
            + {t("addWalkIn")}
          </Button>
          <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filterBarber")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allBarbers")}</SelectItem>
              {initialBarbers.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.nameBg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
            <TabsList>
              <TabsTrigger value="day">{t("viewDay")}</TabsTrigger>
              <TabsTrigger value="week">{t("viewWeek")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleNav(-1)}>
          ← {t("prevWeek")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday}>
          {t("today")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleNav(1)}>
          {t("nextWeek")} →
        </Button>
        <span className="text-muted-foreground ml-2 text-sm">
          {format(weekStart, "dd.MM.yyyy")} — {format(weekEnd, "dd.MM.yyyy")}
        </span>
      </div>

      <div className="mx-auto max-w-md space-y-3">
        {days.map((day) => {
          const dayBookings = bookingsForDay(day);
          const today = isToday(day);
          const dayOfWeek = day.getDay();

          return (
            <div key={day.toISOString()}>
              <div
                className={`mb-1 flex items-center gap-2 rounded-lg p-2 ${today ? "bg-accent/20" : "bg-muted/40"}`}
              >
                <span className="text-muted-foreground text-xs">{t(dayLabels[dayOfWeek]!)}</span>
                <span
                  className={`text-sm font-medium ${today ? "text-accent" : "text-foreground"}`}
                >
                  {format(day, "dd.MM.yyyy")}
                </span>
                {today && <span className="text-accent text-xs">({t("today")})</span>}
              </div>

              <div className="ml-4 space-y-2">
                {dayBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`hover:bg-muted/60 w-full rounded border p-3 text-left text-sm transition-colors ${b.barberColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {format(b.startDatetime, "HH:mm")}–{format(b.endDatetime, "HH:mm")}
                      </span>
                      <Badge variant="secondary" className={statusBadgeClass(b.status)}>
                        {statusLabel(b.status)}
                      </Badge>
                    </div>
                    <div>
                      {b.customerName} — {b.serviceName}
                    </div>
                    <div className="text-muted-foreground text-xs">{b.barberName}</div>
                  </button>
                ))}
                {dayBookings.length === 0 && (
                  <div className="text-muted-foreground/50 text-xs">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <BookingDetailDialog
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onAction={(bookingId, action) => setConfirmAction({ bookingId, action })}
        t={t}
        statusBadgeClass={statusBadgeClass}
        statusLabel={statusLabel}
      />

      <ConfirmActionDialog
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleAction}
        t={t}
      />

      <WalkInDialog
        open={walkInOpen}
        onClose={() => {
          setWalkInOpen(false);
          setWalkInMsg(null);
        }}
        message={walkInMsg}
        t={t}
        barbers={initialBarbers}
        services={initialServices}
        isSuperAdmin={isSuperAdmin}
        userBarberId={userBarberId}
        onSuccess={(msg) => setWalkInMsg({ type: "success", text: msg })}
        onError={(msg) => setWalkInMsg({ type: "error", text: msg })}
      />
    </div>
  );
}

function BookingDetailDialog({
  booking,
  onClose,
  onAction,
  t,
  statusBadgeClass,
  statusLabel,
}: {
  booking: BookingRow | null;
  onClose: () => void;
  onAction: (bookingId: number, action: "cancel" | "noShow" | "complete") => void;
  t: (key: string) => string;
  statusBadgeClass: (status: string) => string;
  statusLabel: (status: string) => string;
}) {
  if (!booking) return null;

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent onOpenChange={onClose}>
        <DialogHeader>
          <DialogTitle>{t("bookingDetails")}</DialogTitle>
          <DialogDescription>
            {booking.customerName} — {booking.serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          {[
            [t("customerName"), booking.customerName],
            [t("customerEmail"), booking.customerEmail],
            [t("customerPhone"), booking.customerPhone],
            [t("date"), format(booking.startDatetime, "dd.MM.yyyy")],
            [
              t("time"),
              `${format(booking.startDatetime, "HH:mm")}–${format(booking.endDatetime, "HH:mm")}`,
            ],
            [t("service"), booking.serviceName ?? ""],
            [
              t("status"),
              <Badge key="s" variant="secondary" className={statusBadgeClass(booking.status)}>
                {statusLabel(booking.status)}
              </Badge>,
            ],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}
          {booking.notes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("notes")}</span>
              <span>{booking.notes}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {booking.status === "confirmed" && (
            <>
              <Button variant="outline" size="sm" onClick={() => onAction(booking.id, "complete")}>
                {t("markCompleted")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAction(booking.id, "noShow")}>
                {t("markNoShow")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onAction(booking.id, "cancel")}
              >
                {t("cancel")}
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmActionDialog({
  action,
  onClose,
  onConfirm,
  t,
}: {
  action: { bookingId: number; action: "cancel" | "noShow" | "complete" } | null;
  onClose: () => void;
  onConfirm: (bookingId: number, action: "cancel" | "noShow" | "complete") => Promise<void>;
  t: (key: string) => string;
}) {
  if (!action) return null;

  const titleMap: Record<string, string> = {
    cancel: "cancelConfirm",
    noShow: "markNoShowConfirm",
    complete: "markCompleted",
  };

  return (
    <Dialog open={!!action} onOpenChange={onClose}>
      <DialogContent onOpenChange={onClose}>
        <DialogHeader>
          <DialogTitle>{t(titleMap[action.action]!)}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("close")}
          </Button>
          <Button
            variant={action.action === "cancel" ? "destructive" : "default"}
            onClick={() => onConfirm(action.bookingId, action.action)}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WalkInDialog({
  open,
  onClose,
  message,
  t,
  barbers,
  services,
  isSuperAdmin,
  userBarberId,
  onSuccess,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  message: { type: "success" | "error"; text: string } | null;
  t: (key: string) => string;
  barbers: { id: number; nameBg: string }[];
  services: { id: number; nameBg: string; nameEn: string }[];
  isSuperAdmin: boolean;
  userBarberId: number | undefined;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [barberId, setBarberId] = useState<string>(
    isSuperAdmin ? (barbers[0] ? String(barbers[0].id) : "") : String(userBarberId ?? ""),
  );
  const [serviceId, setServiceId] = useState<string>(services[0] ? String(services[0].id) : "");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!barberId || !serviceId || !date || !time || !customerName || !customerPhone) return;

    setSubmitting(true);
    const result = await createWalkInBooking({
      barberId: Number(barberId),
      serviceId: Number(serviceId),
      date,
      time,
      customerName,
      customerPhone,
      ...(customerEmail ? { customerEmail } : {}),
    });
    setSubmitting(false);

    if ("success" in result && result.success) {
      onSuccess(t("walkInSuccess"));
    } else if ("error" in result) {
      const errKey = result.error === "slotTaken" ? "walkInSlotTaken" : "walkInError";
      onError(t(errKey));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onOpenChange={onClose}>
        <DialogHeader>
          <DialogTitle>{t("walkInTitle")}</DialogTitle>
        </DialogHeader>

        {message && (
          <div
            className={`rounded p-2 text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {isSuperAdmin && (
            <div className="space-y-1">
              <Label>{t("barbers")}</Label>
              <Select value={barberId} onValueChange={(v) => setBarberId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filterBarber")} />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.nameBg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>{t("service")}</Label>
            <Select value={serviceId} onValueChange={(v) => setServiceId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("service")} />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nameBg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("time")}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("customerName")}</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("customerName")}
            />
          </div>

          <div className="space-y-1">
            <Label>{t("customerPhone")}</Label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+359..."
            />
          </div>

          <div className="space-y-1">
            <Label>{t("emailOptional")}</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !barberId ||
              !serviceId ||
              !date ||
              !time ||
              !customerName ||
              !customerPhone
            }
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
