import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleDot,
  Clock3,
  Download,
  ExternalLink,
  FileSearch,
  FileText,
  FlaskConical,
  History,
  Layers3,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import {
  getGetResearchQueryKey,
  getHealthCheckQueryKey,
  useCreateResearch,
  useGetResearch,
  useHealthCheck,
  type ResearchResult,
  type ResearchStep,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const exampleQuestions = [
  'How is grid-scale battery storage changing the economics of renewable energy in 2025?',
  'What are the strongest evidence-backed interventions for reducing researcher burnout?',
];

const liveStages: ResearchStep[] = [
  { id: 'frame', label: 'Frame the question', detail: 'Clarifying scope, terms, and the evidence standard', status: 'active', durationMs: 0 },
  { id: 'search', label: 'Search the literature', detail: 'Running parallel searches across primary sources', status: 'pending', durationMs: 0 },
  { id: 'triage', label: 'Triage evidence', detail: 'Comparing relevance, recency, and source quality', status: 'pending', durationMs: 0 },
  { id: 'synthesis', label: 'Synthesize findings', detail: 'Finding agreement, tension, and meaningful gaps', status: 'pending', durationMs: 0 },
  { id: 'report', label: 'Write the report', detail: 'Assembling a cited answer with an audit trail', status: 'pending', durationMs: 0 },
];

const sampleReports: ResearchResult[] = [
  {
    id: 'sample-energy',
    question: 'How is grid-scale battery storage changing the economics of renewable energy in 2025?',
    createdAt: '2025-02-14T10:20:00Z',
    reportMarkdown: '',
    queries: [],
    sources: [],
    steps: [],
    confidence: 0.86,
    mode: 'Evidence brief',
  },
  {
    id: 'sample-burnout',
    question: 'What are the strongest evidence-backed interventions for reducing researcher burnout?',
    createdAt: '2025-02-11T15:05:00Z',
    reportMarkdown: '',
    queries: [],
    sources: [],
    steps: [],
    confidence: 0.79,
    mode: 'Evidence brief',
  },
];

function formatDuration(durationMs: number) {
  if (!durationMs) return '—';
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return 'Just now';
  }
}

