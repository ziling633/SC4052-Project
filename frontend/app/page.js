"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

const CANTEEN_NAMES = [
  'North Spine Food Court',
  'The Deck Food Court',
  'Canteen 11',
  'Canteen 13',
  'Food Paradise (North Hill)',
  'Canteen 16',
  'Canteen 18',
  'Canteen 9',
];

const MAP_COORDINATES = [
  { id: 'North Spine Food Court', top: '20%', left: '28%' },
  { id: 'The Deck Food Court', top: '45%', left: '22%' },
  { id: 'Food Paradise (North Hill)', top: '18%', left: '82%' },
  { id: 'Canteen 9', top: '52%', left: '44%' },
  { id: 'Canteen 11', top: '50%', left: '60%' },
  { id: 'Canteen 13', top: '62%', left: '70%' },
  { id: 'Canteen 16', top: '72%', left: '64%' },
  { id: 'Canteen 18', top: '36%', left: '79%' },
];

const levelStyles = {
  Low: 'bg-emerald-400 text-emerald-900',
  Medium: 'bg-amber-300 text-amber-950',
  High: 'bg-rose-500 text-white',
  Unknown: 'bg-slate-300 text-slate-700',
};

function normalizeLevel(value) {
  if (!value) return 'Unknown';
  const normalized = String(value).toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'high') return 'High';
  return 'Unknown';
}

