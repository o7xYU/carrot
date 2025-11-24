export function initSyncSettings(
    {
        importSettingsInput,
        savePathBtn,
        loadPathBtn,
        syncPathInput,
    },
    {
        documentRef = document,
        localStorageRef = localStorage,
        alertRef = (message) => alert(message),
    } = {},
) {
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
                const value = localStorageRef.getItem(key);
                if (value !== null) {
                    settingsToExport[key] = value;
                }
            });
            if (Object.keys(settingsToExport).length === 0) {
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
                let settingsApplied = false;
                for (const key in importedSettings) {
                    if (!Object.prototype.hasOwnProperty.call(importedSettings, key))
                        continue;
                    if (key === 'cip_button_position_v4') continue;
                    localStorageRef.setItem(key, importedSettings[key]);
                    settingsApplied = true;
                }
                if (settingsApplied) {
                    alertRef('设置已成功导入！页面将自动刷新以应用所有更改。');
                    setTimeout(() => getWindow()?.location.reload(), 500);
                } else {
                    alertRef('导入的文件不包含任何有效的设置。');
                }
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
        localStorageRef.setItem('cip_sync_filename_v1', filename);
        exportSettings(filename);
    }

    function loadFromPath() {
        importSettingsInput?.click();
    }

    importSettingsInput?.addEventListener('change', importSettings);
    savePathBtn?.addEventListener('click', saveToPath);
    loadPathBtn?.addEventListener('click', loadFromPath);

    const savedFilename = localStorageRef.getItem('cip_sync_filename_v1');
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
