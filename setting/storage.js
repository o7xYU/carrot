const SETTINGS_FILENAME = 'settings.json';
const SETTINGS_URL = new URL('../settings.json', import.meta.url);

let sharedStore = null;

function canUseOpfs() {
    return (
        typeof navigator !== 'undefined' &&
        navigator.storage &&
        typeof navigator.storage.getDirectory === 'function'
    );
}

function createEmptyStore() {
    return {
        data: {},
        loaded: false,
    };
}

function normalizeSettings(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const normalized = {};
    Object.keys(raw).forEach((key) => {
        if (raw[key] === undefined) return;
        normalized[key] = String(raw[key]);
    });
    return normalized;
}

async function readFromOpfs() {
    if (!canUseOpfs()) return null;
    try {
        const root = await navigator.storage.getDirectory();
        const handle = await root.getFileHandle(SETTINGS_FILENAME, {
            create: true,
        });
        const file = await handle.getFile();
        if (!file || file.size === 0) return {};
        const text = await file.text();
        if (!text) return {};
        return JSON.parse(text);
    } catch (error) {
        console.warn('胡萝卜插件：读取 settings.json 失败', error);
        return null;
    }
}

async function readFromFetch() {
    try {
        const response = await fetch(SETTINGS_URL, { cache: 'no-store' });
        if (!response.ok) return null;
        const text = await response.text();
        if (!text) return {};
        return JSON.parse(text);
    } catch (error) {
        console.warn('胡萝卜插件：读取默认 settings.json 失败', error);
        return null;
    }
}

async function writeToOpfs(payload) {
    if (!canUseOpfs()) return false;
    try {
        const root = await navigator.storage.getDirectory();
        const handle = await root.getFileHandle(SETTINGS_FILENAME, {
            create: true,
        });
        const writable = await handle.createWritable();
        await writable.write(payload);
        await writable.close();
        return true;
    } catch (error) {
        console.warn('胡萝卜插件：写入 settings.json 失败', error);
        return false;
    }
}

function downloadSettings(payload, documentRef) {
    if (!documentRef) return false;
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = documentRef.createElement('a');
    link.href = url;
    link.download = SETTINGS_FILENAME;
    documentRef.body.appendChild(link);
    link.click();
    documentRef.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
}

function createSettingsStore({
    documentRef = typeof document !== 'undefined' ? document : null,
} = {}) {
    const store = createEmptyStore();
    let saveInFlight = null;
    let pendingSave = false;

    async function load() {
        let data = await readFromOpfs();
        if (data === null) {
            data = await readFromFetch();
        }
        store.data = normalizeSettings(data || {});
        store.loaded = true;
        return store.data;
    }

    async function persist({ allowDownload = false } = {}) {
        const payload = JSON.stringify(store.data, null, 2);
        if (await writeToOpfs(payload)) return true;
        if (!allowDownload) return false;
        return downloadSettings(payload, documentRef);
    }

    function schedulePersist() {
        if (!canUseOpfs()) return;
        if (saveInFlight) {
            pendingSave = true;
            return;
        }
        saveInFlight = persist({ allowDownload: false }).finally(() => {
            saveInFlight = null;
            if (pendingSave) {
                pendingSave = false;
                schedulePersist();
            }
        });
    }

    function getItem(key) {
        if (!store.loaded) return null;
        return Object.prototype.hasOwnProperty.call(store.data, key)
            ? store.data[key]
            : null;
    }

    function setItem(key, value) {
        store.data[key] = String(value);
        schedulePersist();
    }

    function removeItem(key) {
        delete store.data[key];
        schedulePersist();
    }

    function replaceAllSettings(settings) {
        store.data = normalizeSettings(settings || {});
        schedulePersist();
    }

    function getAllSettings() {
        return { ...store.data };
    }

    async function loadFromFile() {
        await load();
        return store.data;
    }

    async function saveToFile(options = {}) {
        return persist(options);
    }

    return {
        ready: load(),
        getItem,
        setItem,
        removeItem,
        replaceAllSettings,
        getAllSettings,
        loadFromFile,
        saveToFile,
    };
}

export async function initSettingsStore(options) {
    if (!sharedStore) {
        sharedStore = createSettingsStore(options);
        await sharedStore.ready;
    }
    return sharedStore;
}

export function getSettingsStore() {
    return sharedStore;
}