function ReportMarkdown({ markdown }: { markdown: string }) {
  const blocks = markdown.trim() ? markdown.trim().split(/\n+/) : [
    'Your report will appear here once the research run is complete.',
  ];
  return (
    <div className="report-copy" data-testid="content-report-markdown">
      {blocks.map((line, index) => {
        if (line.startsWith('### ')) return <h3 key={`${line}-${index}`}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={`${line}-${index}`}>{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h2 key={`${line}-${index}`}>{line.slice(2)}</h2>;
        if (line.startsWith('- ')) return <ul key={`${line}-${index}`}><li>{line.slice(2)}</li></ul>;
        if (line.startsWith('> ')) return <p key={`${line}-${index}`} className="border-l-2 border-accent pl-4 italic">{line.slice(2)}</p>;
        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
        <Layers3 size={18} strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-sidebar" />
      </div>
      <div>
        <div className="font-serif text-[19px] leading-none tracking-[-.02em] text-sidebar-foreground">Lattice</div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">Research cockpit</div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden min-h-[100dvh] w-[248px] shrink-0 flex-col bg-sidebar px-5 py-6 text-sidebar-foreground md:flex" data-testid="sidebar-navigation">
      <Link href="/" className="block" data-testid="link-home">
        <BrandMark />
      </Link>
      <div className="mt-12">
        <div className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1">
          <Link href="/" className="flex items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-3 text-sm font-semibold text-sidebar-accent-foreground transition-transform hover:translate-x-0.5" data-testid="link-workspace">
            <FlaskConical size={17} />
            <span>New research</span>
            <ArrowUpRight size={14} className="ml-auto text-sidebar-primary" />
          </Link>
          <a href="#recent" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" data-testid="link-recent">
            <History size={17} />
            <span>Recent runs</span>
          </a>
        </nav>
      </div>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sidebar-primary">
          <ShieldCheck size={16} />
          <span className="font-mono text-[10px] uppercase tracking-[.13em]">Evidence first</span>
        </div>
        <p className="text-xs leading-5 text-sidebar-foreground/62">Every answer keeps its sources, search trail, and confidence in view.</p>
      </div>
    </aside>
  );
}

function HealthPill() {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const isHealthy = health.data?.status === 'ok' || health.data?.status === 'healthy';
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground" data-testid="status-system-health">
      <span className={`h-1.5 w-1.5 rounded-full ${health.isFetching ? 'animate-breathe bg-sidebar-primary' : isHealthy ? 'bg-[#6b9b78]' : 'bg-accent'}`} />
      {health.isFetching ? 'Checking systems' : isHealthy ? 'Systems ready' : 'Local workspace'}
    </div>
  );
}

function Topbar({ detail = false }: { detail?: boolean }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('lattice-theme') !== 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('lattice-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <header className="flex min-h-[72px] items-center justify-between border-b border-border/70 px-5 py-4 md:px-10" data-testid="header-topbar">
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/" className="block" data-testid="link-mobile-home"><BrandMark /></Link>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        {detail ? <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid="link-back-workspace"><ArrowLeft size={16} /> Workspace</Link> : <span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Research workspace / 01</span>}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDarkMode((current) => !current)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          data-testid="button-toggle-theme"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <HealthPill />
      </div>
    </header>
  );
}

function StageTimeline({ steps, pending }: { steps: ResearchStep[]; pending?: boolean }) {
  return (
    <div className="space-y-0" data-testid="list-research-stages">
      {steps.map((step, index) => {
        const complete = step.status === 'complete';
        const active = step.status === 'active';
        return (
          <div className="group flex gap-3" key={step.id} data-testid={`stage-${step.id}`}>
            <div className="flex w-5 flex-col items-center">
              <div className={`relative z-10 grid h-5 w-5 place-items-center rounded-full border ${complete ? 'border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground' : active ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-background text-muted-foreground/50'}`}>
                {complete ? <Check size={12} strokeWidth={3} /> : active ? <CircleDot size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              {index < steps.length - 1 && <div className={`w-px grow ${complete ? 'bg-sidebar-primary/50' : 'bg-border'}`} />}
            </div>
            <div className="min-w-0 flex-1 pb-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm font-semibold ${active ? 'text-accent' : complete ? 'text-foreground' : 'text-muted-foreground/65'}`}>{step.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">{pending && active ? 'working' : formatDuration(step.durationMs)}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
              {active && pending && <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="scan-line absolute inset-y-0 left-0 w-1/2 bg-accent/70" /></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SourceCoverage({ result }: { result: ResearchResult }) {
  const sources = result.sources ?? [];
  const domains = Array.from(new Set(sources.map((source) => source.domain)));
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-testid="card-source-coverage">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.1em] text-muted-foreground"><Search size={14} className="text-accent" /> Source coverage</div>
          <p className="mt-2 font-serif text-3xl text-foreground">{sources.length || '—'} <span className="font-sans text-sm text-muted-foreground">sources</span></p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><FileSearch size={18} /></div>
      </div>
      <div className="mt-5 flex h-2 gap-1 overflow-hidden rounded-full bg-muted">
        {Array.from({ length: Math.max(5, Math.min(10, sources.length || 5)) }).map((_, index) => <span key={index} className={`flex-1 rounded-full ${index < Math.max(2, Math.ceil((result.confidence || .5) * 8)) ? 'bg-sidebar-primary' : 'bg-border'}`} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(domains.length ? domains : ['No sources yet']).slice(0, 5).map((domain) => <span key={domain} className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">{domain}</span>)}
      </div>
    </section>
  );
}

function ConfidenceCard({ confidence }: { confidence: number }) {
  const percent = Math.round((confidence || 0) * 100);
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" data-testid="card-confidence">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.1em] text-muted-foreground"><ShieldCheck size={14} className="text-accent" /> Confidence</div>
        <span className="font-mono text-xs text-accent">{percent}%</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-accent transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">A weighted read of source quality, agreement, and coverage. Not a substitute for judgment.</p>
    </section>
  );
}

function RecentRuns({ onUseQuestion }: { onUseQuestion: (question: string) => void }) {
  return (
    <section id="recent" className="mt-16 border-t border-border pt-8" data-testid="section-recent-runs">
      <div className="mb-5 flex items-end justify-between">
        <div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">The trail so far</div><h2 className="mt-1 font-serif text-3xl text-foreground">Recent briefs</h2></div>
        <span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Local history</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sampleReports.map((item, index) => (
          <button type="button" key={item.id} onClick={() => onUseQuestion(item.question)} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-transform hover:-translate-y-0.5 hover:shadow-md" data-testid={`button-recent-${item.id}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary font-mono text-xs text-primary">0{index + 1}</span>
            <span className="min-w-0"><span className="block text-sm font-semibold leading-5 text-foreground">{item.question}</span><span className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.08em] text-muted-foreground"><Clock3 size={12} /> {formatDate(item.createdAt)} <ArrowUpRight size={12} className="ml-auto text-accent transition-transform group-hover:translate-x-0.5" /></span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Workspace() {
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [liveIndex, setLiveIndex] = useState(0);
  const [completedResult, setCompletedResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState('');
  const createResearch = useCreateResearch();

  useEffect(() => {
    if (!createResearch.isPending) return;
    const interval = window.setInterval(() => setLiveIndex((current) => Math.min(liveStages.length - 1, current + 1)), 1150);
    return () => window.clearInterval(interval);
  }, [createResearch.isPending]);

  const displaySteps = useMemo(() => {
    if (completedResult?.steps?.length) return completedResult.steps;
    return liveStages.map((step, index) => ({ ...step, status: index < liveIndex ? 'complete' : index === liveIndex ? 'active' : 'pending' as ResearchStep['status'] }));
  }, [completedResult, liveIndex]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (question.trim().length < 8 || createResearch.isPending) return;
    setError('');
    setSubmittedQuestion(question.trim());
    setCompletedResult(null);
    setLiveIndex(0);
    createResearch.mutate({ data: { question: question.trim() } }, {
      onSuccess: (result) => {
        setCompletedResult(result);
        setLocation(`/research/${result.id}`);
      },
      onError: () => setError('The research run could not be started. Check the question and try again.'),
    });
  };

  return (
    <AppShell>
      <Topbar />
      <main className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10">
        <section className="relative overflow-hidden pb-14 pt-12 md:pt-16">
          <div className="research-grid pointer-events-none absolute -right-20 -top-14 h-[410px] w-[58%] opacity-70" />
          <div className="relative max-w-4xl animate-rise-in">
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent"><Sparkles size={14} /> Multi-agent research, with the trail intact</div>
            <h1 className="max-w-4xl font-serif text-[clamp(3.2rem,7vw,6.6rem)] leading-[.89] tracking-[-.055em] text-primary">Turn a difficult question into an answer you can stand behind.</h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">Lattice coordinates search, source triage, and synthesis in one quiet workspace. You get the report — and the reasoning that made it trustworthy.</p>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className="rounded-[24px] border border-border bg-card p-5 shadow-md md:p-7" data-testid="card-research-input">
            <div className="flex items-center justify-between gap-3">
              <div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">01 / Define the brief</div><h2 className="mt-2 font-serif text-3xl text-foreground">What do you need to know?</h2></div>
              <div className="hidden h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground md:grid"><ArrowUpRight size={18} /></div>
            </div>
            <form className="mt-7" onSubmit={submit} data-testid="form-research">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question worth investigating…" rows={5} className="w-full resize-none rounded-2xl border border-input bg-background px-5 py-4 text-lg leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent focus:ring-4 focus:ring-accent/10 md:text-xl" data-testid="input-research-question" />
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${question.trim().length >= 8 ? 'bg-sidebar-primary' : 'bg-border'}`} /> Minimum 8 characters <span className="font-mono text-[10px] text-muted-foreground/65">{question.length}/2000</span></div>
                <button type="submit" disabled={question.trim().length < 8 || createResearch.isPending} className="group inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-start-research">
                  {createResearch.isPending ? <><span className="h-2 w-2 animate-breathe rounded-full bg-sidebar-primary" /> Agents are working</> : <>Start research <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>}
                </button>
              </div>
              {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive" data-testid="status-research-error"><span>{error}</span><button type="button" onClick={() => setError('')} className="font-semibold underline" data-testid="button-dismiss-error">Dismiss</button></div>}
            </form>
            <div className="mt-7 border-t border-border pt-5">
              <div className="mb-3 text-[11px] font-semibold text-muted-foreground">Try a considered starting point</div>
              <div className="flex flex-wrap gap-2">{exampleQuestions.map((example) => <button type="button" key={example} onClick={() => setQuestion(example)} className="rounded-lg border border-border px-3 py-2 text-left text-xs leading-4 text-muted-foreground transition-colors hover:border-accent/50 hover:bg-accent/5 hover:text-foreground" data-testid={`button-example-${example.slice(0, 12).replace(/\s/g, '-')}`}>{example}</button>)}</div>
            </div>
          </section>

          <aside className="rounded-[24px] border border-border bg-primary p-5 text-primary-foreground shadow-md md:p-6" data-testid="card-execution-stages">
            <div className="mb-7 flex items-start justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-primary">02 / Execution</div><h2 className="mt-2 font-serif text-2xl">The research trail</h2></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/10"><CircleDot size={17} className={createResearch.isPending ? 'animate-breathe text-sidebar-primary' : 'text-primary-foreground/50'} /></div></div>
            {createResearch.isPending && <p className="mb-5 text-xs leading-5 text-primary-foreground/60" data-testid="status-research-pending">Agents are moving through the brief. This view will hand off to the returned evidence trail when complete.</p>}
            {!createResearch.isPending && submittedQuestion && !completedResult && <p className="mb-5 text-xs leading-5 text-primary-foreground/60">Preparing a trace for “{submittedQuestion}”.</p>}
            <StageTimeline steps={displaySteps} pending={createResearch.isPending} />
            {!createResearch.isPending && !submittedQuestion && <p className="mt-1 border-t border-primary-foreground/10 pt-4 text-xs leading-5 text-primary-foreground/55">Start a brief to watch each agent hand off its work.</p>}
          </aside>
        </div>

        {completedResult && (
          <section className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px] animate-rise-in" data-testid="section-completed-report">
            <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">03 / Report</div><h2 className="mt-2 max-w-3xl font-serif text-3xl leading-tight text-foreground">{completedResult.question}</h2></div><Link href={`/research/${completedResult.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent" data-testid="link-open-report">Open full report <ArrowUpRight size={14} /></Link></div>
              <ReportMarkdown markdown={completedResult.reportMarkdown} />
            </div>
            <div className="space-y-5"><ConfidenceCard confidence={completedResult.confidence} /><SourceCoverage result={completedResult} /></div>
          </section>
        )}

        <RecentRuns onUseQuestion={setQuestion} />
      </main>
    </AppShell>
  );
}

function ReportSkeleton() {
  return <div className="space-y-5 animate-pulse" data-testid="loading-report"><div className="h-4 w-32 rounded bg-muted" /><div className="h-12 w-4/5 rounded bg-muted" /><div className="h-4 w-full rounded bg-muted" /><div className="h-4 w-11/12 rounded bg-muted" /><div className="h-4 w-3/4 rounded bg-muted" /><div className="mt-8 h-32 w-full rounded-2xl bg-muted" /></div>;
}

function DetailPage() {
  const params = useParams<{ researchId: string }>();
  const researchId = params.researchId ?? '';
  const research = useGetResearch(researchId, { query: { enabled: !!researchId, queryKey: getGetResearchQueryKey(researchId) } });
  const result = research.data;

  return (
    <AppShell>
      <Topbar detail />
      <main className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10">
        {research.isLoading && <div className="mx-auto max-w-5xl py-16"><ReportSkeleton /></div>}
        {research.isError && <div className="mx-auto max-w-lg py-24 text-center" data-testid="status-report-error"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent"><RefreshCw size={22} /></div><h1 className="mt-5 font-serif text-3xl">This trail is out of reach</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">The report could not be loaded right now. The source trail may still be processing.</p><button type="button" onClick={() => research.refetch()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" data-testid="button-retry-report">Try again <RefreshCw size={15} /></button></div>}
        {!research.isLoading && !research.isError && result && <ReportDetail result={result} />}
        {!research.isLoading && !research.isError && !result && <div className="py-20 text-center text-muted-foreground" data-testid="status-report-empty">No report was found for this research run.</div>}
      </main>
    </AppShell>
  );
}

function ReportDetail({ result }: { result: ResearchResult }) {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const downloadMarkdown = () => {
    const blob = new Blob([result.reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lattice-research-${result.id.slice(0, 8)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const response = await fetch(`/research-api/api/research/${result.id}/pdf`);
      if (!response.ok) throw new Error('PDF export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lattice-research-${result.id.slice(0, 8)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="grid gap-7 py-10 xl:grid-cols-[minmax(0,1fr)_360px]">
      <article className="min-w-0">
        <div className="mb-10 animate-rise-in">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-accent"><BookOpen size={14} /> {result.mode || 'Evidence brief'} <span className="text-border">/</span> {formatDate(result.createdAt)}</div>
          <h1 className="mt-5 max-w-5xl font-serif text-[clamp(2.8rem,6vw,5.6rem)] leading-[.94] tracking-[-.05em] text-primary" data-testid="text-report-question">{result.question}</h1>
          <div className="mt-6 editorial-rule max-w-2xl" />
          <div className="mt-6 flex flex-wrap gap-2" data-testid="report-export-actions">
            <button type="button" onClick={downloadMarkdown} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent" data-testid="button-export-markdown">
              <FileText size={14} /> Export Markdown
            </button>
            <button type="button" onClick={() => void downloadPdf()} disabled={pdfBusy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60" data-testid="button-export-pdf">
              <Download size={14} /> {pdfBusy ? 'Preparing PDF…' : 'Export PDF'}
            </button>
          </div>
        </div>
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm md:p-10" data-testid="content-full-report">
          <ReportMarkdown markdown={result.reportMarkdown} />
        </div>
      </article>
      <aside className="space-y-5">
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm md:sticky md:top-6">
          <div className="mb-6 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">Evidence trail</div><h2 className="mt-2 font-serif text-2xl">How we got here</h2></div><ShieldCheck size={19} className="text-accent" /></div>
          <div className="mb-7 grid grid-cols-2 gap-2"><div className="rounded-xl bg-secondary p-3"><div className="font-mono text-xl text-primary">{Math.round((result.confidence || 0) * 100)}%</div><div className="mt-1 text-[10px] uppercase tracking-[.08em] text-muted-foreground">Confidence</div></div><div className="rounded-xl bg-secondary p-3"><div className="font-mono text-xl text-primary">{result.sources?.length || 0}</div><div className="mt-1 text-[10px] uppercase tracking-[.08em] text-muted-foreground">Sources</div></div></div>
          <StageTimeline steps={result.steps || []} />
          {!!result.queries?.length && <div className="mt-2 border-t border-border pt-5"><div className="mb-3 text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Search queries</div><div className="space-y-2">{result.queries.map((query, index) => <div className="rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground" key={`${query}-${index}`} data-testid={`query-${index}`}>{query}</div>)}</div></div>}
        </div>
      </aside>
      <section className="xl:col-span-2">
        <div className="mb-5 flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">Source index</div><h2 className="mt-2 font-serif text-3xl">Read the evidence</h2></div><span className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{result.sources?.length || 0} linked sources</span></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {(result.sources || []).map((source, index) => {
            const expanded = activeSource === source.url;
            return <article key={`${source.url}-${index}`} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm" data-testid={`card-source-${index}`}>
              <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-[10px] text-primary">{String(index + 1).padStart(2, '0')}</span><span className="truncate font-mono text-[10px] uppercase tracking-[.08em] text-muted-foreground">{source.domain}</span></div><a href={source.url} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-accent" data-testid={`link-source-${index}`} aria-label={`Open ${source.title}`}><ExternalLink size={15} /></a></div>
              <h3 className="mt-4 text-sm font-semibold leading-5 text-foreground">{source.title}</h3>
              <p className={`mt-2 text-xs leading-5 text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>{source.snippet}</p>
              <button type="button" onClick={() => setActiveSource(expanded ? null : source.url)} className="mt-3 text-[11px] font-semibold text-accent" data-testid={`button-toggle-source-${index}`}>{expanded ? 'Show less' : 'Read excerpt'}</button>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100dvh] bg-background"><Sidebar /><div className="min-w-0 flex-1">{children}</div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Workspace} /><Route path="/research/:researchId" component={DetailPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;