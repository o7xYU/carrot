const EXTENSION_KEY = 'cip_quick_input_settings';
const memoryStore = {};

function getExtensionSettings() {
    if (typeof window === 'undefined') return memoryStore;
    const extSettings = window.extension_settings;
    if (!extSettings) return memoryStore;
    if (!extSettings[EXTENSION_KEY]) {
        extSettings[EXTENSION_KEY] = {};
    }
    return extSettings[EXTENSION_KEY];
}

function persistExtensionSettings() {
    if (typeof window === 'undefined') return;
    if (typeof window.saveSettingsDebounced === 'function') {
        window.saveSettingsDebounced();
    } else if (window.script && typeof window.script.saveSettingsDebounced === 'function') {
        window.script.saveSettingsDebounced();
    }
}

function hasLocalStorage() {
    try {
        return typeof localStorage !== 'undefined';
    } catch (error) {
        return false;
    }
}

function readLocalStorage(key) {
    if (!hasLocalStorage()) return null;
    return localStorage.getItem(key);
}

function writeLocalStorage(key, value) {
    if (!hasLocalStorage()) return;
    if (value === undefined || value === null) {
        localStorage.removeItem(key);
        return;
    }
    localStorage.setItem(key, value);
}

function removeLocalStorage(key) {
    if (!hasLocalStorage()) return;
    localStorage.removeItem(key);
}

export const persistentStorage = {
    getStore() {
        return getExtensionSettings();
    },
    getItem(key) {
        const store = getExtensionSettings();
        if (Object.prototype.hasOwnProperty.call(store, key)) {
            return store[key];
        }
        const legacyValue = readLocalStorage(key);
        if (legacyValue !== null && legacyValue !== undefined) {
            store[key] = legacyValue;
            persistExtensionSettings();
            return legacyValue;
        }
        return null;
    },
    setItem(key, value) {
        const normalized = value === undefined || value === null ? null : String(value);
        const store = getExtensionSettings();
        if (normalized === null) {
            delete store[key];
        } else {
            store[key] = normalized;
        }
        writeLocalStorage(key, normalized);
        persistExtensionSettings();
    },
    removeItem(key) {
        const store = getExtensionSettings();
        if (Object.prototype.hasOwnProperty.call(store, key)) {
            delete store[key];
        }
        removeLocalStorage(key);
        persistExtensionSettings();
    },
};
