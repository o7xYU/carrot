const script = globalThis.script || {};
const extension_settings =
    globalThis.extension_settings || (globalThis.extension_settings = {});
const STORAGE_KEY = 'cip_regex_enabled_v1';
const RULE_SETTINGS_KEY = 'cip_regex_rule_settings_v1';
const CUSTOM_RULES_KEY = 'cip_regex_custom_rules_v1';
const REGEX_PROFILES_KEY = 'cip_regex_profiles_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();
const EXT_NAME = 'regex';

let cachedRuleSettings = null;
let cachedCustomRules = null;
let cachedProfileStore = null;

const Store = {
    defaultSettings: Object.freeze({
        enabled: DEFAULT_REGEX_ENABLED,
        customRules: [],
        ruleSettings: {},
        profileStore: { active: '', profiles: {} },
    }),

    getSettings() {
        if (!extension_settings[EXT_NAME]) {
            extension_settings[EXT_NAME] = JSON.parse(
                JSON.stringify(this.defaultSettings),
            );
        }
        const settings = extension_settings[EXT_NAME];
        for (const key of Object.keys(this.defaultSettings)) {
            if (settings[key] === undefined) {
                settings[key] = JSON.parse(
                    JSON.stringify(this.defaultSettings[key]),
                );
            }
        }
        return settings;
    },

    saveSettings() {
        this.persistToLocalStorage();
        if (typeof script.saveSettingsDebounced === 'function') {
            script.saveSettingsDebounced();
        }
    },

    persistToLocalStorage(settings = this.getSettings()) {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, settings.enabled ? 'true' : 'false');
        } catch (error) {
            console.warn('[regex] 保存开关状态到 localStorage 失败', error);
        }

        try {
            localStorage.setItem(RULE_SETTINGS_KEY, JSON.stringify(settings.ruleSettings || {}));
        } catch (error) {
            console.warn('[regex] 保存规则设置到 localStorage 失败', error);
        }

        try {
            localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(settings.customRules || []));
        } catch (error) {
            console.warn('[regex] 保存自定义规则到 localStorage 失败', error);
        }

        try {
            localStorage.setItem(REGEX_PROFILES_KEY, JSON.stringify(settings.profileStore || { active: '', profiles: {} }));
        } catch (error) {
            console.warn('[regex] 保存规则预设到 localStorage 失败', error);
        }
    },

    migrateFromLocalStorage() {
        if (typeof localStorage === 'undefined') return;

        const settings = this.getSettings();
        let migrated = false;

        const enabledRaw = localStorage.getItem(STORAGE_KEY);
        if (enabledRaw !== null) {
            settings.enabled = enabledRaw === 'true';
            localStorage.removeItem(STORAGE_KEY);
            migrated = true;
        }

        const ruleSettingsRaw = localStorage.getItem(RULE_SETTINGS_KEY);
        if (ruleSettingsRaw) {
            try {
                const parsed = JSON.parse(ruleSettingsRaw);
                settings.ruleSettings = parsed;
                migrated = true;
            } catch (error) {
                console.warn('[regex] 迁移规则配置失败', error);
            } finally {
                localStorage.removeItem(RULE_SETTINGS_KEY);
            }
        }

        const customRulesRaw = localStorage.getItem(CUSTOM_RULES_KEY);
        if (customRulesRaw) {
            try {
                const parsed = JSON.parse(customRulesRaw);
                settings.customRules = parsed;
                migrated = true;
            } catch (error) {
                console.warn('[regex] 迁移自定义规则失败', error);
            } finally {
                localStorage.removeItem(CUSTOM_RULES_KEY);
            }
        }

        const profileStoreRaw = localStorage.getItem(REGEX_PROFILES_KEY);
        if (profileStoreRaw) {
            try {
                const parsed = JSON.parse(profileStoreRaw);
                settings.profileStore = parsed;
                migrated = true;
            } catch (error) {
                console.warn('[regex] 迁移规则预设失败', error);
            } finally {
                localStorage.removeItem(REGEX_PROFILES_KEY);
            }
        }

        if (migrated) {
            cachedCustomRules = null;
            cachedRuleSettings = null;
            cachedProfileStore = null;
            this.saveSettings();
            console.log('[regex] migrated settings from localStorage');
        }
    },
};

Store.migrateFromLocalStorage();

const defaultDocument = typeof document !== 'undefined' ? document : null;
const TEXT_NODE_FILTER =
    typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;

