export function initSyncSettings({
    document,
    elements,
}) {
    if (!elements) {
        throw new Error('Sync settings require element references');
    }

    const {
        importSettingsInput,
        exportBtnPanel,
        loadPathBtn,
        savePathBtn,
        syncPathInput,
    } = elements;

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
            ];

            keysToExport.forEach((key) => {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    settingsToExport[key] = value;
                }
            });

            if (Object.keys(settingsToExport).length === 0) {
                alert('没有可导出的设置。');
                return;
            }

            const jsonString = JSON.stringify(settingsToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            if (customFilename) {
                a.download = customFilename;
            } else {
                const date = new Date();
                const dateString = `${date
                    .getFullYear()
                    .toString()}-${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}-${date
                    .getDate()
                    .toString()
                    .padStart(2, '0')}`;
                a.download = `carrot-input-panel-settings-${dateString}.json`;
            }

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('导出设置时发生错误:', error);
            alert('导出失败，请查看控制台获取更多信息。');
        }
    }

    function importSettings(event) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (file.type !== 'application/json') {
            alert('请选择一个有效的 .json 配置文件。');
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
                    localStorage.setItem(key, importedSettings[key]);
                    settingsApplied = true;
                }

                if (settingsApplied) {
                    alert('设置已成功导入！页面将自动刷新以应用所有更改。');
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    alert('导入的文件不包含任何有效的设置。');
                }
            } catch (error) {
                console.error('导入设置时发生错误:', error);
                alert('导入失败，文件格式可能不正确。请查看控制台获取更多信息。');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = function () {
            alert('读取文件时发生错误。');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    function saveToPath() {
        const filename = syncPathInput?.value.trim();
        if (!filename) {
            alert('请输入一个有效的文件名。');
            return;
        }

        localStorage.setItem('cip_sync_filename_v1', filename);
        exportSettings(filename);
    }

    function loadSavedFilename() {
        const savedFilename = localStorage.getItem('cip_sync_filename_v1');
        if (savedFilename && syncPathInput) {
            syncPathInput.value = savedFilename;
        }
    }

    importSettingsInput?.addEventListener('change', importSettings);
    exportBtnPanel?.addEventListener('click', () => exportSettings());
    savePathBtn?.addEventListener('click', saveToPath);
    loadPathBtn?.addEventListener('click', () => {
        importSettingsInput?.click();
    });

    return {
        exportSettings,
        importSettings,
        saveToPath,
        loadSavedFilename,
    };
}
