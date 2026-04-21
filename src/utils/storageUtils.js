// ============================================
// storageUtils.js — localStorage helpers
// ============================================

const STORAGE_KEY = 'gearbox-symphony-save';

/**
 * Load saved progress from localStorage
 * @returns {object} Save data or default empty save
 */
export function loadProgress() {
  let save = getDefaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with default to ensure all schema keys exist (backwards compat)
      save = { ...save, ...parsed, bestTimes: parsed.bestTimes || save.bestTimes };
    }
  } catch (e) {
    console.warn('Failed to load save data:', e);
  }
  return save;
}

/**
 * Save progress to localStorage
 * @param {object} data — save data object
 */
export function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data:', e);
  }
}

/**
 * Get default save with all levels locked except level 1
 */
function getDefaultSave() {
  return {
    unlockedLevel: 1,
    stars: {},       // { "1": 3, "2": 2, ... }
    bestTimes: {},   // { "1": 45320,  "2": 105650, ... }
    settings: {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
    },
  };
}

/**
 * Clear all saved progress
 */
export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Save new best time if it's faster
 * @param {number} levelId 
 * @param {number} timeMs 
 * @returns {boolean} true if it was a new best time
 */
export function saveBestTime(levelId, timeMs) {
  const data = loadProgress();
  
  // Backwards compatibility for old saves
  if (!data.bestTimes) {
    data.bestTimes = {};
  }
  
  const currentBest = data.bestTimes[levelId];
  
  if (!currentBest || timeMs < currentBest) {
    data.bestTimes[levelId] = timeMs;
    saveProgress(data);
    return true;
  }
  return false;
}

/**
 * Format milliseconds to MM:SS.ms string
 */
export function formatTime(ms) {
  if (ms == null) return '--:--.--';
  
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  const mStr = minutes.toString().padStart(2, '0');
  const sStr = seconds.toString().padStart(2, '0');
  const msStr = centiseconds.toString().padStart(2, '0');
  
  return `${mStr}:${sStr}.${msStr}`;
}