const REGEX_RULES = [
    {
        id: 'bhl-timestamp',
        name: '时间戳',
        patternSource: '^『(.*?) \\|(.*?)』$',
        flags: 'gm',
        defaultReplacement: '$1   $2',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [time = '', text = ''] = groups;
            const container = doc.createElement('div');
            container.style.textAlign = 'center';
            container.style.color = '#8e8e93';
            container.style.fontFamily = "'linja waso', sans-serif";
            container.style.fontSize = '13px';
            container.style.margin = '12px 0';
            const safeTime = time.trim();
            const safeText = text.trim();
            const display = applyTemplate(
                config?.replacement,
                groups,
                `${safeTime}\u00A0\u00A0\u00A0${safeText}`,
            );
            container.textContent = display;
            return container;
        },
    },
    {
        id: 'bhl-bubble-self',
        name: '群-我方气泡',
        patternSource: '\\[(.*?)\\\\(.*?)\\\\(.*?)\\\]',
        flags: 'gm',
        defaultReplacement: '$3',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [name = '', time = '', message = ''] = groups;

            const container = doc.createElement('div');
            container.style.margin = '0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-end';
            container.style.marginLeft = 'auto';

            const header = doc.createElement('div');
            header.style.fontSize = '12px';
            header.style.color = '#8a8a8a';
            header.style.marginRight = '5px';
            header.style.marginBottom = '5px';

            const nameSpan = doc.createElement('span');
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';
            bodyWrapper.style.justifyContent = 'flex-end';

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginRight = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#8DE041';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = applyTemplate(
                config?.replacement,
                groups,
                message.trim(),
            );

            bubble.appendChild(paragraph);

            bodyWrapper.appendChild(timeSpan);
            bodyWrapper.appendChild(bubble);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-bubble',
        name: '群-对方气泡',
        patternSource: '\\[(.*?)\\/(.*?)\\/(.*?)\\\]',
        flags: 'gm',
        defaultReplacement: '$2',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [name = '', message = '', time = ''] = groups;

            const container = doc.createElement('div');
            container.style.margin = '0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';

            const header = doc.createElement('div');
            header.style.fontSize = '13px';
            header.style.color = '#8a8a8a';
            header.style.marginLeft = '5px';
            header.style.marginBottom = '5px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';

            const nameSpan = doc.createElement('span');
            nameSpan.style.fontWeight = '300';
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#F0EBE3';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const content = doc.createElement('div');
            content.style.margin = '0';
            content.style.whiteSpace = 'pre-wrap';
            content.style.wordWrap = 'break-word';
            content.style.fontSize = '12px';
            content.style.lineHeight = '1.5';
            content.textContent = applyTemplate(
                config?.replacement,
                groups,
                message.trim(),
            );

            bubble.appendChild(content);

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginLeft = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            bodyWrapper.appendChild(bubble);
            bodyWrapper.appendChild(timeSpan);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-char-voice',
        name: '角色语音',
        patternSource: '^=(.*?)\\|(.*?)=$',
        flags: 'gm',
        defaultReplacement: '$2',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [title = '', content = ''] = groups;

            const outerContainer = doc.createElement('div');
            outerContainer.className = 'char_bubble';

            const wrapper = doc.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.marginBottom = '0px';
            wrapper.style.alignItems = 'flex-start';
            wrapper.style.position = 'relative';
            wrapper.style.animation = 'message-pop 0.3s ease-out';

            const avatar = doc.createElement('div');
            avatar.className = 'B_C_avar custom-B_C_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.padding = '5px 5px';
            avatar.style.overflow = 'hidden';
            avatar.style.marginRight = '10px';
            avatar.style.backgroundImage = "url('{{charAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';
            details.style.maxWidth = '400px';
            details.style.padding = '10px 14px';
            details.style.setProperty('border-radius', '24px', 'important');
            details.style.fontSize = '14px';
            details.style.lineHeight = '1.4';
            details.style.setProperty(
                'border-bottom-left-radius',
                '24px',
                'important',
            );
            details.style.wordWrap = 'break-word';
            details.style.position = 'relative';
            details.style.transition = 'transform 0.2s';
            details.style.setProperty('background', 'transparent', 'important');
            details.style.color = '#333';
            details.style.setProperty(
                'box-shadow',
                '-4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            details.style.setProperty(
                'border',
                '1px solid rgba(200, 200, 200, 0.3)',
                'important',
            );

            const summary = doc.createElement('summary');
            summary.style.display = 'flex';
            summary.style.alignItems = 'center';
            summary.style.setProperty('padding', '0', 'important');
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.style.position = 'relative';

            const playIcon = doc.createElement('span');
            playIcon.style.fontSize = '16px';
            playIcon.style.color = '#333';
            playIcon.style.marginRight = '8px';
            playIcon.textContent = '▶';

            const waves = doc.createElement('div');
            waves.style.display = 'flex';
            waves.style.alignItems = 'center';
            waves.style.height = '20px';
            waves.style.gap = '2px';

            const barHeights = ['60%', '80%', '40%', '90%', '50%', '75%'];
            for (const height of barHeights) {
                const bar = doc.createElement('span');
                bar.style.display = 'inline-block';
                bar.style.width = '3px';
                bar.style.height = height;
                bar.style.backgroundColor = '#555';
                bar.style.borderRadius = '2px';
                waves.appendChild(bar);
            }

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontWeight = 'normal';
            titleSpan.style.fontSize = '15px';
            titleSpan.style.marginLeft = '12px';
            titleSpan.style.marginTop = '-2px';
            titleSpan.textContent = title.trim();
            
            summary.appendChild(playIcon);
            summary.appendChild(waves);
            summary.appendChild(titleSpan);

            const detailContent = doc.createElement('div');
            detailContent.style.setProperty('padding', '12px 14px', 'important');
            detailContent.style.borderTop = '1px solid rgba(0, 0, 0, 0.08)';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.fontWeight = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = applyTemplate(
                config?.replacement,
                groups,
                content.trim(),
            );

            detailContent.appendChild(paragraph);

            details.appendChild(summary);
            details.appendChild(detailContent);

            wrapper.appendChild(avatar);
            wrapper.appendChild(details);

            outerContainer.appendChild(wrapper);

            return outerContainer;
        },
    },
    {
        id: 'bhl-user-voice',
        name: '用户语音',
        patternSource: '^=(.*?)-(.*?)=$',
        flags: 'gm',
        defaultReplacement: '$2',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [title = '', content = ''] = groups;

            const container = doc.createElement('div');
            container.style.textAlign = 'right';
            container.style.marginBottom = '0px';
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-end';
            container.style.alignItems = 'flex-start';
            container.style.position = 'relative';
            container.style.animation = 'message-pop 0.3s ease-out';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';
            details.style.maxWidth = '400px';
            details.style.textAlign = 'left';
            details.style.padding = '10px 14px';
            details.style.setProperty('border-radius', '24px', 'important');
            details.style.fontSize = '14px';
            details.style.lineHeight = '1.4';
            details.style.setProperty(
                'border-bottom-right-radius',
                '24px',
                'important',
            );
            details.style.wordWrap = 'break-word';
            details.style.position = 'relative';
            details.style.transition = 'transform 0.2s';
            details.style.setProperty('background', 'transparent', 'important');
            details.style.color = '#333';
            details.style.setProperty(
                'box-shadow',
                '-4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            details.style.setProperty(
                'border',
                '1px solid rgba(200, 200, 200, 0.3)',
                'important',
            );
            details.style.overflow = 'hidden';

            const summary = doc.createElement('summary');
            summary.style.display = 'flex';
            summary.style.alignItems = 'center';
            summary.style.setProperty('padding', '0', 'important');
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.style.position = 'relative';

            const playIcon = doc.createElement('span');
            playIcon.style.fontSize = '16px';
            playIcon.style.color = '#333';
            playIcon.style.marginRight = '8px';
            playIcon.textContent = '▶';

            const waves = doc.createElement('div');
            waves.style.display = 'flex';
            waves.style.alignItems = 'center';
            waves.style.height = '20px';
            waves.style.gap = '2px';

            const barHeights = ['60%', '80%', '40%', '90%', '50%', '75%'];
            for (const height of barHeights) {
                const bar = doc.createElement('span');
                bar.style.display = 'inline-block';
                bar.style.width = '3px';
                bar.style.height = height;
                bar.style.backgroundColor = '#555';
                bar.style.borderRadius = '2px';
                waves.appendChild(bar);
            }

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontWeight = 'normal';
            titleSpan.style.fontSize = '15px';
            titleSpan.style.marginLeft = '12px';
            titleSpan.style.marginTop = '-2px';
            titleSpan.textContent = title.trim();

            summary.appendChild(playIcon);
            summary.appendChild(waves);
            summary.appendChild(titleSpan);

            const detailContent = doc.createElement('div');
            detailContent.style.setProperty('padding', '12px 14px', 'important');
            detailContent.style.borderTop = '1px solid rgba(0, 0, 0, 0.08)';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.fontWeight = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = applyTemplate(
                config?.replacement,
                groups,
                content.trim(),
            );

            detailContent.appendChild(paragraph);

            details.appendChild(summary);
            details.appendChild(detailContent);

            const avatar = doc.createElement('div');
            avatar.className = 'B_U_avar custom-B_U_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.overflow = 'hidden';
            avatar.style.marginLeft = '10px';
            avatar.style.backgroundImage = "url('{{userAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            container.appendChild(details);
            container.appendChild(avatar);

            return container;
        },
    },
    {
        id: 'bhl-char-dimension',
        name: 'char超次元',
        patternSource: '\\[(.*?)\\|(.*?)\\|(.*?)\\\]',
        flags: 'g',
        defaultReplacement: '$3',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [title = '', value = '', description = ''] = groups;

            const container = doc.createElement('div');
            container.style.display = 'flex';
            container.style.marginBottom = '0px';
            container.style.alignItems = 'flex-start';
            container.style.position = 'relative';
            container.style.animation = 'message-pop 0.3s ease-out';

            const avatar = doc.createElement('div');
            avatar.className = 'B_C_avar custom-B_C_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.padding = '5px 5px';
            avatar.style.overflow = 'hidden';
            avatar.style.marginRight = '10px';
            avatar.style.backgroundImage = "url('{{charAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            const bubble = doc.createElement('div');
            bubble.style.setProperty('padding', '12px 16px', 'important');
            bubble.style.setProperty('border-radius', '16px', 'important');
            bubble.style.lineHeight = '1.4';
            bubble.style.setProperty(
                'border-bottom-left-radius',
                '24px',
                'important',
            );
            bubble.style.wordWrap = 'break-word';
            bubble.style.position = 'relative';
            bubble.style.transition = 'transform 0.2s';
            bubble.style.setProperty(
                'background',
                'linear-gradient(135deg, #C7CB85, #BBCDE0)',
                'important',
            );
            bubble.style.setProperty(
                'box-shadow',
                '-4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            bubble.style.setProperty(
                'border',
                '1px solid rgba(255, 255, 255, 0.2)',
                'important',
            );
            bubble.style.minWidth = '160px';

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontSize = '14px';
            titleSpan.style.fontWeight = 'bold';
            titleSpan.style.color = '#352B2D';
            titleSpan.style.display = 'block';
            titleSpan.style.marginBottom = '4px';
            titleSpan.textContent = title.trim();

            const valueSpan = doc.createElement('span');
            valueSpan.style.fontSize = '24px';
            valueSpan.style.fontWeight = 'bold';
            valueSpan.style.color = '#615055';
            valueSpan.style.margin = '4px 0 8px 0';
            valueSpan.style.display = 'block';
            valueSpan.textContent = value.trim();

            const descriptionSpan = doc.createElement('span');
            descriptionSpan.style.fontSize = '14px';
            descriptionSpan.style.color = '#817478';
            descriptionSpan.style.opacity = '0.9';
            descriptionSpan.textContent = applyTemplate(
                config?.replacement,
                groups,
                description.trim(),
            );

            const shineLarge = doc.createElement('span');
            shineLarge.style.position = 'absolute';
            shineLarge.style.top = '5px';
            shineLarge.style.left = 'auto';
            shineLarge.style.right = '5px';
            shineLarge.style.width = '12px';
            shineLarge.style.height = '6px';
            shineLarge.style.background = 'white';
            shineLarge.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            shineLarge.style.opacity = '0.9';
            shineLarge.style.zIndex = '2';
            shineLarge.style.transform = 'rotate(45deg)';

            const shineSmall = doc.createElement('span');
            shineSmall.style.position = 'absolute';
            shineSmall.style.top = '15px';
            shineSmall.style.left = 'auto';
            shineSmall.style.right = '5px';
            shineSmall.style.width = '4px';
            shineSmall.style.height = '4px';
            shineSmall.style.background = 'white';
            shineSmall.style.borderRadius = '50%';
            shineSmall.style.opacity = '0.6';
            shineSmall.style.zIndex = '2';

            bubble.appendChild(titleSpan);
            bubble.appendChild(valueSpan);
            bubble.appendChild(descriptionSpan);
            bubble.appendChild(shineLarge);
            bubble.appendChild(shineSmall);

            container.appendChild(avatar);
            container.appendChild(bubble);

            return container;
        },
    },
    {
        id: 'bhl-user-dimension',
        name: 'user超次元',
        patternSource: '\\[(.*?)-(.*?)-(.*?)\\]',
        flags: 'g',
        defaultReplacement: '$3',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [title = '', value = '', description = ''] = groups;

            const container = doc.createElement('div');
            container.style.display = 'flex';
            container.style.marginBottom = '0px';
            container.style.alignItems = 'flex-start';
            container.style.position = 'relative';
            container.style.animation = 'message-pop 0.3s ease-out';
            container.style.flexDirection = 'row-reverse';

            const avatar = doc.createElement('div');
            avatar.className = 'B_U_avar custom-B_U_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.padding = '5px 5px';
            avatar.style.overflow = 'hidden';
            avatar.style.marginLeft = '10px';
            avatar.style.backgroundImage = "url('{{userAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            const bubble = doc.createElement('div');
            bubble.style.setProperty('padding', '12px 16px', 'important');
            bubble.style.setProperty('border-radius', '16px', 'important');
            bubble.style.lineHeight = '1.4';
            bubble.style.setProperty(
                'border-bottom-right-radius',
                '24px',
                'important',
            );
            bubble.style.wordWrap = 'break-word';
            bubble.style.position = 'relative';
            bubble.style.transition = 'transform 0.2s';
            bubble.style.setProperty(
                'background',
                'linear-gradient(135deg, #C7CB85, #FFC0BE)',
                'important',
            );
            bubble.style.setProperty(
                'box-shadow',
                '4px 4px 8px rgba(0, 0, 0, 0.10), -2px -2px 4px rgba(255, 255, 255, 0.3), inset 6px 6px 8px rgba(0, 0, 0, 0.10), inset -6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            bubble.style.setProperty(
                'border',
                '1px solid rgba(255, 255, 255, 0.2)',
                'important',
            );
            bubble.style.minWidth = '160px';

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontSize = '14px';
            titleSpan.style.fontWeight = 'bold';
            titleSpan.style.color = '#352B2D';
            titleSpan.style.display = 'block';
            titleSpan.style.marginBottom = '4px';
            titleSpan.textContent = title.trim();

            const valueSpan = doc.createElement('span');
            valueSpan.style.fontSize = '24px';
            valueSpan.style.fontWeight = 'bold';
            valueSpan.style.color = '#615055';
            valueSpan.style.margin = '4px 0 8px 0';
            valueSpan.style.display = 'block';
            valueSpan.textContent = value.trim();

            const descriptionSpan = doc.createElement('span');
            descriptionSpan.style.fontSize = '14px';
            descriptionSpan.style.color = '#817478';
            descriptionSpan.style.opacity = '0.9';
            descriptionSpan.textContent = applyTemplate(
                config?.replacement,
                groups,
                description.trim(),
            );

            const shineLarge = doc.createElement('span');
            shineLarge.style.position = 'absolute';
            shineLarge.style.top = '5px';
            shineLarge.style.left = '5px';
            shineLarge.style.width = '12px';
            shineLarge.style.height = '6px';
            shineLarge.style.background = 'white';
            shineLarge.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            shineLarge.style.opacity = '0.9';
            shineLarge.style.zIndex = '2';
            shineLarge.style.transform = 'rotate(-45deg)';

            const shineSmall = doc.createElement('span');
            shineSmall.style.position = 'absolute';
            shineSmall.style.top = '15px';
            shineSmall.style.left = '5px';
            shineSmall.style.width = '4px';
            shineSmall.style.height = '4px';
            shineSmall.style.background = 'white';
            shineSmall.style.borderRadius = '50%';
            shineSmall.style.opacity = '0.6';
            shineSmall.style.zIndex = '2';

            bubble.appendChild(titleSpan);
            bubble.appendChild(valueSpan);
            bubble.appendChild(descriptionSpan);
            bubble.appendChild(shineLarge);
            bubble.appendChild(shineSmall);

            container.appendChild(avatar);
            container.appendChild(bubble);

            return container;
        },
    },
    {
        id: 'bhl-system',
        name: '系统提示',
        patternSource: '\\+([\s\S]*?)\\+',
        flags: 'g',
        defaultReplacement: '$1',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [message = ''] = groups;
            const container = doc.createElement('div');
            container.style.textAlign = 'center';
            container.style.color = '#888888';
            container.style.fontSize = '14px';
            container.style.margin = '0';
            container.textContent = applyTemplate(
                config?.replacement,
                groups,
                message.trim(),
            );
            return container;
        },
    },
    {
        id: 'bhl-recall',
        name: '撤回提示',
        patternSource: '^-(.*?)-$',
        flags: 'gm',
        defaultReplacement: '$1',
        createNode({ documentRef, groups, config }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const custom = resolveCustomReplacement({
                documentRef: doc,
                replacement: config?.replacement,
                defaultReplacement: this?.defaultReplacement,
                groups,
            });
            if (custom) return custom;

            const [message = ''] = groups;
            const outer = doc.createElement('div');
            outer.style.textAlign = 'center';
            outer.style.marginBottom = '6px';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';

            const summary = doc.createElement('summary');
            summary.style.color = '#999999';
            summary.style.fontStyle = 'italic';
            summary.style.fontSize = '13px';
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.textContent = '对方撤回了一条消息';

            const content = doc.createElement('div');
            content.style.padding = '8px 12px';
            content.style.marginTop = '8px';
            content.style.backgroundColor = 'rgba(0,0,0,0.04)';
            content.style.borderRadius = '10px';
            content.style.textAlign = 'left';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.color = '#555';
            paragraph.style.fontStyle = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = applyTemplate(
                config?.replacement,
                groups,
                message.trim(),
            );

            content.appendChild(paragraph);
            details.appendChild(summary);
            details.appendChild(content);
            outer.appendChild(details);

            return outer;
        },
    },
];

