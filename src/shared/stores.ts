import { writable, type Writable } from "svelte/store";
import { HaloCookies, HaloValidateResponse } from "./util/types";
/**
 * Creates a persistent Svelte store synced with chrome.storage.sync.
 * All extension contexts (popup, background, etc.) will stay in sync.
 * Uses debouncing to prevent exceeding storage quotas.
 * @see https://github.com/wxt-dev/examples/tree/main/examples/svelte-custom-store
 */
function createPersistentStore<T>(key: string, initial: T): Writable<T> {
  const store = writable<T>(initial);
  let debounceTimer: NodeJS.Timeout | null = null;
  let isInitialized = false;

  // Load from chrome.storage on init
  chrome.storage.sync.get([key], (result: any) => {
    if (result[key] !== undefined) {
      store.set(result[key]);
    }
    isInitialized = true;
  });

  // Subscribe to store changes and persist to chrome.storage with debouncing
  store.subscribe((value: any) => {
    // Skip writes during initialization to prevent race conditions
    if (!isInitialized) return;
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Debounce storage writes to prevent quota issues
    debounceTimer = setTimeout(() => {
      chrome.storage.sync.set({ [key]: value }).catch((error) => {
        console.warn(`Failed to write to chrome.storage for key "${key}":`, error);
      });
    }, 100); // 100ms debounce
  });

  // Listen for changes from other contexts
  chrome.storage.onChanged.addListener((changes: any, area: any) => {
    if (area === 'sync' && changes[key]) {
      store.set(changes[key].newValue);
    }
  });

  return store;
}

// All application stores are defined and exported from here.
export const notionInfo = createPersistentStore<any>('notion_info', null);
export const haloCookies = createPersistentStore<HaloCookies | null>('halo_cookies', null);
export const haloInfo = createPersistentStore<HaloValidateResponse | null>('halo_info', null);
export const selectedClasses = createPersistentStore<Record<string, boolean>>('selected_classes', {}); 