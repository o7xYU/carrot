import { SettingsStore } from './store.js';

const extension_settings =
    globalThis.extension_settings || (globalThis.extension_settings = {});

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function initSyncSettings(
    {
        importSettingsInput,
        savePathBtn,
        loadPathBtn,
        syncPathInput,
    },
    {
        documentRef = document,
        alertRef = (message) => alert(message),
        settingsStore = SettingsStore,
    } = {},
) {
    const settings = settingsStore.getSettings();

    function exportSettings(customFilename = '') {
        try {
            const settingsToExport = deepClone(extension_settings);
            if (!settingsToExport || Object.keys(settingsToExport).length === 0) {
                alertRef('没有可导出的设置。');
                return;
            }
            const jsonString = JSON.stringify(settingsToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = documentRef.createElement('a');
            link.href = url;
            if (customFilename) {
                link.download = customFilename;
            } else {
                const date = new Date();
                const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}-${date
                    .getDate()
                    .toString()
                    .padStart(2, '0')}`;
                link.download = `carrot-input-panel-settings-${dateString}.json`;
            }
            documentRef.body.appendChild(link);
            link.click();
            documentRef.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出设置时发生错误:', error);
            alertRef('导出失败，请查看控制台获取更多信息。');
        }
    }

    function importSettings(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/json') {
            alertRef('请选择一个有效的 .json 配置文件。');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedSettings = JSON.parse(e.target.result);
                if (
                    !importedSettings ||
                    typeof importedSettings !== 'object' ||
                    Array.isArray(importedSettings)
                ) {
                    alertRef('导入的文件格式不正确。');
                    return;
                }
                const keys = Object.keys(importedSettings);
                if (!keys.length) {
                    alertRef('导入的文件不包含任何有效的设置。');
                    return;
                }
                keys.forEach((key) => {
                    extension_settings[key] = importedSettings[key];
                });
                settingsStore.saveSettings();
                alertRef('设置已成功导入！页面将自动刷新以应用所有更改。');
                setTimeout(() => getWindow()?.location.reload(), 500);
            } catch (error) {
                console.error('导入设置时发生错误:', error);
                alertRef('导入失败，文件格式可能不正确。请查看控制台获取更多信息。');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = function () {
            alertRef('读取文件时发生错误。');
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    function getWindow() {
        return typeof window !== 'undefined' ? window : null;
    }

    function saveToPath() {
        const filename = (syncPathInput?.value || '').trim();
        if (!filename) {
            alertRef('请输入一个有效的文件名。');
            return;
        }
        settings.syncFilename = filename;
        settingsStore.saveSettings();
        exportSettings(filename);
    }

    function loadFromPath() {
        importSettingsInput?.click();
    }

    importSettingsInput?.addEventListener('change', importSettings);
    savePathBtn?.addEventListener('click', saveToPath);
    loadPathBtn?.addEventListener('click', loadFromPath);

    const savedFilename = settings.syncFilename;
    if (savedFilename && syncPathInput) {
        syncPathInput.value = savedFilename;
    }

    return {
        exportSettings,
        importSettings,
        saveToPath,
        loadFromPath,
    };
}