function applyTemplate(template, groups, fallback) {
    if (!template) return fallback;
    try {
        return template.replace(/\$(\d+)/g, (_, index) => {
            const position = Number(index) - 1;
            return groups[position] !== undefined ? groups[position] : '';
        });
    } catch (error) {
        console.warn('胡萝卜插件：渲染正则模板失败', error);
        return fallback;
    }
}

function buildCustomReplacement(documentRef, template, groups) {
    const doc = documentRef || defaultDocument;
    if (!doc) return null;
    if (typeof template !== 'string') return null;
    if (!template.trim()) return null;
    try {
        const html = applyTemplate(template, groups, template);
        const tpl = doc.createElement('template');
        tpl.innerHTML = html;
        return tpl.content;
    } catch (error) {
        console.warn('胡萝卜插件：渲染自定义替换失败', error);
        return null;
    }
}

function resolveCustomReplacement({
    documentRef,
    replacement,
    defaultReplacement,
    groups,
}) {
    const template = typeof replacement === 'string' ? replacement : '';
    const baseline =
        typeof defaultReplacement === 'string' ? defaultReplacement : '';
    if (!template.trim()) return null;
    if (template === baseline) return null;
    return buildCustomReplacement(documentRef, template, groups);
}

function normalizeFlags(flags = 'g') {
    const raw = typeof flags === 'string' ? flags : '';
    const uniq = [];
    for (const ch of `${raw}g`) {
        if (!uniq.includes(ch)) uniq.push(ch);
    }
    return uniq.join('');
}

