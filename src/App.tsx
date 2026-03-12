import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { cn } from "./utils/cn";
import {
  blogPosts,
  careers,
  caseStudies,
  clientLogos,
  navigation,
  portfolioProjects,
  pricingPreview,
  processSteps,
  serviceCatalog,
  socialLinks,
  stats,
  testimonials,
} from "./data/site";

const HeroScene = lazy(() => import("./components/HeroScene"));

gsap.registerPlugin(ScrollTrigger);

type ThemeMode = "dark" | "light";
type AppointmentRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "approved" | "rejected";
};
type MessageRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};
type LeadRecord = { id: string; name: string; email: string; interest: string };
type NewsletterRecord = { id: string; email: string };

const STORAGE_SYNC_EVENT = "digibro-storage-sync";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key } }));
}

function useStoredValue<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));

  useEffect(() => {
    const syncValue = () => setValue(readStorage(key, fallback));

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === key) {
        syncValue();
      }
    };

    const handleCustomSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (!customEvent.detail?.key || customEvent.detail.key === key) {
        syncValue();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_SYNC_EVENT, handleCustomSync as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomSync as EventListener);
    };
  }, [fallback, key]);

  return [value, setValue] as const;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function submitWithFallback<T>(key: string, payload: T) {
  const current = readStorage<T[]>(key, []);
  const next = [payload, ...current];
  writeStorage(key, next);
}

const API_BASE_URL = "https://digibro-api.vercel.app/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? ((await response.json()) as T | { message?: string }) : null;

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

function normalizeServiceRecord(service: any) {
  return {
    ...service,
    slug: service.slug || slugify(service.name || "service"),
    shortDescription: service.shortDescription || service.description || "",
    process: Array.isArray(service.process) && service.process.length ? service.process : ["Discover", "Design", "Build", "Launch"],
    packages: Array.isArray(service.packages) && service.packages.length
      ? service.packages
      : [{ name: "Custom", price: "Custom", features: ["Scope on request"] }],
    results: Array.isArray(service.results) && service.results.length ? service.results : ["Tailored delivery"],
  };
}

function normalizeBlogRecord(post: any) {
  return {
    ...post,
    slug: post.slug || slugify(post.title || "post"),
    excerpt: post.excerpt || "",
    readTime: post.readTime || "3 min read",
    content: Array.isArray(post.content) && post.content.length ? post.content : [post.excerpt || ""],
    author: post.author || "DIGIBRO Team",
  };
}

function normalizePortfolioRecord(project: any) {
  return {
    ...project,
    slug: project.slug || slugify(project.name || "project"),
    image: project.image || project.images?.[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    metrics: Array.isArray(project.metrics) && project.metrics.length ? project.metrics : ["Pending metrics"],
    testimonial: project.testimonial || "Awaiting testimonial.",
  };
}

function normalizeAppointmentRecord(appointment: any): AppointmentRecord {
  return {
    id: appointment.id || appointment._id || createId("appt"),
    name: appointment.name || "",
    email: appointment.email || "",
    phone: appointment.phone || "",
    service: appointment.service || "",
    message: appointment.message || "",
    preferredDate: appointment.preferredDate || "",
    preferredTime: appointment.preferredTime || "",
    status: appointment.status || "pending",
  };
}

function normalizeMessageRecord(message: any): MessageRecord {
  return {
    id: message.id || message._id || createId("msg"),
    name: message.name || "",
    email: message.email || "",
    phone: message.phone || "",
    company: message.company || "",
    message: message.message || "",
  };
}

function Seo({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.setAttribute("name", "description");
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute("content", description);

    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement("meta");
      keywordsMeta.setAttribute("name", "keywords");
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute(
      "content",
      "DIGIBRO, marketing agency, web design, branding, SEO, paid ads, digital growth partner",
    );

    let schemaTag = document.getElementById("digibro-schema") as HTMLScriptElement | null;
    if (!schemaTag) {
      schemaTag = document.createElement("script");
      schemaTag.id = "digibro-schema";
      schemaTag.type = "application/ld+json";
      document.head.appendChild(schemaTag);
    }

    schemaTag.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "DIGIBRO",
      url: "https://digibro.agency",
      slogan: "Digital Growth Partner",
      description,
      sameAs: socialLinks.map((link) => link.href),
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-202-555-0194",
        email: "hello@digibro.agency",
        contactType: "sales",
      },
    });
  }, [description, title]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return null;
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      data-reveal
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value,
      duration: 1.8,
      ease: "power3.out",
      onUpdate: () => setDisplay(Math.round(counter.value)),
    });

    return () => {
      tween.kill();
    };
  }, [inView, value]);

  return (
    <div ref={ref} className="glass-panel surface-outline rounded-[1.75rem] p-6">
      <div className="text-4xl font-semibold tracking-tight text-[var(--text)] md:text-5xl">
        {display}
        {suffix}
      </div>
      <p className="mt-3 text-sm uppercase tracking-[0.28em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-xs uppercase tracking-[0.4em] text-[#73b1ff]">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-[var(--text)] md:text-5xl">{title}</h2>
      <p className="max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">{description}</p>
    </div>
  );
}

function MagneticAction({
  children,
  to,
  onClick,
  className,
  buttonType = "button",
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  buttonType?: "button" | "submit";
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const element = wrapperRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    element.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
  };

  const handleLeave = () => {
    if (!wrapperRef.current) return;
    wrapperRef.current.style.transform = "translate(0px, 0px)";
  };

  const sharedClassName = cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium tracking-[0.18em] uppercase transition-all duration-300",
    "bg-gradient-to-r from-[#4f9cff] to-[#8b5cf6] text-white shadow-[0_20px_40px_rgba(79,156,255,0.28)] hover:shadow-[0_24px_60px_rgba(79,156,255,0.4)]",
    className,
  );

  return (
    <div ref={wrapperRef} onMouseMove={handleMove} onMouseLeave={handleLeave} className="inline-block transition-transform duration-200">
      {to ? (
        <Link to={to} className={sharedClassName}>
          {children}
        </Link>
      ) : (
        <button type={buttonType} onClick={onClick} className={sharedClassName}>
          {children}
        </button>
      )}
    </div>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="section-shell relative overflow-hidden px-6 pb-14 pt-32 md:px-10 md:pb-20 lg:px-16">
      <div className="ambient-orb left-[-8rem] top-8 h-52 w-52 bg-[#4f9cff]" />
      <div className="ambient-orb right-[-6rem] top-16 h-56 w-56 bg-[#8b5cf6]" />
      <div className="mx-auto max-w-7xl">
        <Reveal className="glass-panel-strong surface-outline max-w-4xl rounded-[2rem] px-6 py-10 md:px-10 md:py-14">
          <p className="text-xs uppercase tracking-[0.42em] text-[#73b1ff]">{eyebrow}</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">{description}</p>
        </Reveal>
      </div>
    </section>
  );
}

