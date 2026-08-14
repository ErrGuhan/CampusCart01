import { Search, Store, Package, Heart } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description:
      'Browse products created by students in your college. Filter by category, price, and creator.',
  },
  {
    icon: Store,
    title: 'Buy or Sell',
    description:
      'Purchase products with secure campus pickup or delivery, or start selling your own creations.',
  },
  {
    icon: Package,
    title: 'Pickup or Delivery',
    description:
      'Meet at campus pickup points or get your order delivered. Track every step of the way.',
  },
  {
    icon: Heart,
    title: 'Review & Support',
    description:
      'Leave reviews for products you love. Support student entrepreneurs and grow the community.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          How CampusCart Works
        </h2>
        <p className="mt-2 text-muted-foreground">
          A simple, trusted marketplace built for college life
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative">
            <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-1">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-7 w-7" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 z-10 h-px w-6 bg-border" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