function parsePatternInput(input, fallbackFlags = 'gm') {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    let source = trimmed;
    let flags = normalizeFlags(fallbackFlags);

    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
        const lastSlash = trimmed.lastIndexOf('/');
        source = trimmed.slice(1, lastSlash);
        const flagPart = trimmed.slice(lastSlash + 1).trim();
        if (flagPart) {
            flags = normalizeFlags(flagPart);
        }
    }

    try {
        // eslint-disable-next-line no-new
        new RegExp(source, flags);
    } catch (error) {
        return null;
    }

    return { source, flags };
}

function sanitizeCustomRule(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const parsed =
        parsePatternInput(raw.patternSource, raw.flags || 'gm') ||
        parsePatternInput(raw.pattern, raw.flags || 'gm');
    if (!parsed) return null;

    const replacement =
        typeof raw.defaultReplacement === 'string' ? raw.defaultReplacement : '';
    const id =
        typeof raw.id === 'string' && raw.id.trim()
            ? raw.id.trim()
            : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name =
        typeof raw.name === 'string' && raw.name.trim()
            ? raw.name.trim()
            : '自定义正则';
    return {
        id,
        name,
        patternSource: parsed.source,
        flags: parsed.flags,
        defaultReplacement: replacement,
        isCustom: true,
    };
}

