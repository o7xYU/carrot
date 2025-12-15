const extension_settings =
    globalThis.extension_settings || (globalThis.extension_settings = {});
const script = globalThis.script || {};
const EXT_NAME = 'carrot_extension';

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

const SettingsStore = {
    defaultSettings: Object.freeze({
        unsplashAccessKey: '',
        unsplashCache: {},
        stickerData: {},
        avatarProfiles: {},
        frameProfiles: {},
        lastAvatarProfile: '',
        lastFrameProfile: '',
        themeData: {},
        lastActiveTheme: 'default',
        customCommand: '',
        alarmData: null,
        syncFilename: '',
        buttonPosition: null,
        ttsSettings: {
            key: '',
            endpoint: '',
            model: '',
            voice: '',
        },
    }),

    getSettings() {
        if (!extension_settings[EXT_NAME]) {
            extension_settings[EXT_NAME] = deepClone(this.defaultSettings);
        }
        const settings = extension_settings[EXT_NAME];
        for (const key of Object.keys(this.defaultSettings)) {
            if (settings[key] === undefined) {
                settings[key] = deepClone(this.defaultSettings[key]);
            }
        }
        return settings;
    },

    saveSettings() {
        if (typeof script.saveSettingsDebounced === 'function') {
            script.saveSettingsDebounced();
        }
    },

    migrateFromLocalStorage() {
        if (typeof localStorage === 'undefined') return;
        const settings = this.getSettings();
        let migrated = false;

        const stickerRaw = localStorage.getItem('cip_sticker_data');
        if (stickerRaw) {
            try {
                const parsed = JSON.parse(stickerRaw);
                settings.stickerData = parsed && typeof parsed === 'object' ? parsed : {};
                migrated = true;
            } catch (error) {
                console.warn('[carrot] 迁移表情包数据失败', error);
            } finally {
                localStorage.removeItem('cip_sticker_data');
            }
        }

        const unsplashKey = localStorage.getItem('cip_unsplash_access_key_v1');
        if (unsplashKey !== null) {
            settings.unsplashAccessKey = unsplashKey || '';
            migrated = true;
            localStorage.removeItem('cip_unsplash_access_key_v1');
        }

        const cachePrefix = 'cip_unsplash_cache_v1:';
        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(cachePrefix)) continue;
            const query = key.substring(cachePrefix.length);
            try {
                const parsed = JSON.parse(localStorage.getItem(key));
                if (parsed && typeof parsed === 'object') {
                    settings.unsplashCache[query] = parsed;
                    migrated = true;
                }
            } catch (error) {
                console.warn('[carrot] 迁移 Unsplash 缓存失败', error);
            } finally {
                localStorage.removeItem(key);
            }
        }

        const avatarRaw = localStorage.getItem('cip_avatar_profiles_v1');
        if (avatarRaw) {
            try {
                const parsed = JSON.parse(avatarRaw);
                settings.avatarProfiles = parsed && typeof parsed === 'object' ? parsed : {};
                migrated = true;
            } catch (error) {
                console.warn('[carrot] 迁移头像配置失败', error);
            } finally {
                localStorage.removeItem('cip_avatar_profiles_v1');
            }
        }

        const frameRaw = localStorage.getItem('cip_frame_profiles_v1');
        if (frameRaw) {
            try {
                const parsed = JSON.parse(frameRaw);
                settings.frameProfiles = parsed && typeof parsed === 'object' ? parsed : {};
                migrated = true;
            } catch (error) {
                console.warn('[carrot] 迁移头像框配置失败', error);
            } finally {
                localStorage.removeItem('cip_frame_profiles_v1');
            }
        }

        const lastAvatar = localStorage.getItem('cip_last_avatar_profile_v1');
        if (lastAvatar !== null) {
            settings.lastAvatarProfile = lastAvatar;
            migrated = true;
            localStorage.removeItem('cip_last_avatar_profile_v1');
        }

        const lastFrame = localStorage.getItem('cip_last_frame_profile_v1');
        if (lastFrame !== null) {
            settings.lastFrameProfile = lastFrame;
            migrated = true;
            localStorage.removeItem('cip_last_frame_profile_v1');
        }

        const ttsRaw = localStorage.getItem('cip_tts_settings_v1');
        if (ttsRaw) {
            try {
                const parsed = JSON.parse(ttsRaw);
                settings.ttsSettings = parsed && typeof parsed === 'object' ? parsed : deepClone(this.defaultSettings.ttsSettings);
                migrated = true;
            } catch (error) {
                console.warn('[carrot] 迁移语音设置失败', error);
            } finally {
                localStorage.removeItem('cip_tts_settings_v1');
            }
        }

        const themeRaw = localStorage.getItem('cip_theme_data_v1');
        if (themeRaw) {
            try {
                const parsed = JSON.parse(themeRaw);
                settings.themeData = parsed && typeof parsed === 'object' ? parsed : {};
                migrated = true;
            } catch (error) {
                console.warn('[carrot] 迁移主题数据失败', error);
            } finally {
                localStorage.removeItem('cip_theme_data_v1');
            }
        }

        const lastTheme = localStorage.getItem('cip_last_active_theme_v1');
        if (lastTheme !== null) {
            settings.lastActiveTheme = lastTheme;
            migrated = true;
            localStorage.removeItem('cip_last_active_theme_v1');
        }

        const customCommand = localStorage.getItem('cip_custom_command_v1');
        if (customCommand !== null) {
            settings.customCommand = customCommand;
            migrated = true;
            localStorage.removeItem('cip_custom_command_v1');
        }

        const alarmRaw = localStorage.getItem('cip_alarm_data_v1');
        if (alarmRaw) {
            try {
                const parsed = JSON.parse(alarmRaw);
                settings.alarmData = parsed && typeof parsed === 'object' ? parsed : null;
                migrated = true;
            } catch (error) {
                console.warn('[carrot] 迁移定时器数据失败', error);
            } finally {
                localStorage.removeItem('cip_alarm_data_v1');
            }
        }

        const syncFilename = localStorage.getItem('cip_sync_filename_v1');
        if (syncFilename !== null) {
            settings.syncFilename = syncFilename;
            migrated = true;
            localStorage.removeItem('cip_sync_filename_v1');
        }

        try {
            const buttonRaw = localStorage.getItem('cip_button_position_v4');
            if (buttonRaw) {
                const parsed = JSON.parse(buttonRaw);
                if (parsed && typeof parsed === 'object') {
                    settings.buttonPosition = parsed;
                    migrated = true;
                }
            }
        } catch (error) {
            console.warn('[carrot] 迁移按钮位置失败', error);
        } finally {
            localStorage.removeItem('cip_button_position_v4');
        }

        if (migrated) {
            this.saveSettings();
            console.log('[carrot] migrated settings from localStorage');
        }
    },
};

SettingsStore.migrateFromLocalStorage();

export { SettingsStore };
