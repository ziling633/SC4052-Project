export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

export const CANTEEN_NAMES = [
    'Canteen 1', 'Canteen 2', 'Canteen 4', 'Canteen 9', 'Canteen 11 (Hall 11)',
    'Canteen 14 (Hall 14)', 'Canteen 16 (Hall 16)', 'North Hill Food Court', 'Crespion Food Court',
    'Northspine food court (Canteen A)', 'Southspine food court (Canteen B)',
    'Quad Cafe', 'Pioneer Food Court', 'Nanyang Crescent Food Court'
];

export const MAP_COORDINATES = [
    { id: '1', label: 'C1', top: '30%', left: '72%' },
    { id: '2', label: 'C2', top: '18%', left: '62%' },
    { id: '3', label: 'C4', top: '68%', left: '65%' },
    { id: '4', label: 'C9', top: '8%', left: '53%' },
    { id: '5', label: 'C11', top: '45%', left: '30%' },
    { id: '6', label: 'C14', top: '15%', left: '45%' },
    { id: '7', label: 'C16', top: '25%', left: '55%' },
    { id: '8', label: 'NH', top: '10%', left: '75%' },
    { id: '9', label: 'CR', top: '40%', left: '20%' },
    { id: '10', label: 'NSA', top: '22%', left: '35%' },
    { id: '11', label: 'SSB', top: '60%', left: '40%' },
    { id: '12', label: 'QC', top: '55%', left: '35%' },
    { id: '13', label: 'PFC', top: '80%', left: '80%' },
    { id: '14', label: 'NCFC', top: '12%', left: '65%' },
];

export const CANTEEN_VISUALS = {
    'North Spine Food Court (Koufu)': { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80', blur: 10 },
    'South Spine Food Court (Fine Food)': { image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', blur: 6 },
    'Food Court @ NIE': { image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80', blur: 12 },
    'Canteen 1 (Hall 1)': { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80', blur: 8 },
    'Canteen 2 (Hall 2)': { image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=1000&q=80', blur: 5 },
    'Canteen 4 (Hall 4)': { image: 'https://images.unsplash.com/photo-1555992336-03a23c52cdd2?auto=format&fit=crop&w=1000&q=80', blur: 14 },
    'Canteen 5 (Hall 5)': { image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80', blur: 9 },
    'Canteen 9 (Hall 9)': { image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', blur: 7 },
};

export const getCanteenVisual = (name) => CANTEEN_VISUALS[name] || { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80', blur: 8 };

export const getMarkerColor = (crowdLevel) => {
    const normalized = String(crowdLevel || '').toLowerCase();
    if (normalized === 'low') return { bg: 'bg-emerald-400', border: 'border-emerald-500', text: 'text-emerald-900', glow: 'bg-emerald-300/40' };
    if (normalized === 'medium') return { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-900', glow: 'bg-amber-300/40' };
    if (normalized === 'high') return { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white', glow: 'bg-rose-400/40' };
    return { bg: 'bg-slate-300', border: 'border-slate-400', text: 'text-slate-700', glow: 'bg-slate-300/40' };
};

export const levelStyles = {
    Low: 'bg-emerald-400 text-emerald-900',
    Medium: 'bg-amber-300 text-amber-950',
    High: 'bg-rose-500 text-white',
    Unknown: 'bg-slate-300 text-slate-700',
};