function normalizeCustomRuleList(rawList = []) {
    const unique = new Map();
    for (const raw of rawList) {
        const normalized = sanitizeCustomRule(raw);
        if (!normalized || unique.has(normalized.id)) continue;
        unique.set(normalized.id, normalized);
    }
    return Array.from(unique.values());
}

function loadCustomRuleDefinitions() {
    if (cachedCustomRules) return cachedCustomRules;
    try {
        const settings = Store.getSettings();
        cachedCustomRules = normalizeCustomRuleList(settings.customRules);
        settings.customRules = cachedCustomRules;
        return cachedCustomRules;
    } catch (error) {
        console.warn('胡萝卜插件：读取自定义正则失败', error);
        cachedCustomRules = [];
        return cachedCustomRules;
    }
}

function persistCustomRuleDefinitions(list) {
    cachedCustomRules = normalizeCustomRuleList(list);
    cachedRuleSettings = null;
    try {
        const settings = Store.getSettings();
        settings.customRules = cachedCustomRules;
        Store.saveSettings();
    } catch (error) {
        console.warn('胡萝卜插件：写入自定义正则失败', error);
    }
}

function normalizeProfileStore(raw) {
    const base = { active: '', profiles: {} };
    if (!raw || typeof raw !== 'object') return base;
    const store = {
        active: typeof raw.active === 'string' ? raw.active : '',
        profiles: {},
    };
    if (raw.profiles && typeof raw.profiles === 'object') {
        for (const [name, entry] of Object.entries(raw.profiles)) {
            if (typeof name !== 'string' || !name.trim()) continue;
            const trimmed = name.trim();
            const ruleSettings = normalizeRuleSettings(entry?.ruleSettings);
            const customRules = normalizeCustomRuleList(entry?.customRules || []);
            const enabled =
                typeof entry?.enabled === 'boolean'
                    ? entry.enabled
                    : DEFAULT_REGEX_ENABLED;
            store.profiles[trimmed] = {
                name: trimmed,
                ruleSettings,
                customRules,
                enabled,
            };
        }
    }
    return store;
}

