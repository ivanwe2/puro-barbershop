CREATE TABLE "barber_service_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"barber_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"price_eur" numeric(10, 2) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barber_service_prices" ADD CONSTRAINT "barber_service_prices_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barber_service_prices" ADD CONSTRAINT "barber_service_prices_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "barber_service_unique" ON "barber_service_prices" USING btree ("barber_id","service_id");