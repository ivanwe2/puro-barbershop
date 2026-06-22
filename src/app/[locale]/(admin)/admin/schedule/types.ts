export interface BookingRow {
  id: number;
  barberId: number | null;
  barberName: string | null;
  serviceId: number | null;
  serviceName: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDatetime: Date;
  endDatetime: Date;
  status: string;
  notes: string | null;
  locale: string;
  barberColor: string;
}
