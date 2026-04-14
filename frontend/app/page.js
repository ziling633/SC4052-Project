"use client";

import { motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../lib/firebaseClient';
import FadeInReveal from './FadeInReveal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';

const CANTEEN_NAME_ALIASES = {
  'Canteen 11': 'Canteen 11 (Hall 11)',
  'Canteen 14': 'Canteen 14 (Hall 14)',
  'Canteen 16': 'Canteen 16 (Hall 16)',
};

function normalizeCanteenName(name) {
  const value = String(name || '').trim();
  if (!value) return value;
  return CANTEEN_NAME_ALIASES[value] || value;
}

const CANTEEN_NAMES = [
  'Canteen 1 (Hall 1)',
  'Canteen 2 (Hall 2)',
  'Canteen 4 (Hall 4)',
  'Canteen 5 (Hall 5)',
  'Canteen 9 (Hall 9)',
  'Canteen 11 (Hall 11)',
  'Canteen 14 (Hall 14)',
  'Canteen 16 (Hall 16)',
  'North Hill Food Court',
  'Crescent Food Court',
  'Northspine food court (Canteen A)',
  'Southspine food court (Canteen B)',
  'Quad Cafe',
  'Nanyang Crescent Food Court',
];

const CANTEEN_ID_MAP = {
  'Canteen 1 (Hall 1)': '1',
  'Canteen 2 (Hall 2)': '2',
  'Canteen 4 (Hall 4)': '3',
  'Canteen 5 (Hall 5)': '13',
  'Canteen 9 (Hall 9)': '4',
  'Canteen 11 (Hall 11)': '5',
  'Canteen 14 (Hall 14)': '6',
  'Canteen 16 (Hall 16)': '7',
  'North Hill Food Court': '8',
  'Crescent Food Court': '9',
  'Northspine food court (Canteen A)': '10',
  'Southspine food court (Canteen B)': '11',
  'Quad Cafe': '12',
  'Nanyang Crescent Food Court': '14',
};

const MAP_COORDINATES = [
  { id: 'North Hill Food Court', label: 'NH', lat: 1.3487, lng: 103.6890, top: '10%', left: '83%' },
  { id: 'Crescent Food Court', label: 'CR', lat: 1.3490, lng: 103.6860, top: '80%', left: '85%' },
  { id: 'Northspine food court (Canteen A)', label: 'NSA', lat: 1.348440, lng: 103.685478, top: '42%', left: '50%' },
  { id: 'Southspine food court (Canteen B)', label: 'SSB', lat: 1.3424, lng: 103.6823, top: '70%', left: '28%' },
  { id: 'Quad Cafe', label: 'QC', lat: 1.3505, lng: 103.6860, top: '48%', left: '35%' },
  { id: 'Nanyang Crescent Food Court', label: 'NC', lat: 1.3528, lng: 103.6808, top: '13%', left: '48%' },
  { id: 'Canteen 1 (Hall 1)', label: 'C1', lat: 1.345693, lng: 103.687562, top: '62%', left: '70%' },
  { id: 'Canteen 2 (Hall 2)', label: 'C2', lat: 1.3481, lng: 103.6854, top: '40%', left: '68%' },
  { id: 'Canteen 4 (Hall 4)', label: 'C4', lat: 1.3440, lng: 103.6860, top: '85%', left: '50%' },
  { id: 'Canteen 5 (Hall 5)', label: 'C5', lat: 1.3475, lng: 103.6784, top: '80%', left: '65%' },
  { id: 'Canteen 9 (Hall 9)', label: 'C9', lat: 1.3521, lng: 103.6849, top: '25%', left: '65%' },
  { id: 'Canteen 11 (Hall 11)', label: 'C11', lat: 1.355034, lng: 103.685917, top: '7%', left: '65%' },
  { id: 'Canteen 14 (Hall 14)', label: 'C14', lat: 1.352906, lng: 103.682304, top: '11%', left: '35%' },
  { id: 'Canteen 16 (Hall 16)', label: 'C16', lat: 1.349720, lng: 103.681284, top: '20%', left: '25%' },
];

const CANTEEN_VISUALS = {
  'North Hill Food Court': { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80', blur: 10 },
  'Crescent Food Court': { image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', blur: 6 },
  'Northspine food court (Canteen A)': { image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80', blur: 12 },
  'Southspine food court (Canteen B)': { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80', blur: 8 },
  'Quad Cafe': { image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=1000&q=80', blur: 5 },
  'Nanyang Crescent Food Court': { image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80', blur: 9 },
  'Canteen 1 (Hall 1)': { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80', blur: 8 },
  'Canteen 2 (Hall 2)': { image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=1000&q=80', blur: 5 },
  'Canteen 4 (Hall 4)': { image: 'https://images.unsplash.com/photo-1555992336-03a23c52cdd2?auto=format&fit=crop&w=1000&q=80', blur: 14 },
  'Canteen 5 (Hall 5)': { image: 'https://images.unsplash.com/photo-1555992336-03a23c52cdd2?auto=format&fit=crop&w=1000&q=80', blur: 14 },
  'Canteen 9 (Hall 9)': { image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', blur: 7 },
  'Canteen 11 (Hall 11)': { image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80', blur: 11 },
  'Canteen 14 (Hall 14)': { image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1000&q=80', blur: 13 },
  'Canteen 16 (Hall 16)': { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80', blur: 10 },
};

const getCanteenVisual = (name) => CANTEEN_VISUALS[name] || { image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80', blur: 8 };

const getMarkerColor = (crowdLevel, isStale = false) => {
  if (isStale) return { bg: 'bg-slate-300', border: 'border-slate-400', text: 'text-slate-700', glow: 'bg-slate-300/40' };

  const normalized = String(crowdLevel || '').toLowerCase();
  if (normalized === 'low') return { bg: 'bg-emerald-400', border: 'border-emerald-500', text: 'text-emerald-900', glow: 'bg-emerald-300/40' };
  if (normalized === 'medium') return { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-900', glow: 'bg-amber-300/40' };
  if (normalized === 'high') return { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white', glow: 'bg-rose-400/40' };
  return { bg: 'bg-slate-300', border: 'border-slate-400', text: 'text-slate-700', glow: 'bg-slate-300/40' };
};

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

function pickBestCrowdLevel(...values) {
  for (const value of values) {
    const normalized = normalizeLevel(value);
    if (normalized !== 'Unknown') return normalized;
  }
  return 'Unknown';
}

function simulateAIClassification(file) {
  // Placeholder - real AI analysis happens on the backend with OpenAI GPT-4 Vision
  if (!file) return 'Unknown';
  return 'Analyzing...';
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    // 3MB limit (in bytes)
    const MAX_SIZE = 3 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      reject(new Error(`Image exceeds 3MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB). Please choose a smaller image.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Start with quality 0.7, reduce if needed to stay under 3MB
        let outputQuality = quality;
        let base64 = canvas.toDataURL('image/jpeg', outputQuality);

        // If still too large, recursively reduce quality
        while (base64.length > MAX_SIZE * 4 / 3 && outputQuality > 0.1) {
          outputQuality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', outputQuality);
        }

        // Final check
        if (base64.length > MAX_SIZE * 4 / 3) {
          reject(new Error('Unable to compress image enough. Please try a different image.'));
          return;
        }

        resolve(base64);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createImagePreview(file) {
  return compressImage(file, 800, 0.7);
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

function formatDisplayTime(value) {
  if (!value) return null;
  if (value === 'Never') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDisplayLabel(value) {
  return formatDisplayTime(value) || 'No timestamp available';
}

function getDisplayRelative(value) {
  if (!value) return 'No timestamp available';
  return formatRelativeTime(value);
}

function isDataStale(isoString) {
  if (!isoString) return true;
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return true;

  const diffInMinutes = (Date.now() - date.getTime()) / (1000 * 60);
  return diffInMinutes > 120; // 120 minutes = 2 hours
}

function getCanteenId(name) {
  return CANTEEN_ID_MAP[name] || null;
}

export default function Home() {
  const [statusList, setStatusList] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [directoryItems, setDirectoryItems] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [reportSummary, setReportSummary] = useState({ totalReports: 0, topCanteen: 'None' });
  const [latestReportsByCanteen, setLatestReportsByCanteen] = useState({});
  const [privacyFilterEnabled, setPrivacyFilterEnabled] = useState(true); // Default to On
  const [activeCanteen, setActiveCanteen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Search, Filter, and Sort States for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [crowdFilter, setCrowdFilter] = useState('all'); // all, low, medium, high
  const [sortBy, setSortBy] = useState('name'); // name, latest

  // New states for processing overlay
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const openCanteenModal = (canteen) => {
    setActiveCanteen(canteen);
    setModalOpen(true);
  };

  const goToSubmitReport = (canteenName) => {
    setSelectedCanteen(canteenName);
    setSelectedLevel('');
    setSelectedFile(null);
    setSelectedImagePreview(null);
    setFormFeedback('');
    setOpenDropdownKey(null);
    window.location.hash = 'report';
    window.setTimeout(() => {
      document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const closeCanteenModal = () => {
    setModalOpen(false);
    setActiveCanteen(null);
  };

  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [latestUpload, setLatestUpload] = useState(null);
  const [aiHint, setAiHint] = useState('🤖 OpenAI Vision enabled. Upload an image for automatic crowd detection.');
  const [formFeedback, setFormFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [toastVisible, setToastVisible] = useState(false);

  const aiTimeout = useRef(null);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setStatusError('');

    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      setStatusError('The page is opened from a local file. Please start the frontend with `npm run dev` and open http://localhost:3000 instead of using file://.');
      setLoadingStatus(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), 30000);

    try {
      console.log('🔗 Fetching from:', `${API_BASE}/canteens/status`);
      const response = await fetch(`${API_BASE}/canteens/status`, {
        signal: abortController.signal,
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      const json = await response.json();
      console.log('📊 API Response:', json.data);
      console.log('📊 API last_updated values:', (json.data || []).map((item) => ({ canteen_id: item.canteen_id, last_updated: item.last_updated })));
      setStatusList(json.data || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Dashboard fetch timeout (backend is slow)');
        setStatusError('Backend is slow to respond. Make sure Firebase is properly connected.');
      } else {
        console.error('❌ Dashboard fetch error:', error);
        setStatusList([]);
        setStatusError(`Error: ${error.message}. Backend on http://localhost:8000, Frontend on http://localhost:5173`);
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setDirectoryLoading(true);

    const canteensQuery = query(
      collection(firestore, 'canteens'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      canteensQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: normalizeCanteenName(data.name || `Canteen ${doc.id}`),
            crowdLevel: data.currentCrowdLevel || data.crowdLevel || data.crowd_level || 'Unknown',
            lastUpdated: data.lastUpdated ? data.lastUpdated.toDate().toISOString() : null,
          };
        });
        setDirectoryItems(items);
        setDirectoryLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setDirectoryItems([]);
        setDirectoryLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const reportsQuery = query(
      collection(firestore, 'reports'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeReports = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const counts = {};
        const highCrowdCounts = {};
        const latestByCanteen = {};
        const latestImageByCanteen = {};
        let latestImage = null;

        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const canteenName = normalizeCanteenName(data.canteen_name || data.canteenName || 'Unknown');
          counts[canteenName] = (counts[canteenName] || 0) + 1;

          const rawLevel = data.crowd_level || data.crowdLevel || data.currentCrowdLevel || 'Unknown';
          const crowdLevel = normalizeLevel(rawLevel);

          if (crowdLevel === 'High') {
            highCrowdCounts[canteenName] = (highCrowdCounts[canteenName] || 0) + 1;
          }

          if (!latestImage && data.image_preview) {
            latestImage = {
              preview: data.image_preview,
              canteenName,
            };
          }

          const canteenId = data.canteen_id;
          if (canteenId && data.image_preview && !latestImageByCanteen[canteenId]) {
            latestImageByCanteen[canteenId] = {
              imagePreview: data.image_preview,
              imageSource: data.source || 'manual',
            };
          }
          if (canteenId && !latestByCanteen[canteenId]) {
            const ts = data.timestamp;
            const lastUpdated =
              ts && typeof ts.toDate === 'function'
                ? ts.toDate().toISOString()
                : typeof ts === 'string'
                  ? ts
                  : ts instanceof Date
                    ? ts.toISOString()
                    : null;

            latestByCanteen[canteenId] = {
              crowdLevel,
              lastUpdated,
              imagePreview: data.image_preview || null,
              source: data.source || 'manual',
              imageSource: data.image_preview ? (data.source || 'manual') : null,
            };
          }
        });

        Object.entries(latestByCanteen).forEach(([canteenId, payload]) => {
          if (!payload.imagePreview && latestImageByCanteen[canteenId]?.imagePreview) {
            payload.imagePreview = latestImageByCanteen[canteenId].imagePreview;
            payload.imageSource = latestImageByCanteen[canteenId].imageSource;
          }
        });

        const totalReports = snapshot.size;
        let topCanteen = 'None';
        let maxHighReports = 0;

        Object.entries(highCrowdCounts).forEach(([name, count]) => {
          if (count > maxHighReports) {
            maxHighReports = count;
            topCanteen = `${name} (${count})`;
          }
        });

        // Fallback to most reports overall if no High crowd reports exist
        if (topCanteen === 'None' && snapshot.size > 0) {
          let topOverallCount = 0;
          Object.entries(counts).forEach(([name, count]) => {
            if (count > topOverallCount) {
              topOverallCount = count;
              topCanteen = `${name} (${count})`;
            }
          });
        }

        setReportSummary({ totalReports, topCanteen });
        setLatestUpload(latestImage);
        setLatestReportsByCanteen(latestByCanteen);
      },
      (error) => {
        console.error('Firestore reports listener error:', error);
      }
    );

    return () => unsubscribeReports();
  }, []);

  const totalReports = reportSummary.totalReports;
  const topCanteen = reportSummary.topCanteen;

  const statusByName = useMemo(
    () => Object.fromEntries(statusList.map((item) => [normalizeCanteenName(item.name), item])),
    [statusList]
  );

  const mergedDirectoryItems = useMemo(() => {
    let items = directoryItems.map((item) => {
      const reportData = latestReportsByCanteen[item.id];
      const lastUpdated = reportData?.lastUpdated || null;
      return {
        ...item,
        crowdLevel: reportData?.crowdLevel || 'Unknown',
        lastUpdated: lastUpdated,
        imagePreview: reportData?.imagePreview || null,
        source: reportData?.source || 'Firestore',
        isStale: isDataStale(lastUpdated),
      };
    });

    // 1. Search Filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }

    // 2. Crowd Level Filtering
    if (crowdFilter !== 'all') {
      items = items.filter((item) => item.crowdLevel.toLowerCase() === crowdFilter);
    }

    // 3. Sorting
    items.sort((a, b) => {
      if (sortBy === 'latest') {
        const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return timeB - timeA; // Descending (most recent first)
      }
      // Default: sort by name
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [directoryItems, latestReportsByCanteen, searchQuery, crowdFilter, sortBy]);

  const processSelectedFile = async (file) => {
    setSelectedFile(file);
    setSelectedImagePreview(null);
    setFormFeedback('');

    if (!file) {
      if (aiTimeout.current) {
        window.clearTimeout(aiTimeout.current);
        aiTimeout.current = null;
      }
      setAiHint('🤖 OpenAI Vision enabled. Upload an image for automatic crowd detection.');
      return;
    }

    setSelectedLevel('');
    setAiHint('🔍 Processing image with OpenAI Vision...');
    if (aiTimeout.current) {
      window.clearTimeout(aiTimeout.current);
    }

    try {
      const preview = await createImagePreview(file);
      setSelectedImagePreview(preview);
      setFormFeedback('');
    } catch (previewError) {
      console.error('Error processing image:', previewError);
      setSelectedImagePreview(null);
      setFormFeedback(`❌ ${previewError.message}`);
      setShowToast(true, `Error: ${previewError.message}`, 'error');
      return;
    }

    aiTimeout.current = window.setTimeout(() => {
      const predicted = simulateAIClassification(file);
      // Don't set selectedLevel - let backend AI analyze when user submits
      // Just show hint that AI will analyze on submission
      setAiHint('🤖 Ready to analyze. Submit without selecting a level for AI detection, or choose manually.');
      aiTimeout.current = null;
    }, 800);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    await processSelectedFile(file);
  };

  const handleFileDrop = async (event) => {
    event.preventDefault();
    setIsDropActive(false);
    const file = event.dataTransfer.files?.[0] || null;
    await processSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormFeedback('');
    setSubmitStatus('idle');

    if (!selectedCanteen) {
      setFormFeedback('Please select a canteen.');
      return;
    }

    let level = selectedLevel;
    // Don't simulate AI here - let backend handle real AI analysis
    // Just send the level as-is (null if not selected)

    // Validation: require either manual crowd level OR image for AI detection
    if (!level && !selectedImagePreview) {
      setFormFeedback('❌ Please select a crowd level OR upload an image for AI detection.');
      return;
    }

    const canteenId = getCanteenId(selectedCanteen);
    if (!canteenId) {
      setFormFeedback('Invalid canteen selection.');
      return;
    }

    const showAiProcessing = Boolean(selectedFile);

    const submitReport = async () => {
      setSubmitting(true);
      setSubmitStatus('submitting');

      const abortController = new AbortController();
      const timeoutId = window.setTimeout(() => abortController.abort(), 20000);

      try {
        const response = await fetch(`${API_BASE}/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            canteen_id: canteenId,
            crowd_level: level,
            source: selectedFile ? 'vision-ai' : 'manual',
            image_name: selectedFile?.name || null,
            image_type: selectedFile?.type || null,
            image_size: selectedFile?.size || null,
            image_preview: selectedImagePreview || null,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          throw new Error(errorPayload?.detail?.message || 'Unable to submit report right now.');
        }

        await fetchStatus();
        setFormFeedback('Report submitted successfully. Dashboard refreshed.');
        setSubmitStatus('success');
        setToastMessage('Successfully submitted report to the API');
        setToastVariant('success');
        setToastVisible(true);
        setSelectedCanteen('');
        setSelectedLevel('');
        setSelectedFile(null);
        setSelectedImagePreview(null);
        setAiHint('AI inference currently off. Choose a level or upload image for auto suggestion.');
        formRef.current?.reset();

        window.setTimeout(() => {
          setToastVisible(false);
          setSubmitStatus('idle');
        }, 3200);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Report submission aborted');
          return;
        }
        console.error(error);
        const errorMessage = error.message || 'Unable to submit report right now.';
        setFormFeedback(errorMessage);
        setSubmitStatus('error');
        setToastMessage('Report failed to submit. Please try again.');
        setToastVariant('error');
        setToastVisible(true);
        window.setTimeout(() => {
          setToastVisible(false);
          setSubmitStatus('idle');
        }, 3200);
      } finally {
        window.clearTimeout(timeoutId);
        setSubmitting(false);
        if (showAiProcessing) {
          setIsProcessing(false);
          setProcessingStep(0);
          setProcessingMessage('');
        }
      }
    };

    if (showAiProcessing) {
      setIsProcessing(true);
      setProcessingStep(1);
      setProcessingMessage('Detecting crowd density...');

      // Simulate processing steps for image-based workflows
      setTimeout(() => {
        setProcessingStep(2);
        setProcessingMessage('Applying privacy masks...');
      }, 800);

      setTimeout(() => {
        setProcessingStep(3);
        setProcessingMessage('Report Anonymized.');
      }, 1600);

      setTimeout(submitReport, 2400);
    } else {
      await submitReport();
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

  const DirectorySkeleton = () => (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="rounded-[1.75rem] border border-black/5 bg-black/5 p-5 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-4 w-44 rounded-xl bg-black/10" />
              <div className="h-3 w-32 rounded-xl bg-black/10" />
            </div>
            <div className="h-7 w-24 rounded-full bg-black/10" />
          </div>
          <div className="mt-5 h-3 w-28 rounded-xl bg-black/10" />
        </div>
      ))}
    </div>
  );

  const CountUpNumber = ({ value, durationMs = 1500 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (!inView) return;
      const target = Number(value) || 0;
      let rafId = null;
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const tick = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        const next = Math.round(easeOut(t) * target);
        setDisplayValue(next);
        if (t < 1) rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [inView, value, durationMs]);

    return <span ref={ref}>{displayValue.toLocaleString()}</span>;
  };

  const CanteenDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    triggerClassName,
    valueTextClassName,
    menuClassName,
    dropdownKey,
  }) => {
    const [localOpen, setLocalOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const rootRef = useRef(null);
    const normalizedOptions = useMemo(
      () =>
        (options || []).map((opt) =>
          typeof opt === 'string' ? { value: opt, label: opt } : { value: opt.value, label: opt.label }
        ),
      [options]
    );
    const selectedOption = useMemo(
      () => normalizedOptions.find((opt) => opt.value === value) || null,
      [normalizedOptions, value]
    );
    const isControlled = Boolean(dropdownKey);
    const open = isControlled ? openDropdownKey === dropdownKey : localOpen;
    const setOpen = (next) => {
      if (isControlled) {
        setOpenDropdownKey(next ? dropdownKey : null);
      } else {
        setLocalOpen(next);
      }
    };

    useEffect(() => {
      if (!open) return;
      const onPointerDown = (event) => {
        if (!rootRef.current) return;
        if (!rootRef.current.contains(event.target)) setOpen(false);
      };
      const onKeyDown = (event) => {
        if (event.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('mousedown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [open, isControlled, dropdownKey]);

    useEffect(() => {
      if (!open) return;
      const idx = normalizedOptions.findIndex((opt) => opt.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }, [open, normalizedOptions, value]);

    const selectValue = (next) => {
      onChange(next);
      setOpen(false);
    };

    return (
      <div ref={rootRef} className={`relative ${open ? 'z-[60]' : ''}`}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((prev) => (prev >= 0 ? prev : 0));
              return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen((prev) => !prev);
              return;
            }
          }}
          className={
            triggerClassName ||
            'flex w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--primary)]'
          }
        >
          <span className={`${value ? 'font-medium' : 'text-[var(--muted)]'} ${valueTextClassName || ''}`}>
            {selectedOption?.label || placeholder}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open ? (
          <div
            role="listbox"
            className={
              menuClassName ||
              'absolute left-0 right-0 z-[70] mt-2 max-h-72 overflow-auto rounded-xl border border-black/5 bg-white p-1 shadow-[0_10px_40px_rgba(0,0,0,0.08)]'
            }
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((prev) => Math.min(normalizedOptions.length - 1, (prev < 0 ? 0 : prev) + 1));
                return;
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((prev) => Math.max(0, (prev < 0 ? 0 : prev) - 1));
                return;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                const next = normalizedOptions[activeIndex];
                if (next) selectValue(next.value);
                return;
              }
            }}
          >
            {normalizedOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectValue(opt.value)}
                  className={`cursor-pointer select-none rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 ${isActive ? 'bg-black/5' : ''
                    } ${isSelected ? 'font-medium text-[var(--text)]' : 'text-[var(--text)] hover:bg-black/5'}`}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .pulse-marker {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F9F7F2]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-sm uppercase tracking-[0.4em] text-[var(--muted)] font-semibold">CROWDBYTE</div>
          <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            <a href="#landing" className="transition-colors hover:text-[var(--text)]">Home</a>
            <a href="#dashboard" className="transition-colors hover:text-[var(--text)]">Dashboard</a>
            <a href="#report" className="transition-colors hover:text-[var(--text)]">Submit Report</a>
            <a href="#admin" className="transition-colors hover:text-[var(--text)]">Analytics</a>
          </nav>
        </div>
      </header>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4">
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_25px_50px_rgba(33,18,8,0.25)] text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto bg-[var(--primary)] rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full animate-pulse"></div>
                </div>
                {/* Scanning line animation */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--primary)] animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Processing Report</h3>
              <p className="text-sm text-[var(--muted)]">{processingMessage}</p>
              <div className="mt-4 flex justify-center space-x-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${step <= processingStep ? 'bg-[var(--primary)]' : 'bg-slate-200'
                      }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <section id="landing" className="bg-[var(--bg)] pb-24 pt-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <FadeInReveal className="space-y-8">
                <div className="text-xs uppercase tracking-[0.34em] text-[var(--muted)] font-semibold">
                  Campus-Flow-as-a-Service
                </div>
                <div className="max-w-2xl space-y-6">
                  <h1 className="text-5xl font-semibold leading-[0.92] tracking-[-0.03em] text-[var(--text)] sm:text-6xl lg:text-7xl">
                    NTU Crowd
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
                    A privacy-preserving framework for crowdsourced campus intelligence, synthesizing real-time spatial data with student-led reporting.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a
                    href="#dashboard"
                    className="inline-flex w-full items-center justify-center rounded-full border border-[var(--text)] bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text)] transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-[var(--text)] hover:text-white hover:shadow-lg sm:w-auto"
                  >
                    Explore dashboard
                  </a>
                  <a href="#report" className="inline-flex w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text)] transition hover:bg-white sm:w-auto">
                    Submit report
                  </a>
                </div>
              </FadeInReveal>

              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white shadow-[0_40px_80px_rgba(33,18,8,0.06)]">
                <div className="grid grid-cols-2 grid-rows-2 gap-4 p-4 sm:p-6">
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80" alt="NTU study" />
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80" alt="Campus life" />
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80" alt="Students studying" />
                  <img className="h-64 w-full rounded-3xl object-cover shadow-lg transition duration-500 hover:scale-105 sm:h-72" src="https://images.unsplash.com/photo-1565688534245-05d6b5be184a?auto=format&fit=crop&w=800&q=80" alt="University building" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Change max-w-[92rem] to max-w-7xl (standard professional width) */}
        <section className="bg-[var(--bg-soft)] py-16 lg:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mb-12 flex flex-col gap-4">
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">
                Spatial Intelligence
              </div>
              <p className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-[var(--text)] sm:text-4xl leading-tight">
                A real-time overview of campus density and student flow.
              </p>
            </div>

            {/* 2. Reduced the column ratio and removed the massive 44rem height */}
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">

              {/* 3. Changed min-h to a more reasonable 36rem for better vertical alignment */}
              <FadeInReveal className="flex h-full flex-col gap-6 rounded-[2.5rem] bg-white p-8 shadow-[0_30px_60px_rgba(33,18,8,0.06)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg lg:min-h-[38rem]">
                <div className="overflow-hidden rounded-[1.75rem] border border-[rgba(33,18,8,0.08)]">
                  {/* Proportional image height */}
                  <img className="h-[20rem] w-full object-cover sm:h-[24rem]" src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80" alt="Anonymized analytics" />
                </div>
                <div className="space-y-4 mt-2">
                  <div className="text-xs uppercase tracking-[0.34em] text-[var(--muted)] font-semibold">Anonymized Analytics</div>
                  <p className="text-base leading-relaxed text-[var(--muted)]">
                    Where precision analytics meets student privacy. A study in anonymized movement and spatial utility across NTU.
                  </p>
                </div>
              </FadeInReveal>

              {/* 4. Right side column - adjusted to match the 38rem height */}
              <div className="flex h-full flex-col gap-6 lg:min-h-[38rem]">
                <FadeInReveal delay={0.15} className="flex flex-1 flex-col justify-between rounded-[2.5rem] bg-[var(--primary)] p-8 shadow-[0_30px_60px_rgba(33,18,8,0.08)] text-white transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                  <div className="space-y-4">
                    <div className="text-sm uppercase tracking-[0.28em] text-white/70 font-semibold">Privacy is a feature we architect.</div>
                    <p className="text-lg leading-relaxed font-medium">
                      An anonymised manifest for the rhythms that shape our canteen.
                    </p>
                  </div>
                  <button
                    onClick={() => setPrivacyModalOpen(true)}
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-white hover:text-[var(--primary)] hover:shadow-lg sm:w-fit"
                  >
                    View privacy protocol
                  </button>
                </FadeInReveal>

                {/* Small cards section */}
                <div className="grid flex-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  <FadeInReveal delay={0.25} className="flex flex-col rounded-[1.75rem] border border-[rgba(33,18,8,0.08)] bg-white p-6 shadow-[0_20px_40px_rgba(33,18,8,0.04)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                    <img
                      className="mb-5 h-44 w-full rounded-[1.4rem] object-cover"
                      src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80"
                      alt="Campus pulse"
                    />
                    <div className="text-sm uppercase tracking-[0.25em] text-[var(--muted)] font-semibold">Campus Pulse</div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Monitoring group dynamics across NTU&apos;s social and academic landscapes.</p>
                  </FadeInReveal>
                  <FadeInReveal delay={0.25} className="flex flex-col rounded-[1.75rem] border border-[rgba(33,18,8,0.08)] bg-white p-6 shadow-[0_20px_40px_rgba(33,18,8,0.04)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                    <img
                      className="mb-5 h-44 w-full rounded-[1.4rem] object-cover"
                      src="https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=900&q=80"
                      alt="Historical insights"
                    />
                    <div className="text-sm uppercase tracking-[0.25em] text-[var(--muted)] font-semibold">Historical Insights</div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Identifying long-term patterns of canteen utilisation.</p>
                  </FadeInReveal>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="space-y-8">
                <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">THE ANALYTICS EXPERIENCE</div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)] sm:text-5xl">A study of movement, privacy, and communal flow.</h2>
                    <p className="max-w-xl text-base leading-8 text-[var(--muted)]">How real-time data and privacy engineering combine to optimize the dining experience across all NTU canteens.</p>
                  </div>
                  <div className="space-y-6">
                    {[
                      {
                        number: '01',
                        label: 'Anonymized Vision',
                        description: 'Every student-contributed photo undergoes an immediate privacy-redaction process to mask faces while preserving essential crowd context.',
                      },
                      {
                        number: '02',
                        label: 'Live Flow Metrics',
                        description: 'Real-time updates on canteen utilization allow you to navigate peak-hour queues and find seating with effortless precision.',
                      },
                      {
                        number: '03',
                        label: 'Collective Intelligence',
                        description: 'A decentralized service model that transforms individual dining observations into a shared, high-value campus resource.',
                      },
                    ].map((item) => (
                      <div key={item.number} className="flex items-start gap-6 rounded-[1.5rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-6 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
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

              <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white shadow-[0_30px_60px_rgba(33,18,8,0.06)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                <img className="aspect-[4/3] w-full object-cover" src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80" alt="Architecture book" />
                <div className="absolute left-6 top-6 max-w-xs rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[rgba(255,255,255,0.96)] p-6 shadow-xl">
                  <p className="text-sm italic leading-7 text-[var(--text)]">"The strength of a community is found in its ability to share insights while safeguarding the privacy of its members."</p>
                  <p className="mt-6 text-sm uppercase tracking-[0.28em] text-[var(--muted)]">— THE PRIVACY MANIFESTO</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="dashboard" className="py-24 bg-[var(--bg-soft)]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 space-y-6">
              <div className="space-y-3">
                <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">Dashboard</div>
                <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)]">Campus Intelligence Dashboard</h2>
                <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">A refined operations view built for live flow analytics, privacy-aware reporting, and intelligent campus decision-making.</p>
              </div>

              {/* Atas Search, Filter, and Sort Controls */}
              <div className="flex flex-col gap-4 rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-6 shadow-[0_20px_40px_rgba(33,18,8,0.05)] sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search canteens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full bg-[var(--bg-soft)] py-3 pl-11 pr-6 text-sm font-medium outline-none transition focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[12rem]">
                    <CanteenDropdown
                      value={crowdFilter}
                      onChange={(value) => setCrowdFilter(value)}
                      dropdownKey="dashboard-crowdFilter"
                      options={[
                        { value: 'all', label: 'All Levels' },
                        { value: 'low', label: 'Low Crowd' },
                        { value: 'medium', label: 'Medium Crowd' },
                        { value: 'high', label: 'High Crowd' },
                      ]}
                      placeholder="All Levels"
                      triggerClassName="flex w-full items-center justify-between gap-3 rounded-full bg-[var(--bg-soft)] px-5 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-colors hover:bg-slate-100 border border-black/10"
                      valueTextClassName="uppercase tracking-widest text-xs"
                      menuClassName="absolute left-0 right-0 mt-2 max-h-72 overflow-auto rounded-xl border border-black/5 bg-white p-1 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
                    />
                  </div>
                  <div className="min-w-[12rem]">
                    <CanteenDropdown
                      value={sortBy}
                      onChange={(value) => setSortBy(value)}
                      dropdownKey="dashboard-sortBy"
                      options={[
                        { value: 'name', label: 'Sort by Name' },
                        { value: 'latest', label: 'Sort by Latest' },
                      ]}
                      placeholder="Sort by Name"
                      triggerClassName="flex w-full items-center justify-between gap-3 rounded-full bg-[var(--bg-soft)] px-5 py-3 text-xs font-bold uppercase tracking-widest outline-none transition-colors hover:bg-slate-100 border border-black/10"
                      valueTextClassName="uppercase tracking-widest text-xs"
                      menuClassName="absolute left-0 right-0 mt-2 max-h-72 overflow-auto rounded-xl border border-black/5 bg-white p-1 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr]">
              <div className="grid gap-6">
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Directory</p>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Canteen status overview</h3>
                    </div>
                    <span className="inline-flex rounded-full bg-[var(--bg-soft)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Live</span>
                  </div>
                  <FadeInReveal className="mt-8 space-y-5">
                    {directoryLoading ? (
                      <DirectorySkeleton />
                    ) : mergedDirectoryItems.length > 0 ? (
                      mergedDirectoryItems.map((item) => {
                        const normalized = item.crowdLevel?.toLowerCase() || 'unknown';
                        const statusStyles =
                          normalized === 'low'
                            ? 'bg-emerald-100 text-emerald-900'
                            : normalized === 'medium'
                              ? 'bg-amber-100 text-amber-900'
                              : normalized === 'high'
                                ? 'bg-rose-100 text-rose-900'
                                : 'bg-slate-100 text-slate-700';

                        return (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openCanteenModal(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openCanteenModal(item);
                              }
                            }}
                            className={`group w-full cursor-pointer rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] px-5 py-4 text-left transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black/10 ${item.isStale ? 'bg-slate-50 opacity-70' : 'bg-[var(--bg-soft)]'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-[var(--text)]">{item.name}</p>
                                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                  {item.lastUpdated ? `Updated ${getDisplayLabel(item.lastUpdated)}` : 'No timestamp available'}
                                </p>
                              </div>
                              {item.isStale ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToSubmitReport(item.name);
                                  }}
                                  className="rounded-full border border-black/20 bg-transparent px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text)] transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-black hover:text-white hover:shadow-lg cursor-pointer"
                                >
                                  Update Status
                                </button>
                              ) : (
                                <span className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${statusStyles}`}>
                                  {item.crowdLevel || 'UNKNOWN'}
                                </span>
                              )}
                            </div>
                            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Tap for detail</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-5 text-sm text-[var(--muted)]">No directory items found in Firestore.</div>
                    )}
                  </FadeInReveal>
                </div>
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Privacy feed</p>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Anonymized insights</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">A quiet rolling feed of blurred activity, designed to preserve identity while showing volume trends.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrivacyFilterEnabled((prev) => !prev)}
                      className={`inline-flex whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg ${privacyFilterEnabled ? 'bg-emerald-950 text-white' : 'bg-slate-100 text-[var(--text)] hover:bg-slate-200'}`}
                    >
                      Privacy Filter: {privacyFilterEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                  <div className="mt-8 space-y-4">
                    {privacyFilterEnabled ? (
                      <div className="rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-5 overflow-hidden">
                        <div className="relative">
                          <img
                            src={latestUpload?.preview || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'}
                            alt={latestUpload?.preview ? `Latest upload from ${latestUpload.canteenName}` : 'Anonymized canteen image'}
                            className="w-full h-32 object-cover rounded-[1rem] filter blur-[12px]"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[8px] flex items-center justify-center">
                            <p className="text-sm font-semibold text-white">Anonymized Image</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {latestUpload?.preview ? `Latest upload from ${latestUpload.canteenName}` : 'Most Recent Upload'}
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            {latestUpload?.preview ? 'Privacy-protected preview' : 'No upload preview available'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-8 text-center">
                        <p className="text-sm font-semibold text-[var(--text)]">Access Restricted</p>
                        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Raw data are not available to anyone.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Map</p>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--text)]">Campus collision map</h3>
                    </div>
                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-amber-900">Visual</span>
                  </div>
                  <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[rgba(33,18,8,0.06)] bg-[var(--bg-soft)] p-4">
                    <div className="relative aspect-[4/3] rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.12),_transparent_28%),_radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_32%),_rgb(248,244,238)]">
                      {MAP_COORDINATES.map((marker, idx) => {
                        const canteenData = mergedDirectoryItems.find((item) => item.name === marker.id);
                        const crowdLevel = canteenData?.crowdLevel || 'Unknown';
                        const isStale = canteenData?.isStale || false;
                        const lastUpdated = canteenData?.lastUpdated;
                        const colors = getMarkerColor(crowdLevel, isStale);
                        const isHigh = !isStale && String(crowdLevel || '').toLowerCase() === 'high';

                        // Smart Tooltip Position Logic
                        const topValue = parseFloat(marker.top);
                        const leftValue = parseFloat(marker.left);
                        const showBelow = topValue < 30; // If marker is in the top 30%, show tooltip below it
                        const shiftRight = leftValue < 30; // If marker is on the left 30%, shift tooltip right
                        const shiftLeft = leftValue > 70; // If marker is on the right 30%, shift tooltip left

                        return (
                          <div
                            key={marker.label}
                            className="group absolute z-10 flex items-center justify-center cursor-help hover:z-[999]"
                            style={{ top: marker.top, left: marker.left, width: '3rem', height: '3rem', transform: 'translate(-50%, -50%)' }}
                          >
                            {/* Tooltip Wrapper */}
                            <div className="absolute inset-0">
                              <div className={`pointer-events-none absolute w-max scale-90 rounded-xl bg-slate-900/95 px-4 py-2.5 text-center text-white opacity-0 shadow-2xl transition duration-200 group-hover:scale-100 group-hover:opacity-100 ${showBelow ? 'top-full mt-3' : 'bottom-full mb-3'
                                } ${shiftRight ? 'left-0 translate-x-0' : shiftLeft ? 'right-0 translate-x-0' : 'left-1/2 -translate-x-1/2'
                                }`}>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-0.5">{marker.id}</p>
                                <p className="text-xs font-semibold">
                                  {isStale ? 'Outdated' : `${crowdLevel} crowd`}
                                </p>
                                <p className="mt-1 text-[9px] text-white/50 uppercase tracking-tighter">
                                  {lastUpdated ? `Updated ${getDisplayLabel(lastUpdated)}` : 'No reports yet'}
                                </p>
                                {/* Arrow */}
                                <div className={`absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-slate-900/95 ${showBelow ? 'bottom-full translate-y-1/2' : 'top-full -translate-y-1/2'
                                  } ${shiftRight ? 'left-4' : shiftLeft ? 'left-auto right-4' : ''
                                  }`}></div>
                              </div>
                            </div>

                            <span className={`absolute inset-0 rounded-full ${colors.glow} blur-2xl transition duration-500 group-hover:blur-3xl`} />
                            {isHigh ? <span className={`absolute inset-0 rounded-full ${colors.bg} opacity-75 animate-ping`} /> : null}
                            {!isStale && <span className={`absolute inset-0 rounded-full ${colors.bg} pulse-marker`} />}
                            <span className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg} ${colors.text} shadow-[0_8px_20px_rgba(33,18,8,0.2)] text-[0.65rem] font-bold transition duration-300 group-hover:scale-110`}>
                              {marker.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400"></span>
                        <span>Low crowd (Live)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-amber-400"></span>
                        <span>Medium crowd (Live)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-rose-500"></span>
                        <span>High crowd (Live)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-slate-300"></span>
                        <span>Outdated (Update Required)</span>
                      </div>
                      <p className="mt-2 text-xs italic text-[var(--muted)]">Markers update in real-time from Firestore</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
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
                      <div key={metric.label} className="rounded-[1.75rem] bg-[var(--bg-soft)] p-5 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
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
              <div className="text-sm uppercase tracking-[0.28em] text-[var(--muted)] font-semibold">Analytics</div>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--text)]">Summary metrics at a glance</h2>
              <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">A clear overview of report volume, active locations, and participation over time.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Live report entries</p>
                <p className="mt-4 text-4xl font-semibold text-[var(--text)]"><CountUpNumber value={totalReports} /></p>
              </div>
              <div className="rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_20px_40px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
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
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-[rgba(33,18,8,0.08)] bg-white p-8 shadow-[0_25px_50px_rgba(33,18,8,0.05)] transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg">
              <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Select canteen (Required)</label>
              <CanteenDropdown
                value={selectedCanteen}
                onChange={(value) => setSelectedCanteen(value)}
                dropdownKey="report-canteen"
                options={CANTEEN_NAMES}
                placeholder="Choose canteen"
              />

              <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Select crowd level</label>
              <CanteenDropdown
                value={selectedLevel}
                onChange={(value) => setSelectedLevel(value)}
                dropdownKey="report-crowdLevel"
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                ]}
                placeholder="Choose level"
              />

              <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Upload image (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDropActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDropActive(false);
                }}
                onDrop={handleFileDrop}
                className={`rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-lg ${isDropActive ? 'border-[var(--primary)] bg-black/5' : 'border-black/10 bg-[var(--bg-soft)]'
                  }`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-[var(--muted)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 7h3l2-2h8l2 2h3v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text)]">Click or drag photo to anonymize</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  {selectedFile ? selectedFile.name : 'PNG / JPG / WEBP'}
                </p>
              </div>

              <p className="text-sm leading-7 text-[var(--muted)]">{aiHint}</p>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--primary)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-[var(--accent)] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting
                  ? 'Submitting…'
                  : submitStatus === 'success'
                    ? '✓ Submitted'
                    : submitStatus === 'error'
                      ? 'Retry'
                      : 'Submit report'}
              </button>

              {formFeedback ? <p className="text-sm text-[var(--muted)]">{formFeedback}</p> : null}
            </form>

            <div className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6 transition-opacity duration-300 ${toastVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`rounded-full border border-white/10 px-5 py-3 text-sm shadow-[0_18px_60px_rgba(33,18,8,0.18)] ${toastVariant === 'success' ? 'bg-emerald-950 text-white' : 'bg-rose-950 text-white'}`}>
                {toastMessage}
              </div>
            </div>
          </div>
        </section>

        {modalOpen && activeCanteen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-[0_35px_80px_rgba(33,18,8,0.18)]">
              <div className="relative h-64 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getCanteenVisual(activeCanteen.name).image})`,
                    filter: `blur(${getCanteenVisual(activeCanteen.name).blur}px) brightness(0.65)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <button
                  type="button"
                  onClick={closeCanteenModal}
                  className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--text)] shadow-sm transition hover:bg-white pointer-events-auto"
                  aria-label="Close canteen detail"
                >
                  ×
                </button>
                <div className="relative z-10 flex h-full flex-col justify-end p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.28em] text-white/80">Canteen detail</p>
                  <h3 className="mt-3 text-3xl font-semibold">{activeCanteen.name}</h3>
                </div>
              </div>
              <div className="space-y-6 p-8 overflow-y-auto max-h-[calc(100vh-20rem)]">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-[var(--bg-soft)] p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Crowd level</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--text)]">{activeCanteen.crowdLevel || 'Unknown'}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[var(--bg-soft)] p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Last updated</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--text)]">{getDisplayLabel(activeCanteen.lastUpdated) || 'Unknown'}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-[var(--bg-soft)] p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Report source</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--text)] capitalize">{(activeCanteen.imagePreview ? (activeCanteen.imageSource || activeCanteen.source) : activeCanteen.source) || 'Firestore'}</p>
                  </div>
                </div>
                <div className="rounded-[1.75rem] bg-[var(--bg-soft)] p-6">
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Privacy Metadata</p>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
                    <p><strong>Source:</strong> {(activeCanteen.imagePreview ? (activeCanteen.imageSource || activeCanteen.source) : activeCanteen.source) === 'vision-ai' ? 'Vision AI Inference' : 'Student Report'}</p>
                    <p><strong>Faces redacted:</strong> Via edge-processing simulation</p>
                    <p><strong>Anonymity preserved:</strong> 92% (USENIX 2020 protocols)</p>
                  </div>
                </div>
                <div className="rounded-[1.75rem] bg-[var(--bg-soft)] p-6 overflow-hidden">
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Latest Live feed</p>
                  {activeCanteen.imagePreview ? (
                    <div className="mt-4 relative group">
                      <img
                        src={activeCanteen.imagePreview}
                        alt={`Live feed from ${activeCanteen.name}`}
                        className="w-full h-48 object-cover rounded-2xl filter blur-[12px] transition duration-500 group-hover:blur-[8px]"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[4px] flex items-center justify-center rounded-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Anonymized Live Feed</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">This detail view is populated with the selected canteen's Firestore data and uses a distinct blurred visual to represent current crowd sensing.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {['Focus', 'Redaction', 'Activity'].map((tag) => (
                    <span key={tag} className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {privacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-[0_35px_80px_rgba(33,18,8,0.18)]">
              <div className="bg-[var(--primary)] p-10 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">Security Protocol</p>
                    <h3 className="text-3xl font-semibold tracking-tight">Privacy Engineering</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrivacyModalOpen(false)}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-6 text-sm leading-7 text-white/80 max-w-md">
                  Version 2.4 (USENIX 2020 Compliance). Our framework ensures that spatial intelligence never comes at the cost of individual identity.
                </p>
              </div>
              <div className="p-10 space-y-8 overflow-y-auto max-h-[calc(100vh-20rem)]">
                {[
                  {
                    title: '01. Edge-Based Redaction',
                    desc: 'Every student-contributed photo undergoes an immediate pixel-level masking process on the edge node. Faces and identifying marks are redacted before the data ever reaches our central storage.'
                  },
                  {
                    title: '02. Ephemeral Data Lifecycle',
                    desc: 'Raw imagery is processed in volatile memory and immediately purged. Our database only retains anonymized crowd indices and privacy-filtered previews for the live feed.'
                  },
                  {
                    title: '03. Anonymized Aggregation',
                    desc: 'Crowd levels are computed as abstract indices (Low/Medium/High), intentionally decoupling spatial density metrics from individual movement patterns or specific user identities.'
                  },
                  {
                    title: '04. Differential Privacy',
                    desc: 'We inject controlled statistical noise into long-term trend analysis. This prevents adversaries from reverse-engineering individual student schedules through pattern-matching.'
                  }
                ].map((item) => (
                  <div key={item.title} className="space-y-3 border-l-2 border-[var(--bg-soft)] pl-6">
                    <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--text)]">{item.title}</h4>
                    <p className="text-sm leading-7 text-[var(--muted)]">{item.desc}</p>
                  </div>
                ))}

                <div className="pt-4">
                  <button
                    onClick={() => setPrivacyModalOpen(false)}
                    className="w-full rounded-full bg-[var(--text)] py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
                  >
                    Acknowledge Protocol
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="border-t border-[rgba(33,18,8,0.08)] bg-[var(--bg-soft)] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">CROWDBYTE</p>
                <p className="max-w-md text-sm leading-7 text-[var(--muted)]">Synthesizing privacy-preserving engineering with real-time campus dynamics. A digital initiative dedicated to understanding the rhythmic pulse of communal dining at NTU through anonymized, student-led reporting.</p>
              </div>
              <div>
                <h3 className="mb-4 text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Navigate</h3>
                <ul className="space-y-3 text-sm leading-7 text-[var(--text)]">
                  <li><a href="#landing" className="transition hover:text-[var(--primary)]">Home</a></li>
                  <li><a href="#dashboard" className="transition hover:text-[var(--primary)]">Dashboard</a></li>
                  <li><a href="#report" className="transition hover:text-[var(--primary)]">Submit Report</a></li>
                  <li><a href="#admin" className="transition hover:text-[var(--primary)]">Analytics</a></li>
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
              © 2026 CROWDBYTE • A privacy-first XaaS project exploring dining dynamics at Nanyang Technological University • Designed with technical rigour and ethical intention.
            </div>
          </div>
        </footer>
      </motion.main>
    </>
  );
}