function HomePage({ onLeadOpen }: { onLeadOpen: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [services, setServices] = useState(() => serviceCatalog.map(normalizeServiceRecord));
  const [projects, setProjects] = useState(() => portfolioProjects.map(normalizePortfolioRecord));

  useLayoutEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo("[data-hero-brand]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo("[data-hero-line]", { opacity: 0, y: 42 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, "-=0.25")
        .fromTo("[data-hero-copy]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
        .fromTo("[data-hero-cta]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08 }, "-=0.45")
        .fromTo("[data-hero-scroll]", { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.35");
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const [remoteServices, remoteProjects] = await Promise.all([
          apiFetch<any[]>("/services"),
          apiFetch<any[]>("/portfolio"),
        ]);

        if (!active) return;

        setServices(remoteServices.map(normalizeServiceRecord));
        setProjects(remoteProjects.map(normalizePortfolioRecord));
      } catch {
        // Fallback to bundled demo content if API is unavailable
      }
    };

    void loadContent();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonials.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <Seo title="DIGIBRO | Digital Growth Partner" description="DIGIBRO builds premium websites, brands, campaigns, and automation systems for ambitious companies." />
      <section ref={heroRef} className="section-shell relative min-h-screen overflow-hidden px-6 pb-16 pt-28 md:px-10 lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,156,255,0.16),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.22),transparent_28%)]" />
        <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,156,255,0.15),transparent_35%)]" />}>
          <HeroScene />
        </Suspense>
        <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-7xl flex-col justify-center">
          <div className="max-w-4xl">
            <div data-hero-brand className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.36em] text-[#b5cfff] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#4f9cff] shadow-[0_0_18px_#4f9cff]" />
              DIGIBRO
              <span className="text-[var(--muted)]">Digital Growth Partner</span>
            </div>
            <div className="space-y-3 text-balance">
              <h1 data-hero-line className="gradient-text text-5xl font-semibold tracking-[-0.04em] md:text-7xl lg:text-[5.5rem]">
                DIGIBRO
              </h1>
              <h2 data-hero-line className="text-4xl font-semibold leading-tight tracking-[-0.05em] text-[var(--text)] md:text-6xl lg:text-[4.75rem]">
                We engineer brands that move markets.
              </h2>
            </div>
            <p data-hero-copy className="mt-8 max-w-2xl text-lg leading-8 text-[var(--muted)] md:text-xl">
              Futuristic strategy, cinematic design, performance media, and automation systems for companies that want to look elite and grow like it.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <div data-hero-cta>
                <MagneticAction to="/book">Book a Growth Call</MagneticAction>
              </div>
              <div data-hero-cta>
                <MagneticAction
                  onClick={onLeadOpen}
                  className="bg-transparent text-[var(--text)] shadow-none ring-1 ring-[var(--border)] hover:bg-white/5"
                >
                  Get Proposal Deck
                </MagneticAction>
              </div>
            </div>
          </div>
          <div data-hero-scroll className="mt-16 flex items-center gap-4 text-xs uppercase tracking-[0.36em] text-[var(--muted)]">
            <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="inline-flex h-12 w-7 items-start rounded-full border border-[var(--border)] p-1">
              <span className="h-2 w-2 rounded-full bg-[#4f9cff]" />
            </motion.span>
            Scroll to discover
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrow="Selected Services"
            title="A full-stack growth agency built to make premium brands perform."
            description="Every service is designed to connect brand perception, conversion architecture, and repeatable growth operations."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <Reveal key={service.slug}>
                <Link
                  to={`/services/${service.slug}`}
                  className="glass-panel surface-outline group block rounded-[1.8rem] p-6 transition-transform duration-500 hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.35em] text-[#73b1ff]">{service.category}</span>
                    <span className="text-sm text-[var(--muted)]">0{service.process.length}</span>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold text-[var(--text)]">{service.name}</h3>
                  <p className="mt-4 text-base leading-7 text-[var(--muted)]">{service.shortDescription}</p>
                  <div className="mt-8 flex items-center justify-between text-sm uppercase tracking-[0.24em] text-[var(--text)]">
                    Explore service
                    <span className="transition-transform duration-300 group-hover:translate-x-2">+</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <Reveal>
            <SectionHeading
              eyebrow="About DIGIBRO"
              title="We combine agency aesthetics with operator discipline."
              description="DIGIBRO was built for founders and teams who need more than deliverables. We create the story, the system, and the growth environment around it."
            />
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">What makes us different</p>
              <div className="mt-6 space-y-5 text-[var(--muted)]">
                <p>Strategy-first engagements grounded in actual demand generation, not visual trends alone.</p>
                <p>Motion-rich digital experiences that stay fast, purposeful, and conversion-ready.</p>
                <p>Backend-ready systems including booking flows, dashboards, and automation integrations.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrow="Portfolio"
            title="Recent launches that changed perception and revenue at the same time."
            description="Every project below combines premium presentation with measurable business movement."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {projects.map((project, index) => (
              <Reveal key={project.slug} className={index % 2 ? "lg:mt-16" : undefined}>
                <Link to={`/portfolio/${project.slug}`} className="group block overflow-hidden rounded-[2rem]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
                    <img src={project.image} alt={project.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <p className="text-xs uppercase tracking-[0.35em] text-[#b5cfff]">{project.category}</p>
                      <h3 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{project.name}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 md:text-base">{project.summary}</p>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrow="Impact"
            title="Metrics that reflect premium execution and business momentum."
            description="We design for growth, and we measure it across creative, funnel, and retention performance."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <AnimatedCounter key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <SectionHeading
            eyebrow="Trusted By Builders"
            title="Teams partner with DIGIBRO when they need authority fast."
            description="From venture-backed startups to scaling operators, our clients come to us when growth and brand can no longer be separated."
          />
          <div className="glass-panel rounded-full px-0 py-5">
            <div className="marquee-track flex min-w-max gap-14 px-8 text-sm uppercase tracking-[0.45em] text-[var(--muted)]">
              {[...clientLogos, ...clientLogos].map((logo, index) => (
                <span key={`${logo}-${index}`}>{logo}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHeading
              eyebrow="Testimonials"
              title="Partnerships built on trust, velocity, and measurable lift."
              description="Our clients usually come in for one problem and stay because the entire growth system gets stronger."
            />
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline min-h-[20rem] rounded-[2rem] p-8 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonials[activeTestimonial].name}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45 }}
                >
                  <p className="text-2xl leading-[1.5] text-[var(--text)] md:text-3xl">“{testimonials[activeTestimonial].quote}”</p>
                  <div className="mt-10 text-sm uppercase tracking-[0.28em] text-[var(--muted)]">
                    <div className="text-[var(--text)]">{testimonials[activeTestimonial].name}</div>
                    <div className="mt-2">{testimonials[activeTestimonial].role}</div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex gap-3">
                {testimonials.map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    aria-label={`Show testimonial ${item.name}`}
                    onClick={() => setActiveTestimonial(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === activeTestimonial ? "w-14 bg-[#4f9cff]" : "w-8 bg-white/15",
                    )}
                  />
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrow="Process"
            title="A four-part system for premium positioning and scalable demand."
            description="One team, one rhythm, one growth narrative from strategy through optimization."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step) => (
              <Reveal key={step.index}>
                <div className="glass-panel surface-outline h-full rounded-[1.75rem] p-6">
                  <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">{step.index}</div>
                  <h3 className="mt-10 text-2xl font-semibold text-[var(--text)]">{step.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[var(--muted)]">{step.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrow="Pricing Preview"
            title="Flexible engagements for launches, growth phases, and full-stack partnerships."
            description="Transparent packages to help ambitious teams move quickly before custom retainers or multi-quarter builds."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {pricingPreview.map((tier, index) => (
              <Reveal key={tier.title}>
                <div className={cn("glass-panel surface-outline rounded-[2rem] p-8", index === 1 && "border border-[#4f9cff]/40") }>
                  <p className="text-sm uppercase tracking-[0.32em] text-[#73b1ff]">{tier.title}</p>
                  <div className="mt-6 text-4xl font-semibold tracking-tight text-[var(--text)]">{tier.price}</div>
                  <p className="mt-4 text-base leading-7 text-[var(--muted)]">{tier.description}</p>
                  <div className="mt-8 space-y-4 text-sm leading-6 text-[var(--text)]">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#4f9cff]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 pt-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="glass-panel-strong surface-outline overflow-hidden rounded-[2.2rem] p-8 md:p-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.4em] text-[#73b1ff]">Ready To Scale</p>
                  <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                    Build a digital presence that feels like your next funding round already happened.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                    Book a strategy session, request a proposal deck, or let us map the fastest route to your next stage of growth.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <MagneticAction to="/book">Start a Project</MagneticAction>
                  <MagneticAction
                    to="/contact"
                    className="bg-transparent text-[var(--text)] shadow-none ring-1 ring-[var(--border)] hover:bg-white/5"
                  >
                    Talk to DIGIBRO
                  </MagneticAction>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <>
      <Seo title="About DIGIBRO" description="Meet DIGIBRO, a futuristic digital growth agency blending strategy, design, development, and performance marketing." />
      <PageHero
        eyebrow="About"
        title="DIGIBRO exists to make ambitious brands look inevitable."
        description="We design digital systems where premium perception and measurable growth reinforce each other across every touchpoint."
      />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8 md:p-10">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Our philosophy</p>
              <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
                Strong agencies do not just make things look polished. They remove growth friction, clarify positioning, and build trust fast. DIGIBRO was built around that principle.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8 md:p-10">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Capabilities</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {serviceCatalog.map((service) => (
                  <div key={service.slug} className="rounded-2xl border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                    <div className="text-[var(--text)]">{service.name}</div>
                    <div className="mt-2 uppercase tracking-[0.24em] text-[#73b1ff]">{service.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ServicesPage() {
  const [services, setServices] = useState(() => serviceCatalog.map(normalizeServiceRecord));

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        const remoteServices = await apiFetch<any[]>("/services");
        if (!active) return;
        setServices(remoteServices.map(normalizeServiceRecord));
      } catch {
        // Keep demo services when API is unavailable
      }
    };

    void loadServices();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Seo title="DIGIBRO Services" description="Explore DIGIBRO services including web development, branding, SEO, paid media, design, and automation." />
      <PageHero
        eyebrow="Services"
        title="Specialized services connected by one growth system."
        description="Database-ready service architecture, premium design, measurable performance, and hands-on implementation under one brand-led process."
      />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Reveal key={service.slug}>
              <Link to={`/services/${service.slug}`} className="glass-panel surface-outline block rounded-[1.8rem] p-6 transition-transform duration-300 hover:-translate-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-[#73b1ff]">{service.category}</span>
                  <span className="text-[var(--muted)]">{service.packages[0].price}</span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold text-[var(--text)]">{service.name}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--muted)]">{service.description}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function ServiceDetailPage() {
  const params = useParams();
  const [services, setServices] = useState(() => serviceCatalog.map(normalizeServiceRecord));

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        const remoteServices = await apiFetch<any[]>("/services");
        if (!active) return;
        setServices(remoteServices.map(normalizeServiceRecord));
      } catch {
        // Fallback to bundled services
      }
    };

    void loadServices();

    return () => {
      active = false;
    };
  }, []);

  const service = services.find((entry) => entry.slug === params.slug);

  if (!service) return <Navigate to="/services" replace />;

  return (
    <>
      <Seo title={`${service.name} | DIGIBRO`} description={service.description} />
      <PageHero eyebrow={service.category} title={service.name} description={service.description} />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Process</p>
              <div className="mt-6 space-y-5">
                {service.process.map((step, index) => (
                  <div key={step} className="flex gap-4 text-[var(--muted)]">
                    <span className="text-sm text-[var(--text)]">0{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Pricing packages</p>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {service.packages.map((pack) => (
                  <div key={pack.name} className="rounded-[1.5rem] border border-[var(--border)] p-5">
                    <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">{pack.name}</div>
                    <div className="mt-4 text-3xl font-semibold text-[var(--text)]">{pack.price}</div>
                    <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
                      {pack.features.map((feature) => (
                        <div key={feature}>{feature}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Portfolio examples</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {portfolioProjects.slice(0, 2).map((project) => (
                  <Link key={project.slug} to={`/portfolio/${project.slug}`} className="rounded-[1.5rem] border border-[var(--border)] p-4 transition-colors hover:border-[#4f9cff]/50">
                    <div className="text-[var(--text)]">{project.name}</div>
                    <div className="mt-2 text-sm text-[var(--muted)]">{project.summary}</div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Expected outcomes</p>
              <div className="mt-6 space-y-4 text-[var(--muted)]">
                {service.results.map((result) => (
                  <div key={result} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#4f9cff]" />
                    <span>{result}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <MagneticAction to="/book">Book Consultation</MagneticAction>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function PortfolioPage() {
  const [filter, setFilter] = useState("All");
  const [projects, setProjects] = useState(() => portfolioProjects.map(normalizePortfolioRecord));
  const filters = ["All", "Web Design", "Branding", "Social Media", "Video"];
  const visible = filter === "All" ? projects : projects.filter((project) => project.category === filter);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        const remoteProjects = await apiFetch<any[]>("/portfolio");
        if (!active) return;
        setProjects(remoteProjects.map(normalizePortfolioRecord));
      } catch {
        // Keep demo projects if API is unavailable
      }
    };

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Seo title="DIGIBRO Portfolio" description="Browse DIGIBRO portfolio projects across web design, branding, social media, and video campaigns." />
      <PageHero
        eyebrow="Portfolio"
        title="Selected work designed to look premium and perform harder."
        description="Filter through our work across web design, branding, social media, and launch visuals."
      />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="flex flex-wrap gap-3">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm transition-colors",
                  item === filter ? "bg-white text-slate-900" : "glass-panel text-[var(--muted)]",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {visible.map((project) => (
              <Reveal key={project.slug}>
                <Link to={`/portfolio/${project.slug}`} className="group block overflow-hidden rounded-[2rem]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
                    <img src={project.image} alt={project.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="text-xs uppercase tracking-[0.32em] text-[#b5cfff]">{project.category}</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{project.name}</div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PortfolioDetailPage() {
  const params = useParams();
  const [projects, setProjects] = useState(() => portfolioProjects.map(normalizePortfolioRecord));

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        const remoteProjects = await apiFetch<any[]>("/portfolio");
        if (!active) return;
        setProjects(remoteProjects.map(normalizePortfolioRecord));
      } catch {
        // Fallback to bundled portfolio
      }
    };

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);
  const project = projects.find((entry) => entry.slug === params.slug);

  if (!project) return <Navigate to="/portfolio" replace />;

  return (
    <>
      <Seo title={`${project.name} | DIGIBRO`} description={project.summary} />
      <PageHero eyebrow={project.category} title={project.name} description={project.summary} />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <Reveal>
            <div className="overflow-hidden rounded-[2rem]">
              <img src={project.image} alt={project.name} className="h-[28rem] w-full object-cover" />
            </div>
          </Reveal>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <div className="glass-panel surface-outline rounded-[2rem] p-8">
                <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Project overview</p>
                <p className="mt-6 text-base leading-8 text-[var(--muted)]">Client: {project.client}</p>
                <p className="mt-4 text-base leading-8 text-[var(--muted)]">{project.summary}</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="glass-panel surface-outline rounded-[2rem] p-8">
                <p className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Results</p>
                <div className="mt-6 space-y-4">
                  {project.metrics.map((metric) => (
                    <div key={metric} className="text-xl text-[var(--text)]">{metric}</div>
                  ))}
                </div>
                <p className="mt-8 text-base leading-8 text-[var(--muted)]">“{project.testimonial}”</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function CaseStudiesPage() {
  return (
    <>
      <Seo title="DIGIBRO Case Studies" description="Read DIGIBRO case studies across SaaS, healthcare, and consumer growth campaigns." />
      <PageHero eyebrow="Case Studies" title="How premium strategy translates into measurable outcomes." description="A closer look at how DIGIBRO combines positioning, design, and acquisition systems to move real numbers." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-6">
          {caseStudies.map((study) => (
            <Reveal key={study.slug}>
              <Link to={`/case-studies/${study.slug}`} className="glass-panel surface-outline block rounded-[2rem] p-8 transition-transform duration-300 hover:-translate-y-1">
                <div className="text-xs uppercase tracking-[0.35em] text-[#73b1ff]">{study.industry}</div>
                <h3 className="mt-5 text-3xl font-semibold text-[var(--text)]">{study.title}</h3>
                <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">{study.challenge}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function CaseStudyDetailPage() {
  const params = useParams();
  const study = caseStudies.find((entry) => entry.slug === params.slug);
  if (!study) return <Navigate to="/case-studies" replace />;

  return (
    <>
      <Seo title={`${study.title} | DIGIBRO`} description={study.challenge} />
      <PageHero eyebrow={study.industry} title={study.title} description={study.challenge} />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Challenge</div>
              <p className="mt-5 text-base leading-8 text-[var(--muted)]">{study.challenge}</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Solution</div>
              <p className="mt-5 text-base leading-8 text-[var(--muted)]">{study.solution}</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Outcome</div>
              <div className="mt-5 space-y-4 text-[var(--muted)]">
                {study.outcome.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function PricingPage() {
  return (
    <>
      <Seo title="DIGIBRO Pricing" description="Review DIGIBRO pricing for launch sprints, growth retainers, and full-stack digital leadership engagements." />
      <PageHero eyebrow="Pricing" title="Flexible packages for serious growth phases." description="Choose a sprint, a growth engine, or a flagship partnership, then customize around your stage and revenue goals." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {pricingPreview.map((tier) => (
            <Reveal key={tier.title}>
              <div className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">{tier.title}</div>
                <div className="mt-6 text-5xl font-semibold text-[var(--text)]">{tier.price}</div>
                <p className="mt-5 text-base leading-8 text-[var(--muted)]">{tier.description}</p>
                <div className="mt-8 space-y-4 text-sm text-[var(--muted)]">
                  {tier.features.map((feature) => (
                    <div key={feature}>{feature}</div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function BlogPage() {
  const [posts, setPosts] = useState(() => blogPosts.map(normalizeBlogRecord));

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      try {
        const remotePosts = await apiFetch<any[]>("/blog");
        if (!active) return;
        setPosts(remotePosts.map(normalizeBlogRecord));
      } catch {
        // Keep demo posts when API is unavailable
      }
    };

    void loadPosts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Seo title="DIGIBRO Blog" description="Insights from DIGIBRO on digital strategy, websites, branding, conversion, and performance growth." />
      <PageHero eyebrow="Blog" title="Ideas on building digital brands that perform like market leaders." description="Strategy notes, creative thinking, and performance frameworks from the DIGIBRO team." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <Reveal key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="glass-panel surface-outline block rounded-[2rem] p-8 transition-transform duration-300 hover:-translate-y-2">
                <div className="text-xs uppercase tracking-[0.35em] text-[#73b1ff]">{post.category}</div>
                <h3 className="mt-5 text-2xl font-semibold text-[var(--text)]">{post.title}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--muted)]">{post.excerpt}</p>
                <div className="mt-6 text-sm text-[var(--muted)]">{post.readTime}</div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function BlogDetailPage() {
  const params = useParams();
  const [posts, setPosts] = useState(() => blogPosts.map(normalizeBlogRecord));

  useEffect(() => {
    let active = true;

    const loadPosts = async () => {
      try {
        const remotePosts = await apiFetch<any[]>("/blog");
        if (!active) return;
        setPosts(remotePosts.map(normalizeBlogRecord));
      } catch {
        // Fallback to bundled posts
      }
    };

    void loadPosts();

    return () => {
      active = false;
    };
  }, []);
  const post = posts.find((entry) => entry.slug === params.slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <>
      <Seo title={`${post.title} | DIGIBRO`} description={post.excerpt} />
      <PageHero eyebrow={post.category} title={post.title} description={post.excerpt} />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel surface-outline rounded-[2rem] p-8 md:p-12">
            <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">{post.readTime}</div>
            <div className="mt-8 space-y-6 text-lg leading-9 text-[var(--muted)]">
              {post.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload: MessageRecord = {
      id: createId("msg"),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      company: String(formData.get("company") || ""),
      message: String(formData.get("message") || ""),
    };

    try {
      const saved = await apiFetch<Record<string, unknown>>("/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      submitWithFallback("digibro_messages", normalizeMessageRecord(saved));
    } catch {
      submitWithFallback("digibro_messages", payload);
    }

    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <>
      <Seo title="Contact DIGIBRO" description="Contact DIGIBRO for premium websites, branding, paid media, automation, and digital growth consulting." />
      <PageHero eyebrow="Contact" title="Talk to the team building premium digital growth systems." description="Start a project, request a proposal, or ask us how DIGIBRO would approach your current growth bottleneck." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="glass-panel surface-outline rounded-[2rem] p-8">
              <div className="space-y-5 text-[var(--muted)]">
                <p>Email: hello@digibro.agency</p>
                <p>Phone: +1 (202) 555-0194</p>
                <p>Office: 19 Future Avenue, Dubai Internet City</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-4 text-sm uppercase tracking-[0.28em] text-[#73b1ff]">
                {socialLinks.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
                <iframe
                  title="DIGIBRO Office Map"
                  src="https://www.google.com/maps?q=Dubai%20Internet%20City&z=14&output=embed"
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </Reveal>
          <Reveal>
            <form onSubmit={handleSubmit} className="glass-panel surface-outline rounded-[2rem] p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <input name="name" required placeholder="Name" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                <input name="email" type="email" required placeholder="Email" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                <input name="phone" placeholder="Phone" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                <input name="company" placeholder="Company" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
              </div>
              <textarea name="message" required placeholder="Tell us about your project" rows={6} className="mt-5 w-full rounded-[1.5rem] border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <MagneticAction buttonType="submit">Send Message</MagneticAction>
                {submitted ? <p className="text-sm text-[#73b1ff]">Message saved and ready for backend sync.</p> : null}
              </div>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function BookPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const payload: AppointmentRecord = {
      id: createId("appt"),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      service: String(formData.get("service") || ""),
      message: String(formData.get("message") || ""),
      preferredDate: String(formData.get("preferredDate") || ""),
      preferredTime: String(formData.get("preferredTime") || ""),
      status: "pending",
    };

    try {
      const saved = await apiFetch<Record<string, unknown>>("/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      submitWithFallback("digibro_appointments", normalizeAppointmentRecord(saved));
    } catch {
      submitWithFallback("digibro_appointments", payload);
    }

    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <>
      <Seo title="Book Appointment | DIGIBRO" description="Book a consultation with DIGIBRO to discuss websites, branding, SEO, paid media, automation, and growth systems." />
      <PageHero eyebrow="Book Appointment" title="Book a strategy session with DIGIBRO." description="Tell us what you need, choose a preferred date and time, and our team will confirm the next steps." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <form onSubmit={handleSubmit} className="glass-panel surface-outline rounded-[2rem] p-8 md:p-10">
              <div className="grid gap-5 md:grid-cols-2">
                <input name="name" required placeholder="Name" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                <input name="email" type="email" required placeholder="Email" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                <input name="phone" required placeholder="Phone" className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                <select name="service" required className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 outline-none">
                  <option value="">Select Service</option>
                  {serviceCatalog.map((service) => (
                    <option key={service.slug} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <input name="preferredDate" type="date" required className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 outline-none" />
                <input name="preferredTime" type="time" required className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-4 outline-none" />
              </div>
              <textarea name="message" required rows={6} placeholder="Tell us about your goals" className="mt-5 w-full rounded-[1.5rem] border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <MagneticAction buttonType="submit">Book Appointment</MagneticAction>
                {submitted ? <p className="text-sm text-[#73b1ff]">Booking stored locally and ready for API processing.</p> : null}
              </div>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function CareersPage() {
  return (
    <>
      <Seo title="DIGIBRO Careers" description="Join DIGIBRO and help design premium digital growth systems across strategy, creative, and development." />
      <PageHero eyebrow="Careers" title="Join a team obsessed with premium execution and measurable growth." description="We work across branding, websites, paid media, automation, and digital product experiences for ambitious clients." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-6">
          {careers.map((role) => (
            <Reveal key={role.title}>
              <div className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-3xl font-semibold text-[var(--text)]">{role.title}</h3>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">{role.summary}</p>
                  </div>
                  <div className="text-sm uppercase tracking-[0.28em] text-[#73b1ff]">
                    <div>{role.type}</div>
                    <div className="mt-2 text-[var(--muted)]">{role.location}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

function AdminLoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    setError("");

    try {
      const response = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      onLogin(response.token);
      navigate("/admin");
      return;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to log in.");
    }
  };

  return (
    <>
      <Seo title="Admin Login | DIGIBRO" description="Secure admin login for the DIGIBRO dashboard." />
      <PageHero eyebrow="Admin" title="Protected DIGIBRO dashboard access." description="This demo route mimics the production admin panel and can be wired directly to the included Express and MongoDB backend." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-xl">
          <form onSubmit={handleSubmit} className="glass-panel surface-outline rounded-[2rem] p-8">
            <div className="space-y-5">
              <input name="email" type="email" placeholder="Admin email" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
              <input name="password" type="password" placeholder="Password" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <MagneticAction buttonType="submit">Login</MagneticAction>
              {error ? <p className="text-sm text-[#73b1ff]">{error}</p> : null}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

function ProtectedRoute({ token, children }: { token: string | null; children: ReactNode }) {
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AdminDashboardPage({ token, onLogout }: { token: string | null; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [servicesState, setServicesState] = useStoredValue("digibro_admin_services", serviceCatalog);
  const [blogState, setBlogState] = useStoredValue("digibro_admin_blog", blogPosts);
  const [portfolioState, setPortfolioState] = useStoredValue("digibro_admin_portfolio", portfolioProjects);
  const [appointments, setAppointments] = useStoredValue<AppointmentRecord[]>("digibro_appointments", []);
  const [messages] = useStoredValue<MessageRecord[]>("digibro_messages", []);
  const [leads] = useStoredValue<LeadRecord[]>("digibro_leads", []);
  const [newsletters] = useStoredValue<NewsletterRecord[]>("digibro_newsletter", []);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const syncAdminData = async () => {
      try {
        const [remoteServices, remoteAppointments, remoteMessages, remoteBlog, remotePortfolio] = await Promise.all([
          apiFetch<any[]>("/services"),
          apiFetch<any[]>("/appointments", {}, token),
          apiFetch<any[]>("/messages", {}, token),
          apiFetch<any[]>("/blog"),
          apiFetch<any[]>("/portfolio"),
        ]);

        if (!active) return;

        writeStorage("digibro_admin_services", remoteServices.map(normalizeServiceRecord));
        writeStorage("digibro_appointments", remoteAppointments.map(normalizeAppointmentRecord));
        writeStorage("digibro_messages", remoteMessages.map(normalizeMessageRecord));
        writeStorage("digibro_admin_blog", remoteBlog.map(normalizeBlogRecord));
        writeStorage("digibro_admin_portfolio", remotePortfolio.map(normalizePortfolioRecord));
      } catch {
        // Local storage remains the offline fallback if the API is unreachable.
      }
    };

    void syncAdminData();

    return () => {
      active = false;
    };
  }, [token]);

  const overview = useMemo(
    () => [
      { label: "Total Clients", value: leads.length + 24 },
      { label: "Total Appointments", value: appointments.length },
      { label: "Total Services", value: servicesState.length },
      { label: "Total Messages", value: messages.length },
    ],
    [appointments.length, leads.length, messages.length, servicesState.length],
  );

  const saveServices = (next: typeof serviceCatalog) => {
    setServicesState(next);
    writeStorage("digibro_admin_services", next);
  };

  const saveBlog = (next: typeof blogPosts) => {
    setBlogState(next);
    writeStorage("digibro_admin_blog", next);
  };

  const savePortfolio = (next: typeof portfolioProjects) => {
    setPortfolioState(next);
    writeStorage("digibro_admin_portfolio", next);
  };

  const deleteService = async (slug: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/services/${slug}`, { method: "DELETE" }, token);
      saveServices(servicesState.filter((item) => item.slug !== slug));
    } catch {
      console.error("Failed to delete service from API");
      return;
    }
  };

  const deleteBlogPost = async (slug: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/blog/${slug}`, { method: "DELETE" }, token);
      saveBlog(blogState.filter((item) => item.slug !== slug));
    } catch {
      console.error("Failed to delete blog post from API");
      return;
    }
  };

  const deletePortfolioProject = async (slug: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/portfolio/${slug}`, { method: "DELETE" }, token);
      savePortfolio(portfolioState.filter((item) => item.slug !== slug));
    } catch {
      console.error("Failed to delete portfolio project from API");
      return;
    }
  };

  const handleServiceCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const servicePayload = normalizeServiceRecord({
      slug: slugify(name),
      name,
      category: String(formData.get("category") || "Custom"),
      shortDescription: String(formData.get("shortDescription") || ""),
      description: String(formData.get("description") || ""),
    });

    try {
      const created = await apiFetch<any>("/services", {
        method: "POST",
        body: JSON.stringify(servicePayload),
      }, token);
      saveServices([normalizeServiceRecord(created), ...servicesState.filter((item) => item.slug !== servicePayload.slug)]);
    } catch (error) {
      console.error("Failed to create service via API", error);
      return;
    }

    event.currentTarget.reset();
  };

  const handleBlogCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "");
    const blogPayload = normalizeBlogRecord({
      slug: slugify(title),
      title,
      category: String(formData.get("category") || "Insights"),
      excerpt: String(formData.get("excerpt") || ""),
    });

    try {
      const created = await apiFetch<any>("/blog", {
        method: "POST",
        body: JSON.stringify(blogPayload),
      }, token);
      saveBlog([normalizeBlogRecord(created), ...blogState.filter((item) => item.slug !== blogPayload.slug)]);
    } catch (error) {
      console.error("Failed to create blog post via API", error);
      return;
    }

    event.currentTarget.reset();
  };

  const handlePortfolioCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const portfolioPayload = normalizePortfolioRecord({
      slug: slugify(name),
      name,
      category: String(formData.get("category") || "Web Design"),
      client: String(formData.get("client") || "New Client"),
      summary: String(formData.get("summary") || ""),
    });

    try {
      const created = await apiFetch<any>("/portfolio", {
        method: "POST",
        body: JSON.stringify(portfolioPayload),
      }, token);
      savePortfolio([normalizePortfolioRecord(created), ...portfolioState.filter((item) => item.slug !== portfolioPayload.slug)]);
    } catch (error) {
      console.error("Failed to create portfolio project via API", error);
      return;
    }

    event.currentTarget.reset();
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentRecord["status"]) => {
    try {
      const updated = await apiFetch<any>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }, token);

      const normalized = normalizeAppointmentRecord(updated);
      const next = appointments.map((item) => (item.id === id ? normalized : item));
      setAppointments(next);
      writeStorage("digibro_appointments", next);
      return;
    } catch (error) {
      console.error("Failed to update appointment status via API", error);
    }
  };

  return (
    <>
      <Seo title="DIGIBRO Admin Dashboard" description="Protected admin dashboard for DIGIBRO services, appointments, messages, blog, and portfolio management." />
      <PageHero eyebrow="Admin Panel" title="Operations dashboard for the DIGIBRO growth machine." description="Manage core site content, review bookings, monitor inbox activity, and keep launch assets current from one protected workspace." />
      <section className="px-6 pb-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            {["dashboard", "services", "appointments", "messages", "blog", "portfolio", "users"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm uppercase tracking-[0.22em] transition-colors",
                  activeTab === tab ? "bg-white text-slate-900" : "glass-panel text-[var(--muted)]",
                )}
              >
                {tab}
              </button>
            ))}
            <button type="button" onClick={onLogout} className="ml-auto rounded-full border border-[var(--border)] px-5 py-2 text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
              Logout
            </button>
          </div>

          {activeTab === "dashboard" ? (
            <div className="grid gap-6 lg:grid-cols-4">
              {overview.map((item) => (
                <div key={item.label} className="glass-panel surface-outline rounded-[1.75rem] p-6">
                  <div className="text-sm uppercase tracking-[0.28em] text-[#73b1ff]">{item.label}</div>
                  <div className="mt-5 text-4xl font-semibold text-[var(--text)]">{item.value}</div>
                </div>
              ))}
              <div className="glass-panel surface-outline rounded-[1.75rem] p-6 lg:col-span-2">
                <div className="text-sm uppercase tracking-[0.28em] text-[#73b1ff]">Analytics snapshot</div>
                <div className="mt-6 space-y-4">
                  {[{ label: "Bookings", value: appointments.length }, { label: "Messages", value: messages.length }, { label: "Newsletter", value: newsletters.length }].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/6">
                        <div className="h-2 rounded-full bg-gradient-to-r from-[#4f9cff] to-[#8b5cf6]" style={{ width: `${Math.min(100, 20 + item.value * 14)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "services" ? (
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={handleServiceCreate} className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Create service</div>
                <div className="mt-6 space-y-4">
                  <input name="name" required placeholder="Service name" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <input name="category" placeholder="Category" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <input name="shortDescription" placeholder="Short description" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <textarea name="description" rows={4} placeholder="Full description" className="w-full rounded-[1.5rem] border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                </div>
                <div className="mt-6">
                  <MagneticAction buttonType="submit">Create Service</MagneticAction>
                </div>
              </form>
              <div className="space-y-4">
                {servicesState.map((service) => (
                  <div key={service.slug} className="glass-panel rounded-[1.5rem] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-lg text-[var(--text)]">{service.name}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">{service.shortDescription}</div>
                      </div>
                      <button type="button" onClick={() => void deleteService(service.slug)} className="text-sm text-[#73b1ff]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "appointments" ? (
            <div className="space-y-4">
              {appointments.length === 0 ? <div className="glass-panel rounded-[1.5rem] p-6 text-[var(--muted)]">No appointments yet.</div> : null}
              {appointments.map((appointment) => (
                <div key={appointment.id} className="glass-panel surface-outline rounded-[1.75rem] p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-lg text-[var(--text)]">{appointment.name}</div>
                      <div className="mt-2 text-sm text-[var(--muted)]">{appointment.service} | {appointment.preferredDate} at {appointment.preferredTime}</div>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => updateAppointmentStatus(appointment.id, "approved")} className="rounded-full border border-[#4f9cff]/40 px-4 py-2 text-sm text-[#73b1ff]">Approve</button>
                      <button type="button" onClick={() => updateAppointmentStatus(appointment.id, "rejected")} className="rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--muted)]">Reject</button>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-[var(--muted)]">Status: {appointment.status}</div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "messages" ? (
            <div className="space-y-4">
              {messages.length === 0 ? <div className="glass-panel rounded-[1.5rem] p-6 text-[var(--muted)]">No messages yet.</div> : null}
              {messages.map((message) => (
                <div key={message.id} className="glass-panel surface-outline rounded-[1.75rem] p-6">
                  <div className="text-lg text-[var(--text)]">{message.name}</div>
                  <div className="mt-2 text-sm text-[var(--muted)]">{message.email} {message.phone ? `| ${message.phone}` : ""}</div>
                  <p className="mt-4 text-[var(--muted)]">{message.message}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "blog" ? (
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={handleBlogCreate} className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Create blog post</div>
                <div className="mt-6 space-y-4">
                  <input name="title" required placeholder="Post title" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <input name="category" placeholder="Category" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <textarea name="excerpt" rows={4} placeholder="Excerpt" className="w-full rounded-[1.5rem] border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                </div>
                <div className="mt-6">
                  <MagneticAction buttonType="submit">Create Post</MagneticAction>
                </div>
              </form>
              <div className="space-y-4">
                {blogState.map((post) => (
                  <div key={post.slug} className="glass-panel rounded-[1.5rem] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-lg text-[var(--text)]">{post.title}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">{post.excerpt}</div>
                      </div>
                      <button type="button" onClick={() => void deleteBlogPost(post.slug)} className="text-sm text-[#73b1ff]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "portfolio" ? (
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={handlePortfolioCreate} className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Create portfolio project</div>
                <div className="mt-6 space-y-4">
                  <input name="name" required placeholder="Project name" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <input name="client" placeholder="Client" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <input name="category" placeholder="Category" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                  <textarea name="summary" rows={4} placeholder="Summary" className="w-full rounded-[1.5rem] border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
                </div>
                <div className="mt-6">
                  <MagneticAction buttonType="submit">Create Project</MagneticAction>
                </div>
              </form>
              <div className="space-y-4">
                {portfolioState.map((project) => (
                  <div key={project.slug} className="glass-panel rounded-[1.5rem] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-lg text-[var(--text)]">{project.name}</div>
                        <div className="mt-1 text-sm text-[var(--muted)]">{project.summary}</div>
                      </div>
                      <button type="button" onClick={() => void deletePortfolioProject(project.slug)} className="text-sm text-[#73b1ff]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "users" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Lead records</div>
                <div className="mt-6 space-y-4 text-[var(--muted)]">
                  {leads.length === 0 ? <div>No lead captures yet.</div> : leads.map((lead) => <div key={lead.id}>{lead.name} | {lead.email} | {lead.interest}</div>)}
                </div>
              </div>
              <div className="glass-panel surface-outline rounded-[2rem] p-8">
                <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Newsletter subscribers</div>
                <div className="mt-6 space-y-4 text-[var(--muted)]">
                  {newsletters.length === 0 ? <div>No subscribers yet.</div> : newsletters.map((item) => <div key={item.id}>{item.email}</div>)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Footer() {
  const [newsletterState, setNewsletterState] = useState<"idle" | "saved">("idle");

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: NewsletterRecord = { id: createId("news"), email: String(formData.get("email") || "") };
    submitWithFallback("digibro_newsletter", payload);
    setNewsletterState("saved");
    event.currentTarget.reset();
  };

  return (
    <footer className="border-t border-[var(--border)] px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">DIGIBRO</div>
          <div className="mt-3 text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Digital Growth Partner</div>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted)]">Award-level design, measurable growth systems, and backend-ready digital experiences for ambitious brands.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Navigate</div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[var(--muted)]">
              {navigation.map((item) => (
                <Link key={item.href} to={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link to="/admin/login">Admin</Link>
            </div>
          </div>
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Newsletter</div>
            <form onSubmit={handleNewsletter} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input name="email" type="email" required placeholder="Your email" className="flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 py-3 outline-none" />
              <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900">Join</button>
            </form>
            {newsletterState === "saved" ? <p className="mt-3 text-sm text-[#73b1ff]">Saved and ready for CRM sync.</p> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function LeadCapture({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: LeadRecord = {
      id: createId("lead"),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      interest: String(formData.get("interest") || "Proposal Deck"),
    };
    submitWithFallback("digibro_leads", payload);
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center">
      <div className="glass-panel-strong surface-outline w-full max-w-lg rounded-[2rem] p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-[#73b1ff]">Lead Capture</div>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--text)]">Get the DIGIBRO proposal deck.</h3>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--muted)]">Close</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input name="name" required placeholder="Name" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
          <input name="interest" defaultValue="Proposal Deck" placeholder="Interest" className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-4 outline-none" />
          <div className="flex items-center justify-between gap-4">
            <MagneticAction buttonType="submit">Send Me The Deck</MagneticAction>
            {saved ? <span className="text-sm text-[#73b1ff]">Lead captured.</span> : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi, I am DIGIBRO AI. Tell me if you need branding, a website, paid growth, or automation support." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", text: input };
    const botMessage = {
      role: "bot",
      text: input.toLowerCase().includes("price")
        ? "Projects typically start from $1,500 and scale based on scope. Book a strategy call for a precise recommendation."
        : "DIGIBRO can help with that. The best next step is a strategy call so we can match service, timeline, and goals.",
    };
    setMessages((current) => [...current, userMessage, botMessage]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open ? (
        <div className="glass-panel-strong surface-outline w-[20rem] rounded-[1.75rem] p-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">DIGIBRO AI</div>
              <div className="text-xs text-[var(--muted)]">Lead qualification assistant</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted)]">Close</button>
          </div>
          <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
            {messages.map((message) => (
              <div key={`${message.role}-${message.text}`} className={cn("rounded-2xl px-4 py-3 text-sm", message.role === "bot" ? "bg-white/6 text-[var(--muted)]" : "bg-[#4f9cff] text-white")}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about services" className="flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none" />
            <button type="button" onClick={sendMessage} className="rounded-full bg-white px-4 py-3 text-sm text-slate-900">Send</button>
          </div>
        </div>
      ) : null}
      <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-full bg-gradient-to-r from-[#4f9cff] to-[#8b5cf6] px-5 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white shadow-[0_20px_40px_rgba(79,156,255,0.35)]">
        AI Chat
      </button>
    </div>
  );
}

function LoadingScreen({ loading }: { loading: boolean }) {
  return (
    <AnimatePresence>
      {loading ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
        >
          <motion.div className="text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="gradient-text text-4xl font-semibold tracking-[-0.06em]">DIGIBRO</div>
            <motion.div className="mx-auto mt-5 h-1 w-44 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#4f9cff] to-[#8b5cf6]"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Header({ theme, onThemeToggle, onLeadOpen }: { theme: ThemeMode; onThemeToggle: () => void; onLeadOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4 md:px-8">
      <div className="mx-auto max-w-7xl rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl font-semibold tracking-[-0.04em] text-[var(--text)]">DIGIBRO</span>
            <span className="hidden text-xs uppercase tracking-[0.32em] text-[#73b1ff] sm:inline">Digital Growth Partner</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {navigation.map((item) => (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => cn("text-sm transition-colors", isActive ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]")}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <button type="button" onClick={onThemeToggle} className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button type="button" onClick={onLeadOpen} className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
              Proposal
            </button>
            <MagneticAction to="/book" className="px-5 py-2.5 text-xs">Book Call</MagneticAction>
          </div>
          <button type="button" onClick={() => setOpen((current) => !current)} className="lg:hidden rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
            Menu
          </button>
        </div>
        <AnimatePresence>
          {open ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden lg:hidden">
              <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                {navigation.map((item) => (
                  <NavLink key={item.href} to={item.href} className="block text-sm text-[var(--muted)]">
                    {item.label}
                  </NavLink>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onThemeToggle} className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
                    {theme === "dark" ? "Light" : "Dark"}
                  </button>
                  <button type="button" onClick={onLeadOpen} className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.26em] text-[var(--muted)]">
                    Proposal
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

function AppShell() {
  const location = useLocation();
  const [theme, setTheme] = useState<ThemeMode>(() => readStorage("digibro_theme", "dark"));
  const [loading, setLoading] = useState(true);
  const [leadOpen, setLeadOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => readStorage("digibro_admin_token", null));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeStorage("digibro_theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1500);
    const leadTimer = window.setTimeout(() => {
      const seen = window.sessionStorage.getItem("digibro_lead_seen");
      if (!seen) {
        setLeadOpen(true);
        window.sessionStorage.setItem("digibro_lead_seen", "true");
      }
    }, 4800);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(leadTimer);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <LoadingScreen loading={loading} />
      <ScrollToTop />
      <Header theme={theme} onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))} onLeadOpen={() => setLeadOpen(true)} />
      <main>
        <AnimatePresence mode="wait">
          <PageShell key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage onLeadOpen={() => setLeadOpen(true)} />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/portfolio/:slug" element={<PortfolioDetailPage />} />
              <Route path="/case-studies" element={<CaseStudiesPage />} />
              <Route path="/case-studies/:slug" element={<CaseStudyDetailPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/admin/login" element={<AdminLoginPage onLogin={(token) => { setAdminToken(token); writeStorage("digibro_admin_token", token); }} />} />
              <Route path="/admin" element={<ProtectedRoute token={adminToken}><AdminDashboardPage token={adminToken} onLogout={() => { setAdminToken(null); window.localStorage.removeItem("digibro_admin_token"); window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key: "digibro_admin_token" } })); }} /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageShell>
        </AnimatePresence>
      </main>
      <Footer />
      <LeadCapture open={leadOpen} onClose={() => setLeadOpen(false)} />
      <ChatbotWidget />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
