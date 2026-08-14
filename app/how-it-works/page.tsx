import Link from 'next/link';
import { Search, Store, Package, Heart, ArrowRight, Check, ShoppingBag, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Search,
    title: 'Discover Products',
    description: 'Browse hundreds of products created by students in your college. Filter by category, price, rating, and creator to find exactly what you need.',
    points: ['Search by name, tag, or creator', 'Filter by price and rating', 'Save items to your wishlist'],
  },
  {
    icon: ShoppingBag,
    title: 'Buy with Confidence',
    description: 'Add products to your cart and check out securely. Choose between campus pickup or seller-managed delivery — whichever works best for you.',
    points: ['Secure checkout', 'Campus pickup or delivery', 'Order tracking from start to finish'],
  },
  {
    icon: Store,
    title: 'Start Selling',
    description: 'Got a product to sell? Create a seller profile, list your products in minutes, and start earning. No platform fees, no hidden charges.',
    points: ['Free seller account', 'List unlimited products', 'Track earnings and orders'],
  },
  {
    icon: Heart,
    title: 'Review & Support',
    description: 'Leave reviews for products you love and support student entrepreneurs. Your feedback helps creators improve and grow their campus businesses.',
    points: ['Rate and review purchases', 'Support fellow students', 'Build campus trust'],
  },
];

const faqs = [
  {
    q: 'Who can use CampusCart?',
    a: 'CampusCart is exclusively for students with a verified college email address. Registration requires an email from your college domain.',
  },
  {
    q: 'How much does it cost to sell?',
    a: 'Nothing. CampusCart is free for student sellers. There are no listing fees, no commission, and no hidden charges.',
  },
  {
    q: 'How does delivery work?',
    a: 'Sellers can offer campus pickup at designated points (like the Main Block Pickup Counter) or manage delivery themselves. You choose your preferred option at checkout.',
  },
  {
    q: 'Is my payment secure?',
    a: 'All payments are processed through a secure payment system. We never store your card details or banking credentials.',
  },
  {
    q: 'Can I return a product?',
    a: 'Returns are accepted within 3 days if the product is damaged or not as described. Food items are non-returnable for safety reasons.',
  },
  {
    q: 'How do reviews work?',
    a: 'Only students who have purchased and received a product can review it. This ensures reviews are authentic and trustworthy.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-border bg-secondary/30">
          <div className="container-px mx-auto max-w-7xl py-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
              <Package className="h-3.5 w-3.5" />
              How It Works
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              A simple marketplace built for campus life
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Whether you're buying, selling, or just exploring, CampusCart makes it easy to
              discover and support what your campus creates.
            </p>
          </div>
        </section>

        <section className="container-px mx-auto max-w-7xl py-16">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex flex-col gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
              >
                <div className="flex-1 lg:flex lg:items-center">
                  <div className="lg:max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <step.icon className="h-6 w-6" />
                      </div>
                      <span className="font-display text-3xl font-bold text-border">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-bold tracking-tight mb-3">
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          <span className="text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="aspect-video rounded-2xl border border-border bg-gradient-to-br from-accent/40 to-secondary/30 flex items-center justify-center">
                    <step.icon className="h-20 w-20 text-primary/20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-secondary/30">
          <div className="container-px mx-auto max-w-3xl py-16">
            <h2 className="font-display text-2xl font-bold tracking-tight text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h3 className="font-semibold text-sm mb-2 flex items-start gap-2">
                    <Tag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-px mx-auto max-w-7xl py-16">
          <div className="rounded-3xl border border-border bg-foreground px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl text-balance">
              Ready to join the campus marketplace?
            </h2>
            <p className="mt-3 text-primary-foreground/70 max-w-lg mx-auto text-balance">
              Create your free account and start buying or selling in minutes.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
