// Import the names from your constants file
import { CANTEEN_NAMES } from './constants';

export function getCanteenId(name) {
    // Use the imported array from constants
    const namesArray = CANTEEN_NAMES;

    if (!namesArray || !name) return null;

    const index = namesArray.indexOf(name);
    return index >= 0 ? String(index + 1) : null;
}

export function normalizeLevel(value) {
    if (!value) return 'Unknown';
    const normalized = String(value).toLowerCase();
    if (normalized === 'low') return 'Low';
    if (normalized === 'medium') return 'Medium';
    if (normalized === 'high') return 'High';
    return 'Unknown';
}

export function simulateAIClassification(file) {
    if (!file) return 'Unknown';
    const mod = file.size % 3;
    if (mod === 0) return 'Low';
    if (mod === 1) return 'Medium';
    return 'High';
}