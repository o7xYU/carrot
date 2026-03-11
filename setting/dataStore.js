const DEFAULT_DIR_NAME = 'carrot';
const DEFAULT_FILE_NAME = 'settings.json';
const DATA_VERSION = 1;

const MANAGED_KEYS = Object.freeze([
    'cip_sticker_data',
    'cip_theme_data_v1',
    'cip_last_active_theme_v1',
    'cip_avatar_profiles_v1',
    'cip_last_avatar_profile_v1',
    'cip_frame_profiles_v1',
    'cip_last_frame_profile_v1',
    'cip_custom_command_v1',
    'cip_sync_filename_v1',
    'cip_tts_settings_v1',
    'cip_regex_enabled_v1',
    'cip_regex_rule_settings_v1',
    'cip_regex_custom_rules_v1',
    'cip_regex_profiles_v1',
    'cip_alarm_data_v1',
]);

function buildDefaultState() {
    return {
        version: DATA_VERSION,
        updatedAt: new Date().toISOString(),
        records: {},
    };
}

function isValidState(candidate) {
    return (
        !!candidate &&
        typeof candidate === 'object' &&
        typeof candidate.records === 'object' &&
        !Array.isArray(candidate.records)
    );
}

function normalizeFileName(fileName) {
    const raw = `${fileName || ''}`.trim();
    if (!raw) return DEFAULT_FILE_NAME;
    return raw.endsWith('.json') ? raw : `${raw}.json`;
}

export function createDataStore({
    localStorageRef = typeof localStorage !== 'undefined' ? localStorage : null,
    fileName = DEFAULT_FILE_NAME,
    rootDirName = DEFAULT_DIR_NAME,
    consoleRef = console,
} = {}) {
    let state = buildDefaultState();
    let saveQueue = Promise.resolve();
    let dirHandle = null;
    let currentFileName = normalizeFileName(fileName);

    async function getDirHandle() {
        if (!navigator?.storage?.getDirectory) return null;
        if (dirHandle) return dirHandle;
        const root = await navigator.storage.getDirectory();
        dirHandle = await root.getDirectoryHandle(rootDirName, { create: true });
        return dirHandle;
    }

    async function getFileHandle(targetFileName = currentFileName) {
        const dir = await getDirHandle();
        if (!dir) return null;
        return dir.getFileHandle(normalizeFileName(targetFileName), { create: true });
    }

    async function writeStateToFile(targetFileName = currentFileName) {
        const handle = await getFileHandle(targetFileName);
        if (!handle) return false;
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(state, null, 2));
        await writable.close();
        return true;
    }

    function syncStateToLocalStorage() {
        if (!localStorageRef) return;
        MANAGED_KEYS.forEach((key) => {
            const value = state.records[key];
            if (typeof value === 'string') {
                localStorageRef.setItem(key, value);
            } else {
                localStorageRef.removeItem(key);
            }
        });
    }

    function hydrateFromLocalStorage() {
        if (!localStorageRef) return;
        const next = {};
        MANAGED_KEYS.forEach((key) => {
            const value = localStorageRef.getItem(key);
            if (typeof value === 'string') {
                next[key] = value;
            }
        });
        state.records = next;
        state.updatedAt = new Date().toISOString();
    }

    async function queueSave(targetFileName = currentFileName) {
        state.updatedAt = new Date().toISOString();
        saveQueue = saveQueue
            .catch(() => {})
            .then(async () => {
                syncStateToLocalStorage();
                try {
                    await writeStateToFile(targetFileName);
                } catch (error) {
                    consoleRef.warn('Carrot 数据文件写入失败，已保留在 localStorage。', error);
                }
            });
        await saveQueue;
    }

    async function load_data(targetFileName = currentFileName) {
        currentFileName = normalizeFileName(targetFileName);
        const handle = await getFileHandle(currentFileName);
        if (!handle) {
            hydrateFromLocalStorage();
            return state;
        }

        const file = await handle.getFile();
        const text = await file.text();

        if (!text.trim()) {
            hydrateFromLocalStorage();
            await queueSave(currentFileName);
            return state;
        }

        try {
            const parsed = JSON.parse(text);
            if (!isValidState(parsed)) throw new Error('invalid schema');
            state = {
                version: Number(parsed.version) || DATA_VERSION,
                updatedAt: parsed.updatedAt || new Date().toISOString(),
                records: { ...parsed.records },
            };
            syncStateToLocalStorage();
        } catch (error) {
            consoleRef.warn('Carrot 数据文件损坏，已执行兜底恢复。', error);
            state = buildDefaultState();
            hydrateFromLocalStorage();
            await queueSave(currentFileName);
        }

        return state;
    }

    async function save_data() {
        await queueSave(currentFileName);
        return state;
    }

    async function setFileName(fileNameToSet, { reload = true } = {}) {
        const nextFileName = normalizeFileName(fileNameToSet);
        currentFileName = nextFileName;
        if (reload) {
            await load_data(nextFileName);
        }
        return currentFileName;
    }

    function getFileName() {
        return currentFileName;
    }

    async function create_item(key, value) {
        if (Object.prototype.hasOwnProperty.call(state.records, key)) {
            throw new Error(`记录已存在: ${key}`);
        }
        state.records[key] = value;
        await queueSave();
        return value;
    }

    async function update_item(key, value) {
        state.records[key] = value;
        await queueSave();
        return value;
    }

    async function delete_item(key) {
        delete state.records[key];
        await queueSave();
    }

    function get_item(key) {
        return Object.prototype.hasOwnProperty.call(state.records, key)
            ? state.records[key]
            : null;
    }

    function list_items() {
        return { ...state.records };
    }

    function isManagedKey(key) {
        return MANAGED_KEYS.includes(key);
    }

    function createStorageAdapter() {
        return {
            getItem(key) {
                if (isManagedKey(key)) {
                    return get_item(key);
                }
                return localStorageRef?.getItem(key) ?? null;
            },
            setItem(key, value) {
                if (!isManagedKey(key)) {
                    localStorageRef?.setItem(key, value);
                    return;
                }
                void update_item(key, value);
            },
            removeItem(key) {
                if (!isManagedKey(key)) {
                    localStorageRef?.removeItem(key);
                    return;
                }
                void delete_item(key);
            },
        };
    }

    function exportSnapshot() {
        return {
            version: state.version,
            updatedAt: state.updatedAt,
            records: { ...state.records },
        };
    }

    async function importSnapshot(payload) {
        if (!payload || typeof payload !== 'object') {
            throw new Error('无效数据');
        }

        if (payload.records && isValidState(payload)) {
            state = {
                version: Number(payload.version) || DATA_VERSION,
                updatedAt: payload.updatedAt || new Date().toISOString(),
                records: { ...payload.records },
            };
            await queueSave();
            return;
        }

        const legacy = {};
        MANAGED_KEYS.forEach((key) => {
            const value = payload[key];
            if (typeof value === 'string') {
                legacy[key] = value;
            }
        });
        state.records = legacy;
        await queueSave();
    }

    return {
        load_data,
        save_data,
        setFileName,
        getFileName,
        create_item,
        update_item,
        delete_item,
        get_item,
        list_items,
        createStorageAdapter,
        exportSnapshot,
        importSnapshot,
        managedKeys: MANAGED_KEYS,
    };
}