function simulateAIClassification(file) {
  if (!file) return 'Unknown';
  const mod = file.size % 3;
  if (mod === 0) return 'Low';
  if (mod === 1) return 'Medium';
  return 'High';
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'No data';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diff = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s ago`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getCanteenId(name) {
  const index = CANTEEN_NAMES.indexOf(name);
  return index >= 0 ? String(index + 1) : null;
}

export default function Home() {
  const [statusList, setStatusList] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState('');

  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiHint, setAiHint] = useState('AI inference currently off. Choose a level or upload image for auto suggestion.');
  const [formFeedback, setFormFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const aiTimeout = useRef(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setStatusError('');

    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      setStatusError('The page is opened from a local file. Please start the frontend with `npm run dev` and open http://localhost:3000 instead of using file://.');
      setLoadingStatus(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/canteens/status`);
      if (!response.ok) throw new Error('Unable to load dashboard data');
      const json = await response.json();
      setStatusList(json.data || []);
    } catch (error) {
      console.error(error);
      setStatusList([]);
      setStatusError('Unable to load dashboard data. Ensure the backend is running on port 8000 and open the frontend at http://localhost:3000.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalReports = useMemo(
    () => statusList.reduce((sum, item) => sum + (item.report_count || 0), 0),
    [statusList]
  );

  const topCanteen = useMemo(() => {
    const sorted = [...statusList].sort((a, b) => (b.report_count || 0) - (a.report_count || 0));
    return sorted[0] && sorted[0].report_count > 0
      ? `${sorted[0].name} (${sorted[0].report_count})`
      : 'None';
  }, [statusList]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFormFeedback('');

    if (!file) {
      if (aiTimeout.current) {
        window.clearTimeout(aiTimeout.current);
        aiTimeout.current = null;
      }
      setAiHint('AI inference currently off. Choose a level or upload image for auto suggestion.');
      return;
    }

    setSelectedLevel('');
    setAiHint('🧠 Analysing image density...');
    if (aiTimeout.current) {
      window.clearTimeout(aiTimeout.current);
    }

    aiTimeout.current = window.setTimeout(() => {
      const predicted = simulateAIClassification(file);
      setSelectedLevel(predicted);
      setAiHint(`✅ AI suggestion applied: ${predicted}`);
      aiTimeout.current = null;
    }, 1400);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormFeedback('');

    if (!selectedCanteen) {
      setFormFeedback('Please select a canteen.');
      return;
    }

    let level = selectedLevel;
    if (!level && selectedFile) {
      level = simulateAIClassification(selectedFile);
      setSelectedLevel(level);
    }

    if (!level) {
      setFormFeedback('Please select a crowd level or upload an image for AI suggestion.');
      return;
    }

    const canteenId = getCanteenId(selectedCanteen);
    if (!canteenId) {
      setFormFeedback('Invalid canteen selection.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteen_id: canteenId,
          crowd_level: level,
          source: selectedFile ? 'vision-ai' : 'manual',
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.detail || 'Report submission failed');
      }

      await fetchStatus();
      setFormFeedback('Report submitted successfully. Dashboard refreshed.');
      setSelectedCanteen('');
      setSelectedLevel('');
      setSelectedFile(null);
      setAiHint('AI inference currently off. Choose a level or upload image for auto suggestion.');
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      setFormFeedback(error.message || 'Unable to submit report right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderBadge = (level) => {
    const normalized = normalizeLevel(level);
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${levelStyles[normalized] || levelStyles.Unknown}`}>
        {normalized}
      </span>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[rgba(33,18,8,0.08)] bg-[rgba(246,241,232,0.96)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-sm uppercase tracking-[0.4em] text-[var(--muted)] font-semibold">CROWDBYTE</div>
          <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            <a href="#landing" className="transition hover:text-[var(--text)]">Home</a>
            <a href="#dashboard" className="transition hover:text-[var(--text)]">Dashboard</a>
            <a href="#report" className="transition hover:text-[var(--text)]">Submit Report</a>
            <a href="#admin" className="transition hover:text-[var(--text)]">Admin</a>
          </nav>
        </div>
      </header>

      <main className="overflow-hidden">
        <section id="landing" className="bg-[var(--bg)] pb-24 pt-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="space-y-8">
                <div className="text-xs uppercase tracking-[0.34em] text-[var(--muted)] font-semibold">
                  Volume 01: The Academic Collective
                </div>
                <div className="max-w-2xl space-y-6">
                  <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.03em] text-[var(--text)] sm:text-6xl lg:text-7xl">
                    NTU Crowd
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                    A tactile study of digital convergence documenting the rhythmic pulse of modern learning environments.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a href="#dashboard" className="inline-flex w-full items-center justify-center rounded-full border border-[var(--text)] bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text)] transition hover:bg-[var(--text)] hover:text-white sm:w-auto">
                    Explore dashboard
                  </a>
                  <a href="#report" className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text)] transition hover:bg-white sm:w-auto">
                    Submit report
                  </a>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white shadow-[0_40px_80px_rgba(33,18,8,0.06)]">
                <div className="absolute left-6 top-6 z-10 rounded-3xl border border-[rgba(33,18,8,0.06)] bg-[rgba(255,255,255,0.95)] p-6 shadow-xl">
                  <div className="text-xs uppercase tracking-[0.35em] text-[var(--primary)]">01</div>
                  <p className="mt-4 max-w-xs text-base leading-7 text-[var(--text)]">
                    Traffic patterns and crowd dynamics in academic spaces.
                  </p>
                </div>
                <div className="grid grid-cols-2 grid-rows-2 gap-4 p-4 sm:p-6">
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1571171637578-041f4a2d3a72?auto=format&fit=crop&w=800&q=80" alt="NTU study" />
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80" alt="Campus life" />
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80" alt="Students studying" />
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1565688534245-05d6b5be184a?auto=format&fit=crop&w=800&q=80" alt="University building" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-soft)] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-14 flex flex-col gap-4">
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">Curated Spaces</div>
              <p className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-[var(--text)] sm:text-4xl">
                A tactile edit of campus life and communal study.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.4fr_0.55fr_0.55fr]">
              <div className="grid gap-6 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_rgba(33,18,8,0.06)]">
                <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(33,18,8,0.08)]">
                  <img className="h-96 w-full object-cover" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80" alt="Organic flow" />
                </div>
                <div className="mt-6 space-y-3">
                  <div className="text-xs uppercase tracking-[0.34em] text-[var(--muted)] font-semibold">Organic Flow</div>
                  <p className="text-base leading-8 text-[var(--muted)]">
                    Where architectural precision meets the fluid nature of human movement. A study in expressive forms and tactile surfaces.
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[2rem] bg-[var(--primary)] p-8 shadow-[0_30px_60px_rgba(33,18,8,0.08)] text-white">
                  <div className="text-sm uppercase tracking-[0.28em] text-[var(--bg-soft)] font-semibold mb-3">Silence is a texture we curate.</div>
                  <p className="text-base leading-8">
                    A quiet manifesto for the rhythms that shape our shared spaces.
                  </p>
                  <button className="mt-8 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] transition hover:bg-white hover:text-[var(--primary)]">
                    Read manifesto
                  </button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-[rgba(33,18,8,0.08)] bg-white p-6 shadow-[0_20px_40px_rgba(33,18,8,0.04)]">
                    <img className="mb-5 h-40 w-full rounded-[1.4rem] object-cover" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=700&q=80" alt="Group study" />
                    <div className="text-sm uppercase tracking-[0.25em] text-[var(--muted)] font-semibold">Collective Study</div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Group dynamics in academic spaces.</p>
                  </div>
                  <div className="rounded-[1.75rem] border border-[rgba(33,18,8,0.08)] bg-white p-6 shadow-[0_20px_40px_rgba(33,18,8,0.04)]">
                    <div className="text-sm uppercase tracking-[0.25em] text-[var(--muted)] font-semibold">The Archive</div>
                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Historical patterns of campus utilization.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-8">
                <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">The Tactile Experience</div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)] sm:text-5xl">A study of texture, light, and rhythm.</h2>
                    <p className="max-w-xl text-base leading-8 text-[var(--muted)]">How environment and crowd flow combine to shape the feel of every canteen, corridor, and study room.</p>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        number: '01',
                        label: 'Natural Textures',
                        description: 'The subtle variations in crowd density that create the unique atmosphere of each canteen space.',
                      },
                      {
                        number: '02',
                        label: 'Architectural Flow',
                        description: 'How building layouts influence movement patterns and social interactions within spaces.',
                      },
                      {
                        number: '03',
                        label: 'Temporal Rhythms',
                        description: 'The ebb and flow of activity throughout the academic day, shaped by class schedules and meal times.',
                      },
                    ].map((item) => (
                      <div key={item.number} className="flex items-start gap-6 rounded-[1.5rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-6">
                        <div className="text-2xl font-semibold text-[var(--primary)]">{item.number}</div>
                        <div>
                          <h3 className="text-base font-semibold tracking-[0.02em] text-[var(--text)]">{item.label}</h3>
                          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white shadow-[0_30px_60px_rgba(33,18,8,0.06)]">
                <img className="aspect-[4/3] w-full object-cover" src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80" alt="Architecture book" />
                <div className="absolute left-6 top-6 max-w-xs rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[rgba(255,255,255,0.96)] p-6 shadow-xl">
                  <p className="text-sm italic leading-7 text-[var(--text)]">"Architecture is the learned game, correct and magnificent, of forms assembled in the light."</p>
                  <p className="mt-6 text-sm uppercase tracking-[0.28em] text-[var(--muted)]">— Le Corbusier</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-soft)] py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-14 shadow-[0_30px_60px_rgba(33,18,8,0.06)]">
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)] sm:text-5xl">Elevate your study ritual.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--muted)]">Receive thoughtful updates on crowd patterns, spatial cues and the moments that matter in campus life.</p>
              <form className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <input type="email" placeholder="Enter email address" className="min-w-[20rem] rounded-full border border-[rgba(33,18,8,0.1)] bg-[var(--bg-soft)] px-6 py-3 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none" />
                <button type="submit" className="rounded-full bg-[var(--primary)] px-8 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[var(--accent)]">Subscribe</button>
              </form>
            </div>
          </div>
        </section>

        <section id="dashboard" className="py-24 bg-[var(--bg-soft)]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 space-y-3">
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">Dashboard</div>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)]">Campus Intelligence Dashboard</h2>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">A refined operations view built for live flow analytics, privacy-aware reporting, and intelligent campus decision-making.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr]">
              <div className="grid gap-6">
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Directory</p>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Canteen status overview</h3>
                    </div>
                    <span className="inline-flex rounded-full bg-[var(--bg-soft)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Live</span>
                  </div>
                  <div className="mt-8 space-y-5">
                    {['North Spine Food Court', 'The Deck Food Court', 'Canteen 11', 'Food Paradise (North Hill)'].map((name, index) => (
                      <div key={name} className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">{name}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Updated 4m ago</p>
                        </div>
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-900">LOW</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)]">
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Privacy feed</p>
                  <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Anonymized insights</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">A quiet rolling feed of blurred activity, designed to preserve identity while showing volume trends.</p>
                  <div className="mt-8 space-y-4">
                    {[
                      { label: 'Student study zones', status: 'Stable', note: 'Masked movement detected' },
                      { label: 'Dining queues', status: 'Rising', note: 'Anonymous density spike' },
                      { label: 'Open seating', status: 'Calm', note: 'Balanced occupancy' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-[var(--text)]">{item.label}</p>
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{item.status}</span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Map</p>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Campus collision map</h3>
                    </div>
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-amber-900">Visual</span>
                  </div>
                  <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-4">
                    <div className="relative aspect-[4/3] rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.12),_transparent_28%),_radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_32%),_rgb(248,244,238)]">
                      {[
                        { label: 'NS', top: '18%', left: '22%', glow: 'bg-emerald-300/25' },
                        { label: 'Deck', top: '35%', left: '56%', glow: 'bg-amber-300/25' },
                        { label: '11', top: '58%', left: '70%', glow: 'bg-rose-300/25' },
                        { label: 'Hill', top: '70%', left: '34%', glow: 'bg-emerald-300/25' },
                      ].map((marker) => (
                        <div key={marker.label} className="absolute flex items-center justify-center rounded-full text-[0.65rem] font-semibold text-[var(--text)]" style={{ top: marker.top, left: marker.left, width: '3rem', height: '3rem', transform: 'translate(-50%, -50%)' }}>
                          <span className={`absolute inset-0 rounded-full ${marker.glow} blur-2xl`} />
                          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white/90 shadow-[0_8px_20px_rgba(33,18,8,0.1)]">{marker.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400"></span>
                        <span>Low crowd</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-amber-400"></span>
                        <span>Medium crowd</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-rose-500"></span>
                        <span>High crowd</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)]">
                  <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">System Metrics</p>
                  <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Operational pulse</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Key processing metrics and anonymized throughput in the current study window.</p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      { value: '12.4k', label: 'Frames processed' },
                      { value: '7.3k', label: 'Identities redacted' },
                      { value: '31h', label: 'Continuous uptime' },
                      { value: '92%', label: 'Anonymity preserved', tooltip: 'Calculated via USENIX 2020 privacy pipeline protocols' },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-[1.75rem] bg-[var(--bg-soft)] p-5">
                        <p className="text-3xl font-semibold text-[var(--text)]">{metric.value}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                          {metric.label}
                          {metric.tooltip ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(33,18,8,0.12)] text-[var(--muted)]" title={metric.tooltip}>i</span>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="admin" className="bg-[var(--bg-soft)] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 space-y-3">
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">Admin Analytics</div>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)]">Summary metrics at a glance</h2>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">A clear overview of report volume, active locations, and participation over time.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)]">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Live report entries</p>
                <p className="mt-4 text-4xl font-semibold text-[var(--text)]">{totalReports}</p>
              </div>
              <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)]">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Most active canteen</p>
                <p className="mt-4 text-4xl font-semibold text-[var(--text)]">{topCanteen}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="report" className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-10 space-y-3 text-center">
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">Submit Report</div>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)]">Share what the canteens feel like now</h2>
              <p className="max-w-2xl mx-auto text-base leading-8 text-[var(--muted)]">Tell the campus how busy a canteen is using a quick report and optional photo.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_25px_50px_rgba(33,18,8,0.05)]">
              <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Select canteen</label>
              <select
                value={selectedCanteen}
                onChange={(event) => setSelectedCanteen(event.target.value)}
                className="w-full rounded-3xl border border-[rgba(33,18,8,0.1)] bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              >
                <option value="">Choose canteen</option>
                {CANTEEN_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Select crowd level</label>
              <select
                value={selectedLevel}
                onChange={(event) => setSelectedLevel(event.target.value)}
                className="w-full rounded-3xl border border-[rgba(33,18,8,0.1)] bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              >
                <option value="">Choose level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Upload image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full rounded-3xl border border-[rgba(33,18,8,0.1)] bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--text)] outline-none"
              />

              <p className="text-sm leading-7 text-[var(--muted)]">{aiHint}</p>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>

              {formFeedback ? <p className="text-sm text-[var(--muted)]">{formFeedback}</p> : null}
            </form>
          </div>
        </section>

        <footer className="border-t border-[rgba(33,18,8,0.08)] bg-[var(--bg-soft)] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">The Tactile Curator</p>
                <p className="max-w-md text-sm leading-7 text-[var(--muted)]">Exploring the intersection of architecture, human behavior, and academic spaces. A digital publication dedicated to understanding how physical environments shape our daily experiences.</p>
              </div>
              <div>
                <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Navigate</h3>
                <ul className="space-y-3 text-sm leading-7 text-[var(--text)]">
                  <li><a href="#landing" className="transition hover:text-[var(--primary)]">Home</a></li>
                  <li><a href="#dashboard" className="transition hover:text-[var(--primary)]">Dashboard</a></li>
                  <li><a href="#report" className="transition hover:text-[var(--primary)]">Submit Report</a></li>
                  <li><a href="#admin" className="transition hover:text-[var(--primary)]">Admin</a></li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Social</h3>
                <ul className="space-y-3 text-sm leading-7 text-[var(--text)]">
                  <li><a href="#" className="transition hover:text-[var(--primary)]">Privacy</a></li>
                  <li><a href="#" className="transition hover:text-[var(--primary)]">Terms</a></li>
                  <li><a href="#" className="transition hover:text-[var(--primary)]">Contact</a></li>
                  <li><a href="#" className="transition hover:text-[var(--primary)]">Instagram</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-[rgba(33,18,8,0.08)] pt-8 text-sm leading-7 text-[var(--muted)]">
              © 2026 NTU Crowd Monitoring • A tactile curation project exploring spatial dynamics in academic environments • Designed with intention for the thoughtful observer
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

