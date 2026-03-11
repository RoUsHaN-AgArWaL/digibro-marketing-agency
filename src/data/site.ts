export type ServiceEntry = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  process: string[];
  packages: { name: string; price: string; features: string[] }[];
  results: string[];
};

export type PortfolioEntry = {
  slug: string;
  name: string;
  category: string;
  client: string;
  summary: string;
  image: string;
  metrics: string[];
  testimonial: string;
};

export type BlogEntry = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  content: string[];
};

export type CaseStudyEntry = {
  slug: string;
  title: string;
  industry: string;
  challenge: string;
  solution: string;
  outcome: string[];
};

export const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Book", href: "/book" },
  { label: "Careers", href: "/careers" },
];

export const stats = [
  { value: 180, suffix: "+", label: "campaign launches delivered" },
  { value: 27, suffix: "x", label: "average ROAS across paid media" },
  { value: 94, suffix: "%", label: "client retention over 24 months" },
  { value: 12, suffix: "d", label: "to launch for high-speed sprints" },
];

export const serviceCatalog: ServiceEntry[] = [
  {
    slug: "website-development",
    name: "Website Development",
    category: "Web",
    shortDescription: "High-converting marketing websites, portals, and custom experiences.",
    description:
      "DIGIBRO builds premium websites with conversion architecture, CMS flexibility, advanced animation, and clean performance-focused code.",
    process: ["Discovery sprint", "Wireframe and UX blueprint", "Visual system design", "Development and QA", "Launch and CRO tracking"],
    packages: [
      { name: "Launch", price: "$2,500", features: ["5-page site", "Mobile optimization", "Basic CMS", "Lead capture forms"] },
      { name: "Growth", price: "$6,500", features: ["10+ pages", "Animation system", "SEO setup", "CRM integrations"] },
      { name: "Flagship", price: "$12,000", features: ["Custom app logic", "3D scenes", "Analytics dashboard", "A/B testing setup"] },
    ],
    results: ["Faster load times", "Stronger conversion flow", "Scalable component system"],
  },
  {
    slug: "ui-ux-design",
    name: "UI/UX Design",
    category: "Design",
    shortDescription: "Premium interfaces mapped to real funnel behavior and user psychology.",
    description:
      "From rapid wireframes to polished product systems, we craft digital journeys that feel expensive, intuitive, and measurable.",
    process: ["User research", "Conversion mapping", "Low-fi wireframes", "High-fi prototyping", "Usability validation"],
    packages: [
      { name: "Starter", price: "$1,800", features: ["Single flow audit", "10 UI screens", "Prototype", "Design notes"] },
      { name: "Scale", price: "$4,400", features: ["Multi-page UX", "Design system", "Responsive states", "Motion guidelines"] },
      { name: "Product", price: "$8,500", features: ["Complex journeys", "Interactive prototype", "Research synthesis", "Handoff library"] },
    ],
    results: ["Lower bounce rates", "Clearer journeys", "Improved engagement"],
  },
  {
    slug: "branding",
    name: "Branding",
    category: "Brand",
    shortDescription: "Identity systems that feel modern, memorable, and category-defining.",
    description:
      "We build position-first brands with naming support, verbal direction, visual language, and deployment templates for digital growth.",
    process: ["Brand workshop", "Positioning narrative", "Identity concepts", "System refinement", "Launch assets"],
    packages: [
      { name: "Core", price: "$2,200", features: ["Logo suite", "Color and type", "Social kit", "Mini guidelines"] },
      { name: "Authority", price: "$5,200", features: ["Messaging system", "Brand visuals", "Campaign templates", "Brand playbook"] },
      { name: "Signature", price: "$9,800", features: ["Naming support", "3D visuals", "Launch deck", "Brand governance"] },
    ],
    results: ["Sharper positioning", "Higher recall", "Consistent execution"],
  },
  {
    slug: "seo",
    name: "SEO",
    category: "Growth",
    shortDescription: "Technical, content, and authority SEO designed for durable growth.",
    description:
      "Our SEO framework combines site health, search intent mapping, on-page systems, content velocity, and reporting that leadership can trust.",
    process: ["SEO audit", "Keyword clusters", "Technical fixes", "Content plan", "Reporting and iteration"],
    packages: [
      { name: "Boost", price: "$1,200/mo", features: ["Site audit", "On-page optimization", "Monthly report", "4 target pages"] },
      { name: "Momentum", price: "$2,400/mo", features: ["Content strategy", "Technical SEO", "Backlink guidance", "Dashboard access"] },
      { name: "Dominance", price: "$4,800/mo", features: ["Full content engine", "CRO alignment", "Topic authority plan", "Executive reporting"] },
    ],
    results: ["Compounding organic traffic", "Better rankings", "Qualified inbound leads"],
  },
  {
    slug: "google-ads",
    name: "Google Ads",
    category: "Paid Media",
    shortDescription: "Full-funnel paid search and performance campaigns with precise attribution.",
    description:
      "DIGIBRO plans, launches, and scales Google Ads accounts with landing page alignment, audience intent strategy, and profitable optimization loops.",
    process: ["Account audit", "Offer and funnel strategy", "Creative and landing pages", "Campaign launch", "Optimization cadence"],
    packages: [
      { name: "Pilot", price: "$950/mo", features: ["Single campaign", "Conversion tracking", "Ad copy tests", "Weekly tune-ups"] },
      { name: "Scale", price: "$2,100/mo", features: ["Multi-campaign setup", "Landing page recommendations", "Audience segmentation", "Monthly strategy call"] },
      { name: "Performance Lab", price: "$4,500/mo", features: ["Creative testing", "Funnel analytics", "Cross-channel attribution", "CRO support"] },
    ],
    results: ["Lower CPL", "Higher ROAS", "Clear spend accountability"],
  },
  {
    slug: "ai-chatbot-integration",
    name: "AI Chatbot Integration",
    category: "Automation",
    shortDescription: "Lead qualification and customer support automation powered by AI.",
    description:
      "We deploy branded AI assistants for websites and funnels that capture intent, answer FAQs, and push warm leads into your CRM.",
    process: ["Conversation design", "Knowledge base setup", "Interface branding", "CRM hooks", "Optimization and testing"],
    packages: [
      { name: "Assist", price: "$1,400", features: ["Website widget", "FAQ flows", "Lead capture", "Brand styling"] },
      { name: "Automate", price: "$3,600", features: ["CRM sync", "Qualification rules", "Analytics", "Escalation handoff"] },
      { name: "Concierge", price: "$7,400", features: ["Multi-channel flows", "Custom prompts", "Internal dashboard", "Advanced analytics"] },
    ],
    results: ["24/7 lead capture", "Faster response times", "Lower support load"],
  },
];