function loadProfileStore() {
    if (cachedProfileStore) return cachedProfileStore;
    try {
        const settings = Store.getSettings();
        cachedProfileStore = normalizeProfileStore(settings.profileStore);
        settings.profileStore = cachedProfileStore;
        return cachedProfileStore;
    } catch (error) {
        console.warn('胡萝卜插件：读取正则配置预设失败', error);
        cachedProfileStore = { active: '', profiles: {} };
        return cachedProfileStore;
    }
}

function persistProfileStore(store) {
    cachedProfileStore = normalizeProfileStore(store);
    try {
        const settings = Store.getSettings();
        settings.profileStore = cachedProfileStore;
        Store.saveSettings();
    } catch (error) {
        console.warn('胡萝卜插件：写入正则配置预设失败', error);
    }
}

function getAllRules() {
    return [...REGEX_RULES, ...loadCustomRuleDefinitions()];
}

function getDefaultRuleSettings() {
    const defaults = {};
    for (const rule of getAllRules()) {
        defaults[rule.id] = {
            enabled: true,
            pattern: rule.patternSource,
            replacement: rule.defaultReplacement || '',
            flags: rule.flags || 'g',
        };
    }
    return defaults;
}

function normalizeRuleSettings(raw) {
    const defaults = getDefaultRuleSettings();
    if (!raw || typeof raw !== 'object') return defaults;

    const merged = { ...defaults };
    for (const [ruleId, ruleDefaults] of Object.entries(defaults)) {
        const candidate = raw[ruleId];
        if (!candidate || typeof candidate !== 'object') continue;
        merged[ruleId] = { ...ruleDefaults };
        if (typeof candidate.enabled === 'boolean') {
            merged[ruleId].enabled = candidate.enabled;
        }
        if (typeof candidate.pattern === 'string' && candidate.pattern.trim()) {
            merged[ruleId].pattern = candidate.pattern;
        }
        if (typeof candidate.replacement === 'string') {
            merged[ruleId].replacement = candidate.replacement;
        }
        if (typeof candidate.flags === 'string' && candidate.flags.trim()) {
            merged[ruleId].flags = candidate.flags.trim();
        }
    }
    return merged;
}

function loadRuleSettingsFromStorage() {
    if (cachedRuleSettings) return cachedRuleSettings;
    try {
        const settings = Store.getSettings();
        cachedRuleSettings = normalizeRuleSettings(settings.ruleSettings);
        settings.ruleSettings = cachedRuleSettings;
        return cachedRuleSettings;
    } catch (error) {
        console.warn('胡萝卜插件：读取正则规则配置失败', error);
        cachedRuleSettings = getDefaultRuleSettings();
        return cachedRuleSettings;
    }
}

function persistRuleSettings(settings) {
    cachedRuleSettings = normalizeRuleSettings(settings);
    try {
        const storeSettings = Store.getSettings();
        storeSettings.ruleSettings = cachedRuleSettings;
        Store.saveSettings();
    } catch (error) {
        console.warn('胡萝卜插件：写入正则规则配置失败', error);
    }
}

function getRuleSettingsWithDefaults() {
    return normalizeRuleSettings(loadRuleSettingsFromStorage());
}

function getRuleConfig(ruleSettings, rule) {
    const defaults = getDefaultRuleSettings();
    const merged = {
        ...(defaults[rule.id] || {}),
        ...(ruleSettings?.[rule.id] || {}),
    };
    return merged;
}

function buildPattern(rule, config) {
    if (!rule) return null;
    const parsed =
        parsePatternInput(
            config?.pattern || rule.patternSource,
            config?.flags || rule.flags || 'g',
        ) || {
            source: config?.pattern || rule.patternSource,
            flags: normalizeFlags(config?.flags || rule.flags || 'g'),
        };
    const { source } = parsed;
    const flags = normalizeFlags(parsed.flags);
    try {
        return new RegExp(source, flags);
    } catch (error) {
        console.warn('胡萝卜插件：正则表达式无效', {
            id: rule.id,
            source,
            flags,
            error,
        });
        return null;
    }
}

function clonePattern(pattern) {
    if (!(pattern instanceof RegExp)) return null;
    return new RegExp(pattern.source, pattern.flags);
}

function isInsideRegexNode(node) {
    let current = node;
    while (current) {
        if (current.nodeType === 1 && current.dataset?.cipRegexNode === '1') {
            return true;
        }
        current = current.parentNode;
    }
    return false;
}

function collectTextNodes(root, documentRef) {
    const doc = documentRef || defaultDocument;
    if (!root || !doc?.createTreeWalker) return [];

    const nodes = [];
    const walker = doc.createTreeWalker(root, TEXT_NODE_FILTER);
    while (walker.nextNode()) {
        const current = walker.currentNode;
        if (!current || !current.nodeValue) continue;
        if (isInsideRegexNode(current.parentNode)) continue;
        nodes.push(current);
    }
    return nodes;
}

function markRegexNode(node, ruleId) {
    if (!node) return;
    if (node.nodeType === 11) {
        const elements = node.children || [];
        for (const child of elements) {
            markRegexNode(child, ruleId);
        }
        return;
    }

    if (node.nodeType !== 1) return;
    node.dataset.cipRegexNode = '1';
    node.dataset.cipRegexRule = ruleId || '';
}

function hasQuoteAncestor(node) {
    let current = node?.parentElement;
    while (current) {
        const tag = current.tagName ? current.tagName.toUpperCase() : '';
        if (tag === 'Q' || tag === 'BLOCKQUOTE') return true;
        current = current.parentElement;
    }
    return false;
}

