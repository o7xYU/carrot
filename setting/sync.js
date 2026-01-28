import { getSettingsStore } from './storage.js';

export function initSyncSettings(
    {
        importSettingsInput,
        savePathBtn,
        loadPathBtn,
        syncPathInput,
    },
    {
        documentRef = document,
        settingsStore = getSettingsStore(),
        alertRef = (message) => alert(message),
    } = {},
) {
    const store = settingsStore;

    function exportSettings(customFilename = '') {
        try {
            const settingsToExport = {};
            const keysToExport = [
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
            ];
            keysToExport.forEach((key) => {
                const value = store?.getItem(key);
                if (value !== null) {
                    settingsToExport[key] = value;
                }
            });
            if (Object.keys(settingsToExport).length === 0) {
                alertRef('没有可导出的设置。');
                return;
            }
            if (!store?.saveToFile) {
                alertRef('当前环境无法写入 settings.json。');
                return;
            }
            store.saveToFile();
            if (customFilename) {
                alertRef(`设置已保存到 ${customFilename}。`);
            } else {
                alertRef('设置已保存到 settings.json。');
            }
        } catch (error) {
            console.error('导出设置时发生错误:', error);
            alertRef('导出失败，请查看控制台获取更多信息。');
        }
    }

    function importSettings(event) {
        event?.preventDefault?.();
        if (!store?.loadFromFile) {
            alertRef('当前环境无法读取 settings.json。');
            return;
        }
        store
            .loadFromFile()
            .then(() => {
                alertRef('已从 settings.json 读取设置，页面将刷新应用。');
                setTimeout(() => getWindow()?.location.reload(), 500);
            })
            .catch((error) => {
                console.error('读取 settings.json 失败:', error);
                alertRef('读取 settings.json 失败，请查看控制台。');
            });
    }

    function getWindow() {
        return typeof window !== 'undefined' ? window : null;
    }

    function saveToPath() {
        const filename = (syncPathInput?.value || 'settings.json').trim();
        if (!filename) {
            alertRef('请输入一个有效的文件名。');
            return;
        }
        exportSettings(filename);
    }

    function loadFromPath() {
        importSettings();
    }

    importSettingsInput?.addEventListener('change', importSettings);
    savePathBtn?.addEventListener('click', saveToPath);
    loadPathBtn?.addEventListener('click', loadFromPath);

    if (syncPathInput) {
        syncPathInput.value = 'settings.json';
        syncPathInput.readOnly = true;
    }

    return {
        exportSettings,
        importSettings,
        saveToPath,
        loadFromPath,
    };
}
