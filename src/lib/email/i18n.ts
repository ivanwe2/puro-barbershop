// Localized strings for transactional emails. Customer-facing emails
// (confirmation, cancellation, reminder) use the locale the customer booked
// in; staff-facing emails (barber notification, invite) default to Bulgarian.

export type EmailLocale = "bg" | "en";

/** Coerce an arbitrary locale string to a supported email locale. */
export function toEmailLocale(locale: string | null | undefined): EmailLocale {
  return locale === "en" ? "en" : "bg";
}

const en = {
  brand: "Puro Barbershop",
  subjects: {
    confirmation: "Booking Confirmation — Puro Barbershop",
    notification: "New Booking — Puro Barbershop",
    cancellation: "Booking Cancelled — Puro Barbershop",
    reschedule: "Appointment Rescheduled — Puro Barbershop",
    reminder: "Booking Reminder — Puro Barbershop",
    invite: "You've been added to Puro Barbershop",
  },
  labels: {
    service: "Service",
    barber: "Barber",
    date: "Date",
    time: "Time",
    customer: "Customer",
    phone: "Phone",
    email: "Email",
    tempPassword: "Temporary password",
    login: "Login",
  },
  greeting: (name: string) => `Hello, ${name}!`,
  confirmation: {
    intro: "Your booking is confirmed:",
    cancelPrefix: "To cancel, click here:",
    cancelLink: "Cancel booking",
  },
  notification: {
    title: "New Booking",
    intro: (barber: string) => `Hi ${barber}, you have a new booking:`,
  },
  cancellation: {
    title: "Booking Cancelled",
    intro: "Your booking has been cancelled:",
    rebook: "If you'd like to book again, visit us at:",
  },
  reschedule: {
    title: "Appointment Rescheduled",
    intro: "Your appointment has been moved to a new time:",
  },
  reminder: {
    title: "Booking Reminder",
    intro: "This is a reminder of your upcoming booking:",
    cancelButton: "Cancel Booking",
  },
  invite: {
    title: "Welcome to Puro Barbershop",
    greeting: (barber: string) => `Hi ${barber},`,
    body: "You've been added to the Puro Barbershop admin panel. Use the credentials below to log in.",
    changePassword: "Please change your password immediately after logging in for the first time.",
  },
};

const bg: typeof en = {
  brand: "Puro Barbershop",
  subjects: {
    confirmation: "Потвърждение за резервация — Puro Barbershop",
    notification: "Нова резервация — Puro Barbershop",
    cancellation: "Отменена резервация — Puro Barbershop",
    reschedule: "Преместен час — Puro Barbershop",
    reminder: "Напомняне за резервация — Puro Barbershop",
    invite: "Добавени сте към Puro Barbershop",
  },
  labels: {
    service: "Услуга",
    barber: "Барбър",
    date: "Дата",
    time: "Час",
    customer: "Клиент",
    phone: "Телефон",
    email: "Имейл",
    tempPassword: "Временна парола",
    login: "Вход",
  },
  greeting: (name: string) => `Здравейте, ${name}!`,
  confirmation: {
    intro: "Вашата резервация е потвърдена:",
    cancelPrefix: "За да отмените, натиснете тук:",
    cancelLink: "Отмени резервацията",
  },
  notification: {
    title: "Нова резервация",
    intro: (barber: string) => `Здравейте, ${barber}! Имате нова резервация:`,
  },
  cancellation: {
    title: "Отменена резервация",
    intro: "Вашата резервация беше отменена:",
    rebook: "Ако желаете да резервирате отново, заповядайте при нас:",
  },
  reschedule: {
    title: "Преместен час",
    intro: "Вашият час беше преместен за нов период:",
  },
  reminder: {
    title: "Напомняне за резервация",
    intro: "Напомняме ви за предстоящата ви резервация:",
    cancelButton: "Отмени резервацията",
  },
  invite: {
    title: "Добре дошли в Puro Barbershop",
    greeting: (barber: string) => `Здравейте, ${barber},`,
    body: "Добавени сте към административния панел на Puro Barbershop. Използвайте данните по-долу, за да влезете.",
    changePassword: "Моля, сменете паролата си веднага след първото влизане.",
  },
};

export function emailStrings(locale: EmailLocale) {
  return locale === "en" ? en : bg;
}
