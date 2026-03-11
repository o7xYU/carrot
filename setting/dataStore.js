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

const API_BASE_CANDIDATES = [
    '/api/plugins/carrot/settings',
    '/api/extensions/carrot/settings',
];

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
    fetchRef = typeof fetch !== 'undefined' ? fetch : null,
    consoleRef = console,
    fileName = DEFAULT_FILE_NAME,
} = {}) {
    let state = buildDefaultState();
    let saveQueue = Promise.resolve();
    let currentFileName = normalizeFileName(fileName);
    let workingApiBase = null;

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

    async function requestApi(base, method, payload = null) {
        if (!fetchRef) return null;
        const url = `${base}?file=${encodeURIComponent(currentFileName)}`;
        const options = { method, headers: {} };
        if (payload !== null) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(payload);
        }
        const response = await fetchRef(url, options);
        return response;
    }

    async function tryApi(method, payload = null) {
        if (!fetchRef) return { ok: false, reason: 'fetch unavailable' };
        const candidates = workingApiBase
            ? [workingApiBase, ...API_BASE_CANDIDATES.filter((x) => x !== workingApiBase)]
            : [...API_BASE_CANDIDATES];

        for (const base of candidates) {
            try {
                const response = await requestApi(base, method, payload);
                if (!response) continue;
                if (response.ok) {
                    workingApiBase = base;
                    return { ok: true, response, base };
                }
                if (response.status === 404 || response.status === 405) {
                    continue;
                }
                const text = await response.text().catch(() => '');
                return {
                    ok: false,
                    reason: `HTTP ${response.status} ${text}`,
                };
            } catch (error) {
                // 尝试下一个候选端点
            }
        }

        return { ok: false, reason: 'no SillyTavern endpoint available' };
    }

    async function saveToServerFile() {
        const result = await tryApi('PUT', state);
        if (!result.ok) {
            throw new Error(result.reason || 'server save failed');
        }
    }

    async function queueSave() {
        state.updatedAt = new Date().toISOString();
        saveQueue = saveQueue
            .catch(() => {})
            .then(async () => {
                syncStateToLocalStorage();
                await saveToServerFile();
            });
        await saveQueue;
    }

    async function load_data(targetFileName = currentFileName) {
        currentFileName = normalizeFileName(targetFileName);
        const result = await tryApi('GET');

        if (!result.ok) {
            hydrateFromLocalStorage();
            try {
                await queueSave();
            } catch (error) {
                consoleRef.warn('Carrot 无法访问酒馆文件接口，已退回 localStorage。', error);
            }
            return state;
        }

        try {
            const payload = await result.response.json();
            if (!isValidState(payload)) {
                throw new Error('invalid schema');
            }
            state = {
                version: Number(payload.version) || DATA_VERSION,
                updatedAt: payload.updatedAt || new Date().toISOString(),
                records: { ...payload.records },
            };
            syncStateToLocalStorage();
        } catch (error) {
            consoleRef.warn('Carrot 服务端 settings.json 损坏，使用本地兜底重建。', error);
            state = buildDefaultState();
            hydrateFromLocalStorage();
            await queueSave();
        }

        return state;
    }

    async function save_data() {
        try {
            await queueSave();
        } catch (error) {
            consoleRef.warn('Carrot 写入酒馆文件失败，仅保留 localStorage。', error);
            syncStateToLocalStorage();
        }
        return state;
    }

    async function setFileName(fileNameToSet, { reload = true } = {}) {
        currentFileName = normalizeFileName(fileNameToSet);
        if (reload) {
            await load_data(currentFileName);
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
        await save_data();
        return value;
    }

    async function update_item(key, value) {
        state.records[key] = value;
        await save_data();
        return value;
    }

    async function delete_item(key) {
        delete state.records[key];
        await save_data();
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
                if (isManagedKey(key)) return get_item(key);
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
            await save_data();
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
        await save_data();
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