export const portfolioProjects: PortfolioEntry[] = [
  {
    slug: "nova-fintech-rebrand",
    name: "Nova Fintech Rebrand",
    category: "Branding",
    client: "Nova Capital",
    summary: "A luxury fintech repositioning with a conversion-led website and launch system.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    metrics: ["+210% qualified leads", "42% lower acquisition cost", "3.8x increase in demo bookings"],
    testimonial: "DIGIBRO turned our growth story into a premium digital experience that sells before our sales team ever speaks.",
  },
  {
    slug: "elevate-commerce-growth",
    name: "Elevate Commerce Growth",
    category: "Web Design",
    client: "Elevate Supply",
    summary: "Conversion redesign and paid media system for a fast-growing e-commerce brand.",
    image: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80",
    metrics: ["6.1x blended ROAS", "+88% AOV uplift", "31% faster page speed"],
    testimonial: "Every screen felt intentional. The performance gains paid for the entire engagement in weeks.",
  },
  {
    slug: "pulse-social-engine",
    name: "Pulse Social Engine",
    category: "Social Media",
    client: "Pulse Studio",
    summary: "A content and ad creative system built for high-frequency brand storytelling.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    metrics: ["+400% reach growth", "+63% lead quality", "18-day campaign rollout"],
    testimonial: "DIGIBRO gave us a social engine, not just pretty content. Our pipeline changed completely.",
  },
  {
    slug: "vector-motion-campaign",
    name: "Vector Motion Campaign",
    category: "Video",
    client: "Vector AI",
    summary: "Launch visuals, product teaser videos, and demand generation assets for an AI startup.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    metrics: ["1.9M launch impressions", "52% video completion", "2.4x demo requests"],
    testimonial: "The launch looked like a global brand campaign. Investors and customers noticed immediately.",
  },
];

export const caseStudies: CaseStudyEntry[] = [
  {
    slug: "saas-demand-acceleration",
    title: "SaaS Demand Acceleration",
    industry: "B2B SaaS",
    challenge: "A crowded category, underperforming site, and low-quality paid traffic were slowing pipeline growth.",
    solution: "DIGIBRO rebuilt the positioning, launched a modular website, and aligned paid search, SEO, and conversion UX around bottom-funnel intent.",
    outcome: ["3.2x SQL growth in 90 days", "42% lift in sales accepted leads", "Landing pages built 60% faster"],
  },
  {
    slug: "luxury-clinic-launch",
    title: "Luxury Clinic Launch",
    industry: "Healthcare",
    challenge: "A new clinic needed immediate authority, local visibility, and a premium digital presence.",
    solution: "We paired a cinematic brand identity with geo-targeted ads, SEO landing pages, and automated appointment booking.",
    outcome: ["1,200 bookings in first quarter", "68% organic traffic growth", "4.6x return on ad spend"],
  },
  {
    slug: "creator-commerce-scale",
    title: "Creator Commerce Scale",
    industry: "Consumer Brand",
    challenge: "Rapid audience growth was not converting into reliable e-commerce revenue.",
    solution: "DIGIBRO created a campaign calendar, video asset system, conversion pages, and email capture funnel.",
    outcome: ["$320k in attributed launch sales", "+54% returning customer rate", "Lead list tripled in eight weeks"],
  },
];

