import { Search, MapPin, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: '1. Discover & Connect',
    description:
      'Search textbooks, project kits, used tools or freelance gigs made by students in your college.',
  },
  {
    icon: MapPin,
    title: '2. Meet on Campus',
    description:
      'Coordinate quick handovers at the Main Block pickup counter or get direct campus delivery.',
  },
  {
    icon: ShieldCheck,
    title: '3. Zero Fees & PIN Safe',
    description:
      'Confirm handover with a secure 4-digit PIN. Zero commission fees for student creators.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-12 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary mb-2">
          <span>Simple 3-Step Process</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          How CampusCart Works
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          A trusted, safe campus commerce ecosystem built exclusively for college life
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex flex-col items-center text-center rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-6 sm:p-7 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
              <step.icon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">{step.title}</h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
