import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Globe2,
  Menu,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import heroImage from "@/assets/digital-infrastructure-hero.jpg";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DigitalBusiness.fun — Build. Automate. Grow." },
      { name: "description", content: "Join the first 100 Nigerian businesses getting a professional website for ₦49,999, then build the systems to automate and grow." },
      { property: "og:title", content: "100 Businesses Online — Websites for ₦49,999" },
      { property: "og:description", content: "A digital transformation campaign helping Nigerian businesses build, automate and grow." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const services = [
  { number: "01", title: "Build", line: "Go online professionally.", text: "A credible digital presence designed around how your customers discover, understand and contact you.", tags: ["Websites", "Storefronts", "WhatsApp", "Analytics"], icon: Globe2 },
  { number: "02", title: "Automate", line: "Turn enquiries into systems.", text: "Connect every lead to the right response, follow-up and next step—without relying on memory.", tags: ["AI assistant", "Lead capture", "CRM", "Follow-up"], icon: Zap },
  { number: "03", title: "Grow", line: "Make marketing continuous.", text: "Use intelligent campaigns, useful content and customer insights to create repeatable momentum.", tags: ["AI marketing", "Campaigns", "Retention", "Insights"], icon: TrendingUp },
];

const process = [
  ["01", "Discover", "Understand the business."],
  ["02", "Design", "Map the customer journey."],
  ["03", "Build", "Create the digital systems."],
  ["04", "Launch", "Put everything into operation."],
  ["05", "Improve", "Measure and optimise."],
];

function Logo() {
  return <a href="#top" aria-label="DigitalBusiness.fun — back to top" className="inline-flex min-w-0 items-center gap-2 font-extrabold text-foreground"><img src="/favicon.svg" alt="" className="size-9 shrink-0" /><span className="truncate">DigitalBusiness<span className="text-primary">.fun</span></span></a>;
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [darkTheme, setDarkTheme] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setDarkTheme(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const nextTheme = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextTheme);
    document.documentElement.style.colorScheme = nextTheme ? "dark" : "light";
    localStorage.setItem("theme", nextTheme ? "dark" : "light");
    setDarkTheme(nextTheme);
  }

  function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: Record<string, string> = {};
    for (const field of ["business", "name", "phone", "category", "challenge"]) {
      if (!String(data.get(field) ?? "").trim()) nextErrors[field] = "This field is required.";
    }
    const phone = String(data.get("phone") ?? "").trim();
    if (phone && !/^[+0-9()\-\s]{7,20}$/.test(phone)) nextErrors["phone"] = "Enter a valid phone number.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
      event.currentTarget.reset();
    }
  }

  return (
    <main id="top" className="bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid h-18 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-5 lg:px-8">
          <div className="min-w-0"><Logo /></div>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {["Services", "100 Businesses", "Process"].map((item) => <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">{item}</a>)}
            <Button variant="ghost" className="size-12 px-0!" onClick={toggleTheme} aria-label={darkTheme ? "Use light theme" : "Use dark theme"} title={darkTheme ? "Use light theme" : "Use dark theme"}>{darkTheme ? <Sun size={19} /> : <Moon size={19} />}</Button>
            <Button asChild><a href="#apply">Apply now <ArrowRight size={16} /></a></Button>
          </nav>
          <div className="flex shrink-0 items-center md:hidden">
            <Button variant="ghost" className="size-12 px-0!" onClick={toggleTheme} aria-label={darkTheme ? "Use light theme" : "Use dark theme"}>{darkTheme ? <Sun size={19} /> : <Moon size={19} />}</Button>
            <Button variant="ghost" className="size-12 px-0!" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</Button>
          </div>
        </div>
        {menuOpen && <nav className="border-t border-border bg-background p-5 md:hidden">{["Services", "100 Businesses", "Process", "Apply"].map((item) => <a onClick={() => setMenuOpen(false)} key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="block border-b border-border py-4 font-bold">{item}</a>)}</nav>}
      </header>

      <section className="relative flex min-h-[92svh] items-end overflow-hidden border-b border-border pt-28">
        <img src={heroImage} alt="Connected digital systems flowing through a business journey" width={1600} height={1000} className="absolute inset-0 size-full object-cover object-center" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/20" />
        <div className="absolute inset-0 site-grid opacity-25" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-16 lg:grid-cols-[1.45fr_.55fr] lg:px-8 lg:pb-20">
          <div className="max-w-4xl enter-up">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-primary/35 bg-background/55 px-3 py-2 text-xs font-bold uppercase text-primary backdrop-blur"><span className="size-2 rounded-full bg-primary signal" /> 100 Businesses Online</div>
            <h1 className="text-balance text-6xl font-extrabold leading-[.92] md:text-8xl lg:text-[7rem]">Build.<br />Automate.<br /><span className="text-primary">Grow.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">We build the digital infrastructure around your customer journey—from a professional website to smarter follow-up and marketing systems.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="min-w-52"><a href="#apply">Claim the ₦49,999 offer <ArrowRight size={17} /></a></Button>
              <Button asChild variant="outline"><a href="#services">Explore the system <ArrowDown size={17} /></a></Button>
            </div>
          </div>
          <aside className="self-end rounded-lg border border-primary/30 bg-card/80 p-5 backdrop-blur-xl lg:mb-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground"><span>Flagship offer</span><Sparkles size={17} className="text-primary" /></div>
            <p className="mt-7 text-sm text-muted-foreground">Professional business website</p>
            <p className="mt-1 text-5xl font-extrabold text-primary">₦49,999</p>
            <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">Available to the first 100 businesses that request and qualify.</p>
          </aside>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-2"><p className="text-sm font-bold uppercase text-primary">The growth system</p><h2 className="text-balance text-4xl font-extrabold leading-tight md:text-6xl">Your business deserves more than a website.</h2></div>
        <div className="mt-16 grid border-l border-t border-border md:grid-cols-3">
          {services.map(({ number, title, line, text, tags, icon: Icon }) => <article key={title} className="group border-b border-r border-border p-7 transition-colors hover:bg-card md:p-9"><div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">/{number}</span><Icon className="text-primary" /></div><h3 className="mt-12 text-4xl font-extrabold">{title}</h3><p className="mt-3 font-bold text-accent">{line}</p><p className="mt-5 leading-7 text-muted-foreground">{text}</p><div className="mt-8 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{tag}</span>)}</div></article>)}
        </div>
      </section>

      <section id="100-businesses" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-24 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-32">
          <div><p className="text-sm font-bold uppercase text-primary">100 Businesses. One Digital Movement.</p><h2 className="mt-5 text-balance text-5xl font-extrabold leading-tight md:text-7xl">Get your business online for <span className="text-primary">₦49,999.</span></h2><p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">We are beginning with 100 real businesses—building a professional website for each, then creating a clear path toward automation and growth.</p><Button asChild className="mt-8"><a href="#apply">Request your place <ArrowRight size={17} /></a></Button></div>
          <div className="flex flex-col justify-between rounded-lg border border-border bg-background p-7 md:p-10"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase text-muted-foreground">Campaign progress</p><p className="mt-3 text-6xl font-extrabold">0 <span className="text-2xl text-muted-foreground">/ 100</span></p></div><CircleDot className="text-primary" size={30} /></div><div className="mt-8 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-0 bg-primary" /></div><p className="mt-4 text-sm text-muted-foreground">No fabricated progress. The counter updates as businesses officially join.</p><div className="mt-12 grid grid-cols-5 gap-2">{["Apply", "Audit", "Build", "Automate", "Grow"].map((step, index) => <div key={step} className="text-center"><div className="mx-auto mb-3 grid size-8 place-items-center rounded-full border border-border bg-card text-xs font-bold">{index + 1}</div><span className="text-[10px] font-bold uppercase text-muted-foreground sm:text-xs">{step}</span></div>)}</div></div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase text-primary">How it works</p><h2 className="mt-5 text-4xl font-extrabold md:text-6xl">Simple for you.<br />Serious behind the scenes.</h2></div><p className="max-w-sm leading-7 text-muted-foreground">Five clear steps take your business from an idea or fragmented presence to a working digital system.</p></div>
        <div className="mt-16">{process.map(([number, title, text]) => <div key={number} className="group grid items-center gap-3 border-t border-border py-7 md:grid-cols-[100px_1fr_1fr_40px]"><span className="font-mono text-xs text-primary">/{number}</span><h3 className="text-3xl font-extrabold md:text-4xl">{title}</h3><p className="text-muted-foreground">{text}</p><ChevronRight className="hidden text-muted-foreground transition-transform group-hover:translate-x-1 md:block" /></div>)}</div>
      </section>

      <section id="apply" className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-32">
          <div><p className="text-sm font-bold uppercase text-primary">Apply for digital transformation</p><h2 className="mt-5 text-balance text-5xl font-extrabold leading-tight md:text-6xl">Is your business ready for its next version?</h2><p className="mt-6 max-w-md leading-7 text-muted-foreground">Tell us where you are and what you need. We’ll use your answers to understand whether the ₦49,999 campaign offer is the right starting point.</p><div className="mt-10 space-y-4 text-sm text-muted-foreground">{["Professional website built around your business", "A clear route to automation and growth", "Reserved for the first 100 qualifying requests"].map(item => <p key={item} className="flex gap-3"><Check className="shrink-0 text-primary" size={18} />{item}</p>)}</div></div>
          <div className="rounded-lg border border-border bg-background p-6 md:p-10">
            {submitted ? <div className="grid min-h-96 place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check /></div><h3 className="mt-6 text-3xl font-extrabold">Application captured.</h3><p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">This preview does not send or save your details yet. The application journey is ready to connect when secure storage is enabled.</p><Button className="mt-7" variant="outline" onClick={() => setSubmitted(false)}>Submit another</Button></div></div> : <form onSubmit={submitApplication} noValidate className="grid gap-5 md:grid-cols-2">
              <Field label="Business name" name="business" error={errors["business"]} maxLength={100} />
              <Field label="Owner / contact name" name="name" error={errors["name"]} maxLength={100} />
              <Field label="WhatsApp / phone" name="phone" type="tel" error={errors["phone"]} maxLength={20} />
              <label className="grid gap-2 text-sm font-bold">Business category<select name="category" defaultValue="" className="h-12 rounded-md border border-input bg-card px-3 text-foreground outline-none focus:border-primary"><option value="" disabled>Select a category</option><option>Retail</option><option>Food & hospitality</option><option>Professional services</option><option>Beauty & wellness</option><option>Education</option><option>Real estate</option><option>Other</option></select>{errors["category"] && <span className="text-xs text-destructive">{errors["category"]}</span>}</label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">What digital challenge should we help solve?<textarea name="challenge" maxLength={1000} rows={5} className="rounded-md border border-input bg-card p-3 text-foreground outline-none focus:border-primary" placeholder="Tell us what is not working today…" />{errors["challenge"] && <span className="text-xs text-destructive">{errors["challenge"]}</span>}</label>
              <Button type="submit" className="mt-2 md:col-span-2">Request my assessment <ArrowRight size={17} /></Button>
              <p className="text-xs leading-5 text-muted-foreground md:col-span-2">Submitting this preview shows the confirmation experience; information is not stored yet.</p>
            </form>}
          </div>
        </div>
      </section>

      <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:flex-row md:items-center md:justify-between lg:px-8"><Logo /><p className="text-sm text-muted-foreground">Build the digital infrastructure around your customer journey.</p><a href="#top" className="text-sm font-bold text-primary">Back to top ↑</a></div></footer>
      <a
        href="https://wa.me/2348105519705?text=My%20Business%20needs%20a%20website%20that%20..."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-7 sm:right-7"
      >
        <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7 fill-current"><path d="M16.04 3A12.93 12.93 0 0 0 5.08 22.8L3.1 30l7.37-1.93A12.98 12.98 0 1 0 16.04 3Zm0 23.77c-1.9 0-3.77-.5-5.4-1.45l-.39-.23-4.37 1.15 1.17-4.26-.25-.4a10.75 10.75 0 1 1 9.24 5.19Zm5.9-8.04c-.32-.16-1.91-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.33-.83 1.05-1.02 1.27-.19.21-.38.24-.7.08-.33-.16-1.37-.5-2.61-1.61a9.8 9.8 0 0 1-1.81-2.26c-.19-.32-.02-.5.14-.66.15-.14.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.06-.4-.02-.56-.08-.17-.73-1.76-1-2.4-.26-.64-.53-.55-.73-.56h-.62c-.21 0-.56.08-.86.4-.29.33-1.13 1.11-1.13 2.7 0 1.6 1.16 3.14 1.32 3.36.16.21 2.28 3.48 5.53 4.88.77.33 1.37.53 1.84.68.77.24 1.48.21 2.03.13.62-.09 1.91-.79 2.18-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z" /></svg>
      </a>
    </main>
  );
}

function Field({ label, name, error, type = "text", maxLength }: { label: string; name: string; error: string | undefined; type?: string; maxLength: number }) {
  return <label className="grid gap-2 text-sm font-bold">{label}<input name={name} type={type} maxLength={maxLength} className="h-12 rounded-md border border-input bg-card px-3 text-foreground outline-none focus:border-primary" />{error && <span className="text-xs text-destructive">{error}</span>}</label>;
}