import SloganDivider from "@/components/shared/SloganDivider";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-heading text-foreground text-5xl font-semibold tracking-tight sm:text-6xl">
        Puro Barbershop
      </h1>
      <SloganDivider />
      <p className="text-muted-foreground mt-4 max-w-md text-lg">Прецизност · Увереност · Стил</p>
    </div>
  );
}