function getReplacementTarget(textNode) {
    if (!textNode?.parentNode) return textNode;
    const parent = textNode.parentNode;
    if (parent.nodeType !== 1) return textNode;

    const tagName = parent.tagName ? parent.tagName.toUpperCase() : '';
    if (tagName !== 'Q' && tagName !== 'BLOCKQUOTE') return textNode;

    const children = Array.from(parent.childNodes || []);
    const onlyText = children.every((child) => {
        if (child === textNode) return true;
        if (child.nodeType === 3) {
            return !child.nodeValue || !child.nodeValue.trim();
        }
        return false;
    });

    if (!onlyText) return textNode;

    if (hasQuoteAncestor(parent)) {
        return textNode;
    }

    return parent;
}

function replaceMatchesInTextNode({
    textNode,
    rule,
    pattern,
    documentRef,
    ensureOriginalStored,
    ruleConfig,
}) {
    if (!textNode?.parentNode) return false;
    const targetNode = getReplacementTarget(textNode);
    const text = targetNode.textContent || textNode.nodeValue;
    if (!text) return false;

    const doc = documentRef || defaultDocument;
    if (!doc) return false;

    const workingPattern = clonePattern(pattern);
    if (!workingPattern) return false;

    let match;
    let lastIndex = 0;
    let replaced = false;
    const fragment = doc.createDocumentFragment();

    workingPattern.lastIndex = 0;

    while ((match = workingPattern.exec(text)) !== null) {
        const matchText = match[0];
        if (!matchText) {
            if (workingPattern.lastIndex === match.index) {
                workingPattern.lastIndex++;
            }
            continue;
        }

        const startIndex = match.index;
        if (startIndex > lastIndex) {
            fragment.appendChild(
                doc.createTextNode(text.slice(lastIndex, startIndex)),
            );
        }

        const replacementNode = createReplacementNode({
            documentRef: doc,
            groups: match.slice(1),
            config: ruleConfig,
            rule,
            fallbackText: matchText,
        });

        if (replacementNode) {
            markRegexNode(replacementNode, rule.id);
            fragment.appendChild(replacementNode);
            replaced = true;
        } else {
            fragment.appendChild(doc.createTextNode(matchText));
        }

        lastIndex = startIndex + matchText.length;

        if (workingPattern.lastIndex === match.index) {
            workingPattern.lastIndex++;
        }
    }

    if (!replaced) {
        return false;
    }

    if (lastIndex < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }

    if (typeof ensureOriginalStored === 'function') {
        ensureOriginalStored();
    }

    targetNode.parentNode.replaceChild(fragment, targetNode);
    return true;
}

function clearAppliedFlag(element) {
    if (!element?.dataset) return;
    delete element.dataset.cipRegexApplied;
}

function markApplied(element) {
    if (!element?.dataset) return;
    element.dataset.cipRegexApplied = '1';
}

function restoreOriginal(element) {
    if (!element) return false;
    const original = originalContentMap.get(element);
    if (typeof original !== 'string') return false;
    element.innerHTML = original;
    originalContentMap.delete(element);
    clearAppliedFlag(element);
    return true;
}

export function getRegexEnabled() {
    try {
        const settings = Store.getSettings();
        if (typeof settings.enabled !== 'boolean') {
            settings.enabled = DEFAULT_REGEX_ENABLED;
        }
        return settings.enabled;
    } catch (error) {
        console.warn('胡萝卜插件：读取正则开关失败', error);
        return DEFAULT_REGEX_ENABLED;
    }
}

export function setRegexEnabled(enabled) {
    try {
        const settings = Store.getSettings();
        settings.enabled = !!enabled;
        Store.saveSettings();
    } catch (error) {
        console.warn('胡萝卜插件：写入正则开关失败', error);
    }
}

export function getRegexProfiles() {
    const store = loadProfileStore();
    return Object.values(store.profiles).map((item) => ({
        name: item.name,
        isActive: store.active === item.name,
    }));
}

export function getActiveRegexProfile() {
    const store = loadProfileStore();
    return store.active || '';
}

export function saveRegexProfile(name) {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) return getRegexProfiles();

    const store = loadProfileStore();
    store.profiles[trimmed] = {
        name: trimmed,
        enabled: getRegexEnabled(),
        ruleSettings: getRuleSettingsWithDefaults(),
        customRules: loadCustomRuleDefinitions(),
    };
    store.active = trimmed;
    persistProfileStore(store);
    return getRegexProfiles();
}

export function applyRegexProfile(name) {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) return false;

    const store = loadProfileStore();
    const profile = store.profiles?.[trimmed];
    if (!profile) return false;

    setRegexEnabled(
        typeof profile.enabled === 'boolean'
            ? profile.enabled
            : DEFAULT_REGEX_ENABLED,
    );
    persistCustomRuleDefinitions(profile.customRules || []);
    persistRuleSettings(profile.ruleSettings || {});
    store.active = trimmed;
    persistProfileStore(store);
    return true;
}

function createReplacementNode({
    rule,
    groups,
    config,
    documentRef,
    fallbackText = '',
}) {
    const doc = documentRef || defaultDocument;
    if (!doc) return null;

    if (typeof rule?.createNode === 'function') {
        return rule.createNode({
            documentRef: doc,
            groups,
            config,
        });
    }

    const template =
        typeof config?.replacement === 'string'
            ? config.replacement
            : typeof rule?.defaultReplacement === 'string'
              ? rule.defaultReplacement
              : '';

    if (template && template.trim()) {
        const custom = buildCustomReplacement(doc, template, groups);
        if (custom) return custom;
    }

    const text = applyTemplate(template, groups, fallbackText || '');
    return doc.createTextNode(text);
}

export function getRegexRuleSettings() {
    return getRuleSettingsWithDefaults();
}

export function setRegexRuleSettings(settings) {
    persistRuleSettings(settings);
    return getRegexRuleSettings();
}