export const blogPosts: BlogEntry[] = [
  {
    slug: "future-of-agency-websites",
    title: "The Future of Agency Websites Is Performance Theater",
    category: "Web Strategy",
    excerpt: "How modern agency sites balance brand drama, speed, and conversion without collapsing into clutter.",
    readTime: "6 min read",
    content: [
      "Great agency websites do not just explain capability. They perform it through pacing, clarity, motion, and confidence.",
      "DIGIBRO's approach centers on one visual idea per section, meaningful movement, and a clean conversion path that never feels salesy.",
      "When motion reinforces hierarchy and trust, the site feels expensive without sacrificing speed or usability.",
    ],
  },
  {
    slug: "high-roas-landing-pages",
    title: "What High-ROAS Landing Pages Actually Have in Common",
    category: "Growth",
    excerpt: "The frameworks we use to turn paid traffic into conversion-ready demand.",
    readTime: "5 min read",
    content: [
      "Top landing pages clarify promise fast, prove credibility early, and remove friction relentlessly.",
      "The best pages make the next step feel obvious by combining visual control with a single conversion objective.",
      "That is why DIGIBRO pairs design systems with offer architecture, analytics, and rapid testing loops.",
    ],
  },
  {
    slug: "brand-systems-for-scale",
    title: "Brand Systems Built for Scale, Not Just Launch Day",
    category: "Branding",
    excerpt: "Why fast-growing companies need modular brand systems instead of one-time visual makeovers.",
    readTime: "4 min read",
    content: [
      "A scalable brand system reduces creative inconsistency and lets growth teams move faster without brand drift.",
      "The strongest systems include messaging logic, motion behavior, templates, and clear usage rules.",
      "DIGIBRO treats branding as an operating system for revenue, not a decorative layer.",
    ],
  },
];

export const testimonials = [
  {
    name: "Nadia Brooks",
    role: "Founder, Nova Capital",
    quote: "DIGIBRO combines CMO-level strategy, award-level design, and execution speed we had never experienced before.",
  },
  {
    name: "Ethan Rivera",
    role: "CEO, Elevate Supply",
    quote: "The site, the ads, the automation, the analytics. Everything finally worked like one growth machine.",
  },
  {
    name: "Maya Chen",
    role: "Marketing Lead, Vector AI",
    quote: "We looked twice our size overnight. Investors, users, and partners all felt the shift instantly.",
  },
];

export const pricingPreview = [
  {
    title: "Starter Sprint",
    price: "$1,500",
    description: "For teams validating a product, offer, or market angle.",
    features: ["Strategy workshop", "Single landing page", "Conversion copy", "Analytics setup"],
  },
  {
    title: "Growth Engine",
    price: "$4,500",
    description: "For businesses ready to compound acquisition and brand authority.",
    features: ["Campaign website", "Paid media setup", "SEO foundation", "Monthly reporting"],
  },
  {
    title: "Market Leader",
    price: "$9,500",
    description: "For ambitious brands building a full-stack digital growth platform.",
    features: ["Brand system", "Website platform", "Automation stack", "Creative production"],
  },
];

export const processSteps = [
  { index: "01", title: "Position", copy: "Clarify the category story, offer strength, and funnel architecture before anything ships." },
  { index: "02", title: "Design", copy: "Craft a premium visual system and motion language that signal authority instantly." },
  { index: "03", title: "Build", copy: "Develop high-performance experiences with scalable components and measurable UX." },
  { index: "04", title: "Scale", copy: "Launch analytics, paid media, automation, and iteration loops that compound growth." },
];

export const clientLogos = ["Nova", "Pulse", "Elevate", "Vector", "Orbit", "Aster", "Helio", "Axis", "Cloudnine", "Summit"];

export const careers = [
  { title: "Senior Brand Designer", type: "Remote", location: "Global", summary: "Lead identity systems and campaign visuals for premium digital clients." },
  { title: "Full-Stack Growth Developer", type: "Hybrid", location: "Dubai", summary: "Build fast marketing platforms, dashboards, and automation workflows." },
  { title: "Performance Marketing Strategist", type: "Remote", location: "EMEA", summary: "Scale paid media systems with creative testing and analytics rigor." },
];

export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Behance", href: "https://behance.net" },
  { label: "Dribbble", href: "https://dribbble.com" },
];