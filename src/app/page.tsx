
import Link from "next/link";

const services = [
  {
    title: "Restaurant Menus",
    description: "Explore our restaurants and menus.",
    icon: "🍽️",
    href: "#restaurants",
  },
  {
    title: "Technical Support",
    description: "Tell us about any issue in your room.",
    icon: "🛠️",
    href: "#technical-support",
  },
  {
    title: "Other Services",
    description: "Discover additional hotel services.",
    icon: "✨",
    href: "#other-services",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              THE BILTMORE
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Hotel Guest Services
            </p>
          </div>
          <span className="text-sm text-slate-500">Welcome</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        <section className="mb-8">
          <p className="text-sm font-medium text-amber-700">
            Your stay, made easier
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            How can we assist you?
          </h1>
          <p className="mt-3 max-w-xl text-slate-600">
            Request a service or explore what our hotel has to offer.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="#clean-room"
            className="rounded-2xl bg-amber-700 p-6 text-white shadow-sm transition hover:bg-amber-800"
          >
            <span className="text-3xl">🧹</span>
            <h2 className="mt-4 text-xl font-semibold">Clean My Room</h2>
            <p className="mt-2 text-sm text-amber-50">
              Request housekeeping service.
            </p>
          </Link>

          <Link
            href="#do-not-disturb"
            className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm transition hover:bg-slate-800"
          >
            <span className="text-3xl">🔕</span>
            <h2 className="mt-4 text-xl font-semibold">Do Not Disturb</h2>
            <p className="mt-2 text-sm text-slate-200">
              Let our team know you need privacy.
            </p>
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">More Services</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-400 hover:shadow-sm"
              >
                <span className="text-3xl">{service.icon}</span>
                <h3 className="mt-4 font-semibold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
          We are pleased to assist you throughout your stay.
        </footer>
      </div>
    </main>
  );
}
