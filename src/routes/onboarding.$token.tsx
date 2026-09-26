import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { getOnboarding, saveOnboardingStep, createUploadUrl } from "@/lib/onboarding.functions";
import { DOMAIN, GOALS, PAGES, STEP_TITLES, stepSchemas } from "@/lib/onboarding-schema";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button";

export const Route = createFileRoute("/onboarding/$token")({
  head: () => ({
    meta: [
      { title: "Website onboarding — DigitalBusiness.fun" },
      { name: "description", content: "Tell us about your business so we can build a website that fits." },
      { property: "og:title", content: "Website onboarding — DigitalBusiness.fun" },
      { property: "og:description", content: "Your personal onboarding for your new business website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

type Values = Record<string, any>;

const DEFAULTS: Values[] = [
  { name: "", cac: "", category: "", tagline: "", about: "", years: "" },
  { whatsapp: "", phone: "", email: "", address: "", instagram: "", facebook: "", tiktok: "", website: "" },
  { goal: "", customer: "" },
  { logoPath: "", logoHelp: false, colors: "", colorHelp: false, products: [{ name: "", description: "", price: "" }], photoPaths: [], testimonials: "", hours: "" },
  { pages: ["Home", "About", "Services", "Contact"], pagesOther: "", references: "", domainStatus: "", domainName: "" },
  { caseStudy: false, publicMedia: false },
];

function OnboardingPage() {
  const { token } = Route.useParams();
  const load = useServerFn(getOnboarding);
  const { data, isLoading, isError } = useQuery({ queryKey: ["onboarding", token], queryFn: () => load({ data: { token } }), retry: false, staleTime: Infinity });

  if (isLoading) return <Shell><Loader2 className="mx-auto animate-spin text-primary" /></Shell>;
  if (isError || !data) return <Shell><h1 className="text-2xl font-extrabold">Link not found</h1><p className="mt-3 text-muted-foreground">This onboarding link isn't valid. Check the link you saved, or contact us on WhatsApp.</p><Button asChild variant="outline" className="mt-6"><Link to="/">Back to home</Link></Button></Shell>;
  return <Wizard token={token} initial={data} />;
}

function Shell({ children }: { children: ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-background px-5 text-center text-foreground"><div className="max-w-md">{children}</div></main>;
}

function Wizard({ token, initial }: { token: string; initial: NonNullable<Awaited<ReturnType<typeof getOnboarding>>> }) {
  const save = useServerFn(saveOnboardingStep);
  const total = initial.isCampaign ? 6 : 5;
  const [values, setValues] = useState<Values[]>(() =>
    DEFAULTS.map((d, i) => {
      const saved = { ...d, ...(initial.steps[i] ?? {}) };
      if (i === 1) { saved.email ||= initial.email; saved.phone ||= initial.phone; }
      if (i === 0) saved.name ||= initial.businessName;
      return saved;
    }),
  );
  const [done, setDone] = useState<number[]>(initial.stepsCompleted);
  const [step, setStep] = useState(() => { for (let i = 0; i < total; i++) if (!initial.stepsCompleted.includes(i)) return i; return total; });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty = useRef(false);

  // Auto-save a draft of the current step shortly after each change.
  useEffect(() => {
    if (!dirty.current || step >= total) return;
    const t = setTimeout(async () => {
      dirty.current = false;
      setSaving("saving");
      try { await save({ data: { token, step, values: values[step], draft: true } }); setSaving("saved"); } catch { setSaving("error"); }
    }, 1200);
    return () => clearTimeout(t);
  }, [values, step, token, total, save]);

  const set = (patch: Values) => { dirty.current = true; setValues((v) => v.map((s, i) => (i === step ? { ...s, ...patch } : s))); };

  async function next() {
    const parsed = stepSchemas[step].safeParse(values[step]);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const issue of parsed.error.issues) e[issue.path.join(".")] ??= issue.message;
      setErrors(e);
      return;
    }
    setErrors({});
    setSaving("saving");
    try {
      const res = await save({ data: { token, step, values: parsed.data, draft: false } });
      dirty.current = false;
      setDone(res.stepsCompleted);
      setSaving("saved");
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    } catch { setSaving("error"); }
  }

  const v = values[step] ?? {};
  const complete = step >= total;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <Link to="/" className="font-extrabold">DigitalBusiness<span className="text-primary">.fun</span></Link>
        <p className="mt-8 text-sm font-bold uppercase text-primary">Onboarding — {initial.businessName}</p>
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>{Math.min(done.length, total)} / {total} steps complete</span>
          <span>{saving === "saving" ? "Saving…" : saving === "saved" ? "All changes saved" : saving === "error" ? "Couldn't save — check your connection" : ""}</span>
        </div>
        <div className="mt-2 flex gap-1.5">{Array.from({ length: total }, (_, i) => <button key={i} type="button" aria-label={`Go to step ${i + 1}`} onClick={() => setStep(i)} className={`h-2 flex-1 rounded-full ${done.includes(i) ? "bg-primary" : i === step ? "bg-primary/50" : "bg-secondary"}`} />)}</div>

        {complete ? (
          <div className="mt-12 rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check /></div>
            <h1 className="mt-6 text-3xl font-extrabold">You're all set.</h1>
            <p className="mt-3 leading-7 text-muted-foreground">Thanks! We have everything we need to start building. We'll reach out on WhatsApp with next steps. You can come back to this link anytime to update your answers.</p>
            <Button variant="outline" className="mt-6" onClick={() => setStep(0)}>Review my answers</Button>
          </div>
        ) : (
          <section className="mt-10 rounded-lg border border-border bg-card p-6 md:p-8">
            <p className="font-mono text-xs text-muted-foreground">Step {step + 1} of {total}</p>
            <h1 className="mt-2 text-3xl font-extrabold">{STEP_TITLES[step]}</h1>
            <div className="mt-8 grid gap-5">
              {step === 0 && <>
                <Text label="Legal / trading name" k="name" v={v} set={set} errors={errors} />
                <Text label="CAC number (optional)" k="cac" v={v} set={set} errors={errors} />
                <Text label="Industry / category" k="category" v={v} set={set} errors={errors} />
                <Text label="One-line business description" k="tagline" v={v} set={set} errors={errors} placeholder="e.g. Affordable handmade Ankara outfits in Lagos" />
                <Text label="About your business" k="about" v={v} set={set} errors={errors} multiline />
                <Text label="Years in business" k="years" v={v} set={set} errors={errors} placeholder="e.g. 3" />
              </>}
              {step === 1 && <>
                <Text label="WhatsApp Business number" k="whatsapp" v={v} set={set} errors={errors} type="tel" />
                <Text label="Phone" k="phone" v={v} set={set} errors={errors} type="tel" />
                <Text label="Email" k="email" v={v} set={set} errors={errors} type="email" />
                <Text label="Physical address (if any)" k="address" v={v} set={set} errors={errors} />
                {["instagram", "facebook", "tiktok", "website"].map((k) => <Text key={k} label={`${k[0]!.toUpperCase()}${k.slice(1)} link (optional)`} k={k} v={v} set={set} errors={errors} placeholder="https://" />)}
              </>}
              {step === 2 && <>
                <Choice label="Main goal of your website" options={GOALS} value={v.goal} onChange={(goal) => set({ goal })} error={errors["goal"]} />
                <Text label="Describe your typical customer" k="customer" v={v} set={set} errors={errors} multiline placeholder="Who buys from you, where they are, what they care about…" />
              </>}
              {step === 3 && <ContentStep token={token} v={v} set={set} errors={errors} />}
              {step === 4 && <>
                <div className="grid gap-2 text-sm font-bold">Pages needed
                  <div className="flex flex-wrap gap-2">{PAGES.map((p) => { const on = v.pages.includes(p); return <button key={p} type="button" onClick={() => set({ pages: on ? v.pages.filter((x: string) => x !== p) : [...v.pages, p] })} className={`rounded-full border px-4 py-2 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{p}</button>; })}</div>
                  {errors["pages"] && <span className="text-xs text-destructive">{errors["pages"]}</span>}
                </div>
                {v.pages.includes("Other") && <Text label="Other pages" k="pagesOther" v={v} set={set} errors={errors} />}
                <Text label="Websites you like (optional)" k="references" v={v} set={set} errors={errors} multiline placeholder="Paste links, one per line" />
                <Choice label="Domain name" options={DOMAIN} value={v.domainStatus} onChange={(domainStatus) => set({ domainStatus })} error={errors["domainStatus"]} />
                {v.domainStatus && v.domainStatus !== "Please buy one for me" && <Text label="Domain / preferred name" k="domainName" v={v} set={set} errors={errors} placeholder="e.g. mybusiness.com.ng" />}
              </>}
              {step === 5 && <>
                <p className="text-sm leading-6 text-muted-foreground">As a campaign-rate business, we'd love to show your story. Both are optional.</p>
                <Check2 label="I agree to my business being featured as a public case study" checked={v.caseStudy} onChange={(caseStudy) => set({ caseStudy })} />
                <Check2 label="I agree to my submitted photos and testimonials being used publicly" checked={v.publicMedia} onChange={(publicMedia) => set({ publicMedia })} />
              </>}
            </div>
            <div className="mt-10 flex justify-between gap-3">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</Button>
              <Button onClick={next} disabled={saving === "saving"}>{step === total - 1 ? "Finish" : "Save & continue"} <ArrowRight size={16} /></Button>
            </div>
          </section>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">Your progress saves automatically. Bookmark this page to come back later.</p>
      </div>
    </main>
  );
}

const inputCls = "rounded-md border border-input bg-background px-3 text-foreground outline-none focus:border-primary";

function Text({ label, k, v, set, errors, multiline, type = "text", placeholder }: { label: string; k: string; v: Values; set: (p: Values) => void; errors: Record<string, string>; multiline?: boolean; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold">{label}
      {multiline
        ? <textarea rows={4} maxLength={1500} value={v[k] ?? ""} placeholder={placeholder} onChange={(e) => set({ [k]: e.target.value })} className={`${inputCls} py-3 font-normal`} />
        : <input type={type} maxLength={300} value={v[k] ?? ""} placeholder={placeholder} onChange={(e) => set({ [k]: e.target.value })} className={`${inputCls} h-12 font-normal`} />}
      {errors[k] && <span className="text-xs text-destructive">{errors[k]}</span>}
    </label>
  );
}

function Choice({ label, options, value, onChange, error }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="grid gap-2 text-sm font-bold">{label}
      <div className="grid gap-2 sm:grid-cols-2">{options.map((o) => <button key={o} type="button" onClick={() => onChange(o)} className={`rounded-md border px-4 py-3 text-left text-sm ${value === o ? "border-primary bg-primary/10" : "border-border"}`}>{o}</button>)}</div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function Check2({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-primary" />{label}</label>;
}

function ContentStep({ token, v, set, errors }: { token: string; v: Values; set: (p: Values) => void; errors: Record<string, string> }) {
  const getUrl = useServerFn(createUploadUrl);
  const [uploading, setUploading] = useState("");
  const [uploadError, setUploadError] = useState("");

  async function upload(kind: "logo" | "photo", files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    const paths: string[] = [];
    for (const file of Array.from(files).slice(0, kind === "logo" ? 1 : 20 - v.photoPaths.length)) {
      if (file.size > 10 * 1024 * 1024) { setUploadError(`${file.name} is larger than 10MB`); continue; }
      setUploading(file.name);
      try {
        const { path, uploadToken } = await getUrl({ data: { token, kind, filename: file.name, contentType: file.type } });
        const { error } = await supabase.storage.from("onboarding-assets").uploadToSignedUrl(path, uploadToken, file, { contentType: file.type });
        if (error) throw error;
        paths.push(path);
      } catch { setUploadError(`Couldn't upload ${file.name}. Use PNG, JPG or WEBP images.`); }
    }
    setUploading("");
    if (kind === "logo" && paths[0]) set({ logoPath: paths[0] });
    if (kind === "photo" && paths.length) set({ photoPaths: [...v.photoPaths, ...paths] });
  }

  const products: Values[] = v.products;
  const setProduct = (i: number, patch: Values) => set({ products: products.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  return <>
    <div className="grid gap-2 text-sm font-bold">Logo
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 font-normal hover:border-primary"><Upload size={18} className="text-primary" />{v.logoPath ? "Logo uploaded — click to replace" : "Upload your logo"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => upload("logo", e.target.files)} /></label>
      <Check2 label="I don't have a logo — please help me design one" checked={v.logoHelp} onChange={(logoHelp) => set({ logoHelp })} />
      {errors["logoPath"] && <span className="text-xs text-destructive">{errors["logoPath"]}</span>}
    </div>
    <label className="grid gap-2 text-sm font-bold">Brand colours
      <input value={v.colors} maxLength={120} placeholder="e.g. green and gold" onChange={(e) => set({ colors: e.target.value })} className={`${inputCls} h-12 font-normal`} />
      <Check2 label="Help me choose" checked={v.colorHelp} onChange={(colorHelp) => set({ colorHelp })} />
      {errors["colors"] && <span className="text-xs text-destructive">{errors["colors"]}</span>}
    </label>
    <div className="grid gap-3 text-sm font-bold">Products / services
      {products.map((p, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_120px_auto]">
          <input placeholder="Name" maxLength={100} value={p.name} onChange={(e) => setProduct(i, { name: e.target.value })} className={`${inputCls} h-11 font-normal`} />
          <input placeholder="Short description" maxLength={400} value={p.description} onChange={(e) => setProduct(i, { description: e.target.value })} className={`${inputCls} h-11 font-normal`} />
          <input placeholder="Price (₦)" maxLength={40} value={p.price} onChange={(e) => setProduct(i, { price: e.target.value })} className={`${inputCls} h-11 font-normal`} />
          <button type="button" aria-label="Remove" disabled={products.length === 1} onClick={() => set({ products: products.filter((_, j) => j !== i) })} className="grid h-11 place-items-center px-2 text-muted-foreground hover:text-destructive disabled:opacity-30"><Trash2 size={16} /></button>
          {errors[`products.${i}.name`] && <span className="text-xs text-destructive sm:col-span-4">{errors[`products.${i}.name`]}</span>}
        </div>
      ))}
      {errors["products"] && <span className="text-xs text-destructive">{errors["products"]}</span>}
      <Button type="button" variant="outline" disabled={products.length >= 40} onClick={() => set({ products: [...products, { name: "", description: "", price: "" }] })}><Plus size={16} /> Add another</Button>
    </div>
    <div className="grid gap-2 text-sm font-bold">Photos ({v.photoPaths.length}/20)
      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 font-normal hover:border-primary"><Upload size={18} className="text-primary" />Upload photos of your products, shop or team<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload("photo", e.target.files)} /></label>
      {v.photoPaths.length > 0 && <button type="button" onClick={() => set({ photoPaths: [] })} className="justify-self-start text-xs font-normal text-muted-foreground underline">Remove all photos</button>}
    </div>
    {uploading && <p className="text-sm text-muted-foreground">Uploading {uploading}…</p>}
    {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
    <Text label="Testimonials (optional)" k="testimonials" v={v} set={set} errors={errors} multiline placeholder="Paste a few customer reviews" />
    <Text label="Business hours" k="hours" v={v} set={set} errors={errors} placeholder="e.g. Mon–Sat, 9am–6pm" />
  </>;
}