export function updateRegexRuleSetting(ruleId, updates = {}) {
    const settings = getRuleSettingsWithDefaults();
    if (!settings[ruleId]) return settings;
    let nextPattern = updates.pattern;
    let nextFlags = updates.flags;

    if (typeof updates.pattern === 'string') {
        const parsed = parsePatternInput(
            updates.pattern,
            updates.flags || settings[ruleId]?.flags || 'g',
        );
        if (parsed) {
            nextPattern = parsed.source;
            nextFlags = parsed.flags;
        }
    }

    const next = {
        ...settings[ruleId],
        ...updates,
        ...(typeof nextPattern === 'string' ? { pattern: nextPattern } : {}),
        ...(typeof nextFlags === 'string'
            ? { flags: normalizeFlags(nextFlags) }
            : {}),
    };
    return setRegexRuleSettings({
        ...settings,
        [ruleId]: next,
    });
}

export function resetRegexRuleSetting(ruleId) {
    const defaults = getDefaultRuleSettings();
    if (!defaults[ruleId]) return getRuleSettingsWithDefaults();
    const current = getRuleSettingsWithDefaults();
    return setRegexRuleSettings({
        ...current,
        [ruleId]: defaults[ruleId],
    });
}

export function resetAllRegexRuleSettings() {
    const defaults = getDefaultRuleSettings();
    setRegexRuleSettings(defaults);
    return defaults;
}

export function addCustomRegexRule({ name, pattern, replacement = '' } = {}) {
    const prepared = sanitizeCustomRule({
        id: '',
        name,
        patternSource: typeof pattern === 'string' ? pattern.trim() : '',
        defaultReplacement:
            typeof replacement === 'string' ? replacement : `${replacement ?? ''}`,
    });
    if (!prepared) {
        throw new Error('无效的正则定义');
    }
    const current = loadCustomRuleDefinitions();
    const next = [...current, prepared];
    persistCustomRuleDefinitions(next);
    const settings = getRuleSettingsWithDefaults();
    persistRuleSettings({
        ...settings,
        [prepared.id]: {
            enabled: true,
            pattern: prepared.patternSource,
            replacement: prepared.defaultReplacement || '',
            flags: prepared.flags || 'g',
        },
    });
    return prepared;
}

export function removeCustomRegexRule(ruleId) {
    if (!ruleId) return false;
    const current = loadCustomRuleDefinitions();
    const next = current.filter((rule) => rule.id !== ruleId);
    if (next.length === current.length) return false;
    persistCustomRuleDefinitions(next);
    const settings = getRuleSettingsWithDefaults();
    const { [ruleId]: _, ...rest } = settings;
    persistRuleSettings(rest);
    return true;
}

export function getRegexRulesForUI() {
    const settings = getRuleSettingsWithDefaults();
    return getAllRules().map((rule) => ({
        id: rule.id,
        name: rule.name || rule.id,
        enabled: settings[rule.id]?.enabled !== false,
        pattern: settings[rule.id]?.pattern || rule.patternSource,
        replacement:
            settings[rule.id]?.replacement ?? rule.defaultReplacement ?? '',
        flags: settings[rule.id]?.flags || rule.flags || 'g',
        isCustom: !!rule.isCustom,
        defaults: {
            pattern: rule.patternSource,
            replacement: rule.defaultReplacement || '',
            flags: rule.flags || 'g',
        },
    }));
}

export function applyRegexReplacements(element, options = {}) {
    if (!element) return false;

    const {
        enabled = true,
        documentRef = defaultDocument,
    } = options;

    if (!enabled) {
        return restoreOriginal(element);
    }

    if (!documentRef) {
        return false;
    }

    let replacedAny = false;
    let storedOriginal = false;

    const ensureOriginalStored = () => {
        if (storedOriginal) return;
        originalContentMap.set(element, element.innerHTML);
        storedOriginal = true;
    };

    const ruleSettings = getRuleSettingsWithDefaults();

    for (const rule of getAllRules()) {
        try {
            const config = getRuleConfig(ruleSettings, rule);
            if (!config.enabled) continue;
            const pattern = buildPattern(rule, config);
            if (!pattern) continue;

            const textNodes = collectTextNodes(element, documentRef);
            if (!textNodes.length) continue;

            for (const textNode of textNodes) {
                const replaced = replaceMatchesInTextNode({
                    textNode,
                    rule,
                    pattern,
                    documentRef,
                    ensureOriginalStored,
                    ruleConfig: config,
                });
                if (replaced) {
                    replacedAny = true;
                }
            }
        } catch (error) {
            console.warn('胡萝卜插件：应用正则规则失败', {
                id: rule?.id,
                name: rule?.name,
                error,
            });
            continue;
        }
    }

    if (replacedAny) {
        markApplied(element);
        return true;
    }

    if (element?.dataset?.cipRegexApplied) {
        if (!originalContentMap.has(element)) {
            clearAppliedFlag(element);
            return false;
        }
        return true;
    }

    return false;
}

export default {
    applyRegexReplacements,
    getRegexEnabled,
    setRegexEnabled,
    getRegexProfiles,
    saveRegexProfile,
    applyRegexProfile,
    getActiveRegexProfile,
    getRegexRuleSettings,
    setRegexRuleSettings,
    updateRegexRuleSetting,
    resetRegexRuleSetting,
    resetAllRegexRuleSettings,
    addCustomRegexRule,
    removeCustomRegexRule,
    getRegexRulesForUI,
};

export function restoreRegexOriginal(element) {
    return restoreOriginal(element);
}

export function clearRegexState(element) {
    clearAppliedFlag(element);
    restoreOriginal(element);
}

export function getRegexRules() {
    return getAllRules();
}

