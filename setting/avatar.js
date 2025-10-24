const TEMPLATE_CHAR_AVATAR = '{{charAvatarPath}}';
const TEMPLATE_USER_AVATAR = '{{userAvatarPath}}';

export function initAvatarSettings(
    {
        charAvatarUrlInput,
        userAvatarUrlInput,
        charAvatarFrameUrlInput,
        userAvatarFrameUrlInput,
        unsplashAccessKeyInput,
        avatarProfileSelect,
        applyAvatarBtn,
        deleteAvatarBtn,
        newAvatarProfileNameInput,
        saveAvatarBtn,
        avatarSubtabs = [],
        avatarPanes = [],
        adjustCharFrameBtn,
        adjustUserFrameBtn,
        frameAdjustPanel,
        frameAdjustTitle,
        frameSizeSlider,
        frameSizeValue,
        frameOffsetXSlider,
        frameOffsetXValue,
        frameOffsetYSlider,
        frameOffsetYValue,
        frameResetBtn,
        frameCloseBtn,
        frameProfileSelect,
        applyFrameBtn,
        deleteFrameBtn,
        newFrameProfileNameInput,
        saveFrameBtn,
    },
    {
        documentRef = document,
        windowRef = window,
        localStorageRef = localStorage,
        alertRef = (message) => alert(message),
        confirmRef = (message) => confirm(message),
        unsplashAccessKey = '',
        setUnsplashAccessKey = () => {},
        reprocessUnsplashPlaceholders = () => {},
    } = {},
) {
    let avatarStyleTag = null;
    let avatarProfiles = {};
    let frameProfiles = {};
    let currentAdjustingFrame = null;
    const originalAvatarSources = new WeakMap();
    const subtabList = avatarSubtabs ? Array.from(avatarSubtabs) : [];
    const paneList = avatarPanes ? Array.from(avatarPanes) : [];
    const frameAdjustments = {
        char: { size: 120, offsetX: 0, offsetY: 0 },
        user: { size: 120, offsetX: 0, offsetY: 0 },
    };
    const defaultAvatars = {
        char: TEMPLATE_CHAR_AVATAR,
        user: TEMPLATE_USER_AVATAR,
    };

    function hasUsableAvatarUrl(value) {
        if (!value) return false;
        const trimmed = value.trim();
        if (!trimmed || trimmed === 'none') return false;
        if (trimmed.includes('{{') && trimmed.includes('}}')) return false;
        return true;
    }
    const avatarSelectorMap = {
        char: [
            '.custom-B_C_avar',
            '.B_C_avar',
            '#char_avatar',
            '.char_avatar',
            '[data-avatar="char"]',
        ],
        user: [
            '.custom-B_U_avar',
            '.B_U_avar',
            '#user_avatar',
            '.user_avatar',
            '[data-avatar="user"]',
        ],
    };

    function extractUrlFromCssValue(value) {
        if (!value || value === 'none') return '';
        const match = value.match(/url\((['"]?)(.*?)\1\)/i);
        return match ? match[2] : '';
    }

    function rememberOriginalAvatar(element) {
        if (!element || element.nodeType !== 1 || originalAvatarSources.has(element))
            return;

        if (element.tagName === 'IMG') {
            originalAvatarSources.set(element, {
                type: 'img',
                src: element.getAttribute('src') || '',
                srcset: element.getAttribute('srcset') || '',
            });
            return;
        }

        if (element.tagName === 'SOURCE') {
            originalAvatarSources.set(element, {
                type: 'source',
                srcset: element.getAttribute('srcset') || '',
            });
            return;
        }

        originalAvatarSources.set(element, {
            type: 'bg',
            backgroundImage: element.style.backgroundImage || '',
            backgroundPriority:
                element.style.getPropertyPriority?.('background-image') || '',
        });
    }

    function applyAvatarToElement(element, rawUrl, sanitizedUrl) {
        if (!element || element.nodeType !== 1) return;

        rememberOriginalAvatar(element);
        const original = originalAvatarSources.get(element) || {};

        if (element.tagName === 'IMG') {
            if (rawUrl) {
                if (element.src !== rawUrl) element.src = rawUrl;
                element.removeAttribute('srcset');
            } else {
                if (typeof original.src === 'string' && original.src) {
                    element.src = original.src;
                } else {
                    element.removeAttribute('src');
                }
                if (typeof original.srcset === 'string' && original.srcset) {
                    element.setAttribute('srcset', original.srcset);
                } else {
                    element.removeAttribute('srcset');
                }
            }
            return;
        }

        if (element.tagName === 'SOURCE') {
            if (rawUrl) {
                element.setAttribute('srcset', rawUrl);
            } else if (typeof original.srcset === 'string' && original.srcset) {
                element.setAttribute('srcset', original.srcset);
            } else {
                element.removeAttribute('srcset');
            }
            return;
        }

        if (rawUrl) {
            element.style.setProperty(
                'background-image',
                `url('${sanitizedUrl}')`,
                'important',
            );
        } else if (original.type === 'bg') {
            if (original.backgroundImage) {
                element.style.setProperty(
                    'background-image',
                    original.backgroundImage,
                    original.backgroundPriority || '',
                );
            } else {
                element.style.removeProperty('background-image');
            }
        } else {
            element.style.removeProperty('background-image');
        }
    }

    function applyAvatarToElements(type, rawUrl) {
        const selectors = avatarSelectorMap[type] || [];
        if (!selectors.length) return;
        const sanitizedUrl = rawUrl ? rawUrl.replace(/'/g, "\\'") : '';
        const elements = new Set();
        selectors.forEach((selector) => {
            try {
                const found = documentRef.querySelectorAll(selector);
                found.forEach((el) => elements.add(el));
            } catch (error) {
                console.warn('Invalid avatar selector:', selector, error);
            }
        });
        elements.forEach((element) =>
            applyAvatarToElement(element, rawUrl, sanitizedUrl),
        );
    }

    function readAvatarFromElement(element) {
        if (!element) return '';
        const dataset = element.dataset || {};
        if (dataset.avatar && hasUsableAvatarUrl(dataset.avatar))
            return dataset.avatar.trim();
        if (dataset.src && hasUsableAvatarUrl(dataset.src))
            return dataset.src.trim();
        if (dataset.bg && hasUsableAvatarUrl(dataset.bg))
            return dataset.bg.trim();
        const directAttr =
            element.getAttribute?.('data-avatar-url') ||
            element.getAttribute?.('data-src');
        if (directAttr && hasUsableAvatarUrl(directAttr))
            return directAttr.trim();
        const srcsetAttr = element.getAttribute?.('srcset');
        if (srcsetAttr) {
            const firstEntry = srcsetAttr.split(',')[0]?.trim().split(' ')[0];
            if (hasUsableAvatarUrl(firstEntry)) return firstEntry;
        }
        const inlineBg = extractUrlFromCssValue(
            element.style?.backgroundImage,
        );
        if (hasUsableAvatarUrl(inlineBg)) return inlineBg;
        if (windowRef?.getComputedStyle) {
            const computedBg = extractUrlFromCssValue(
                windowRef.getComputedStyle(element)?.backgroundImage,
            );
            if (hasUsableAvatarUrl(computedBg)) return computedBg;
        }
        if (element.tagName === 'IMG') {
            const currentSrc = element.currentSrc || element.src || '';
            return hasUsableAvatarUrl(currentSrc) ? currentSrc : '';
        }
        const imgChild = element.querySelector?.('img');
        if (imgChild) {
            const childSrc = imgChild.currentSrc || imgChild.src || '';
            return hasUsableAvatarUrl(childSrc) ? childSrc : '';
        }
        const pictureSource = element.querySelector?.('source[srcset]');
        if (pictureSource) {
            const pictureSrcset = pictureSource.getAttribute('srcset');
            if (pictureSrcset) {
                const firstEntry = pictureSrcset
                    .split(',')[0]
                    ?.trim()
                    .split(' ')[0];
                if (hasUsableAvatarUrl(firstEntry)) return firstEntry;
            }
        }
        return '';
    }

    function detectDefaultAvatar(type) {
        const selectors = avatarSelectorMap[type] || [];
        for (const selector of selectors) {
            const element = documentRef.querySelector(selector);
            const url = readAvatarFromElement(element);
            if (hasUsableAvatarUrl(url)) {
                defaultAvatars[type] = url;
                return url;
            }
        }
        defaultAvatars[type] = '';
        return '';
    }

    function resolveAvatarUrl(type, explicitUrl) {
        if (hasUsableAvatarUrl(explicitUrl)) {
            return explicitUrl.trim();
        }
        if (!hasUsableAvatarUrl(defaultAvatars[type])) {
            detectDefaultAvatar(type);
        }
        const fallback = defaultAvatars[type];
        return hasUsableAvatarUrl(fallback) ? fallback.trim() : '';
    }

    function refreshDetectedDefaults() {
        detectDefaultAvatar('char');
        detectDefaultAvatar('user');
    }

    if (subtabList.length && paneList.length) {
        subtabList.forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.subtab;
                subtabList.forEach((b) =>
                    b.classList.toggle('active', b === btn),
                );
                paneList.forEach((pane) =>
                    pane.classList.toggle(
                        'active',
                        pane.id === `cip-avatar-pane-${target}`,
                    ),
                );
            });
        });
    }

    function initAvatarStyler() {
        avatarStyleTag = documentRef.getElementById('cip-avatar-styler');
        if (!avatarStyleTag) {
            avatarStyleTag = documentRef.createElement('style');
            avatarStyleTag.id = 'cip-avatar-styler';
            documentRef.head.appendChild(avatarStyleTag);
        }
    }

    function applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl) {
        if (!avatarStyleTag) {
            console.error('Avatar styler tag not found.');
            return;
        }
        let cssRules = '';
        cssRules += `.custom-B_C_avar, .custom-B_U_avar { position: relative; overflow: visible !important; }\n`;
        const resolvedCharUrl = resolveAvatarUrl('char', charUrl);
        const resolvedUserUrl = resolveAvatarUrl('user', userUrl);
        applyAvatarToElements('char', resolvedCharUrl);
        applyAvatarToElements('user', resolvedUserUrl);
        if (charFrameUrl) {
            const safeCharFrameUrl = charFrameUrl.replace(/'/g, "\\'");
            const charAdj = frameAdjustments.char;
            const charTransformX = -50 + charAdj.offsetX;
            const charTransformY = -50 + charAdj.offsetY;
            cssRules += `.custom-B_C_avar::after { content: ""; position: absolute; top: 50%; left: 50%; width: ${charAdj.size}%; height: ${charAdj.size}%; transform: translate(${charTransformX}%, ${charTransformY}%); background-image: url('${safeCharFrameUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; pointer-events: none; z-index: 1; }\n`;
        }
        if (userFrameUrl) {
            const safeUserFrameUrl = userFrameUrl.replace(/'/g, "\\'");
            const userAdj = frameAdjustments.user;
            const userTransformX = -50 + userAdj.offsetX;
            const userTransformY = -50 + userAdj.offsetY;
            cssRules += `.custom-B_U_avar::after { content: ""; position: absolute; top: 50%; left: 50%; width: ${userAdj.size}%; height: ${userAdj.size}%; transform: translate(${userTransformX}%, ${userTransformY}%); background-image: url('${safeUserFrameUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; pointer-events: none; z-index: 1; }\n`;
        }
        avatarStyleTag.textContent = cssRules;
    }

    function applyFromInputs() {
        const charUrl = charAvatarUrlInput?.value.trim() || '';
        const userUrl = userAvatarUrlInput?.value.trim() || '';
        const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
        const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
        applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
    }

    const pendingDefaultUpdates = { char: false, user: false };
    let defaultUpdateScheduled = false;

    function scheduleDefaultRefresh({ char = false, user = false } = {}) {
        if (char) pendingDefaultUpdates.char = true;
        if (user) pendingDefaultUpdates.user = true;
        if (defaultUpdateScheduled) return;

        const run = () => {
            defaultUpdateScheduled = false;
            const prevChar = defaultAvatars.char;
            const prevUser = defaultAvatars.user;
            if (pendingDefaultUpdates.char) detectDefaultAvatar('char');
            if (pendingDefaultUpdates.user) detectDefaultAvatar('user');
            pendingDefaultUpdates.char = false;
            pendingDefaultUpdates.user = false;
            const charChanged = prevChar !== defaultAvatars.char;
            const userChanged = prevUser !== defaultAvatars.user;
            if (charChanged || userChanged) {
                applyFromInputs();
            }
        };

        defaultUpdateScheduled = true;
        if (windowRef?.requestAnimationFrame) {
            windowRef.requestAnimationFrame(run);
        } else if (windowRef?.setTimeout) {
            windowRef.setTimeout(run, 16);
        } else {
            setTimeout(run, 16);
        }
    }

    function elementMatchesSelectors(element, selectors = []) {
        if (!element || element.nodeType !== 1 || !selectors.length) return false;
        return selectors.some((selector) => {
            try {
                return element.matches?.(selector);
            } catch (error) {
                return false;
            }
        });
    }

    function nodeContainsSelectors(node, selectors = []) {
        if (!node || node.nodeType !== 1 || !selectors.length) return false;
        if (elementMatchesSelectors(node, selectors)) return true;
        return selectors.some((selector) => {
            try {
                return node.querySelector?.(selector);
            } catch (error) {
                return false;
            }
        });
    }

    function watchDefaultAvatarSources() {
        if (!documentRef?.body || !windowRef?.MutationObserver) return;
        const observer = new windowRef.MutationObserver((mutations) => {
            let shouldRefreshChar = false;
            let shouldRefreshUser = false;
            const charSelectors = avatarSelectorMap.char || [];
            const userSelectors = avatarSelectorMap.user || [];

            const inspectNode = (node) => {
                if (!node || node.nodeType !== 1) return;
                if (!shouldRefreshChar && nodeContainsSelectors(node, charSelectors)) {
                    shouldRefreshChar = true;
                }
                if (!shouldRefreshUser && nodeContainsSelectors(node, userSelectors)) {
                    shouldRefreshUser = true;
                }
            };

            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    if (!shouldRefreshChar && elementMatchesSelectors(target, charSelectors)) {
                        shouldRefreshChar = true;
                    }
                    if (!shouldRefreshUser && elementMatchesSelectors(target, userSelectors)) {
                        shouldRefreshUser = true;
                    }
                }

                if (mutation.type === 'childList') {
                    mutation.addedNodes?.forEach?.(inspectNode);
                    mutation.removedNodes?.forEach?.(inspectNode);
                }

                if (shouldRefreshChar && shouldRefreshUser) break;
            }

            if (shouldRefreshChar || shouldRefreshUser) {
                scheduleDefaultRefresh({
                    char: shouldRefreshChar,
                    user: shouldRefreshUser,
                });
            }
        });

        observer.observe(documentRef.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'style',
                'src',
                'srcset',
                'data-avatar',
                'data-src',
                'data-avatar-url',
                'data-bg',
                'class',
            ],
        });
    }

    function populateAvatarSelect() {
        if (!avatarProfileSelect) return;
        const savedSelection = avatarProfileSelect.value;
        avatarProfileSelect.innerHTML = '<option value="">选择配置...</option>';
        for (const profileName in avatarProfiles) {
            const option = documentRef.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            avatarProfileSelect.appendChild(option);
        }
        avatarProfileSelect.value = avatarProfiles[savedSelection]
            ? savedSelection
            : '';
    }

    function populateFrameSelect() {
        if (!frameProfileSelect) return;
        const savedSelection = frameProfileSelect.value;
        frameProfileSelect.innerHTML = '<option value="">选择配置...</option>';
        for (const profileName in frameProfiles) {
            const option = documentRef.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            frameProfileSelect.appendChild(option);
        }
        frameProfileSelect.value = frameProfiles[savedSelection]
            ? savedSelection
            : '';
    }

    function saveAvatarProfile() {
        if (!newAvatarProfileNameInput) return;
        const name = newAvatarProfileNameInput.value.trim();
        const charUrl = charAvatarUrlInput?.value.trim() || '';
        const userUrl = userAvatarUrlInput?.value.trim() || '';
        if (!name) {
            alertRef('请输入配置名称！');
            return;
        }
        if (!charUrl && !userUrl) {
            alertRef('请至少输入一个头像链接！');
            return;
        }
        avatarProfiles[name] = {
            char: charUrl,
            user: userUrl,
        };
        localStorageRef.setItem(
            'cip_avatar_profiles_v1',
            JSON.stringify(avatarProfiles),
        );
        newAvatarProfileNameInput.value = '';
        populateAvatarSelect();
        if (avatarProfileSelect) {
            avatarProfileSelect.value = name;
        }
        alertRef('头像配置已保存！');
    }

    function deleteAvatarProfile() {
        if (!avatarProfileSelect) return;
        const selected = avatarProfileSelect.value;
        if (!selected) {
            alertRef('请先选择一个要删除的配置。');
            return;
        }
        if (confirmRef(`确定要删除 "${selected}" 这个头像配置吗？`)) {
            delete avatarProfiles[selected];
            localStorageRef.setItem(
                'cip_avatar_profiles_v1',
                JSON.stringify(avatarProfiles),
            );
            populateAvatarSelect();
            if (charAvatarUrlInput) charAvatarUrlInput.value = '';
            if (userAvatarUrlInput) userAvatarUrlInput.value = '';
            if (charAvatarFrameUrlInput) charAvatarFrameUrlInput.value = '';
            if (userAvatarFrameUrlInput) userAvatarFrameUrlInput.value = '';
        }
    }

    function saveFrameProfile() {
        if (!newFrameProfileNameInput) return;
        const name = newFrameProfileNameInput.value.trim();
        const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
        const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
        if (!name) {
            alertRef('请输入头像框配置名称！');
            return;
        }
        if (!charFrameUrl && !userFrameUrl) {
            alertRef('请至少输入一个头像框链接！');
            return;
        }
        frameProfiles[name] = {
            charFrame: charFrameUrl,
            userFrame: userFrameUrl,
            charFrameAdj: { ...frameAdjustments.char },
            userFrameAdj: { ...frameAdjustments.user },
        };
        localStorageRef.setItem(
            'cip_frame_profiles_v1',
            JSON.stringify(frameProfiles),
        );
        newFrameProfileNameInput.value = '';
        populateFrameSelect();
        if (frameProfileSelect) frameProfileSelect.value = name;
        alertRef('头像框配置已保存！');
    }

    function deleteFrameProfile() {
        if (!frameProfileSelect) return;
        const selected = frameProfileSelect.value;
        if (!selected) {
            alertRef('请先选择一个要删除的头像框配置。');
            return;
        }
        if (confirmRef(`确定要删除 "${selected}" 这个头像框配置吗？`)) {
            delete frameProfiles[selected];
            localStorageRef.setItem(
                'cip_frame_profiles_v1',
                JSON.stringify(frameProfiles),
            );
            populateFrameSelect();
        }
    }

    function loadAvatarProfiles() {
        try {
            const savedProfiles = localStorageRef.getItem('cip_avatar_profiles_v1');
            avatarProfiles = savedProfiles ? JSON.parse(savedProfiles) : {};
        } catch (error) {
            console.warn('加载头像配置失败', error);
            avatarProfiles = {};
        }
        populateAvatarSelect();
        const lastProfileName = localStorageRef.getItem('cip_last_avatar_profile_v1');
        if (lastProfileName && avatarProfiles[lastProfileName]) {
            if (avatarProfileSelect) avatarProfileSelect.value = lastProfileName;
            const profile = avatarProfiles[lastProfileName];
            if (charAvatarUrlInput) charAvatarUrlInput.value = profile.char || '';
            if (userAvatarUrlInput) userAvatarUrlInput.value = profile.user || '';
            applyFromInputs();
        }
    }

    function loadFrameProfiles() {
        try {
            const savedProfiles = localStorageRef.getItem('cip_frame_profiles_v1');
            frameProfiles = savedProfiles ? JSON.parse(savedProfiles) : {};
        } catch (error) {
            console.warn('加载头像框配置失败', error);
            frameProfiles = {};
        }
        populateFrameSelect();
        const lastFrameProfileName = localStorageRef.getItem(
            'cip_last_frame_profile_v1',
        );
        if (lastFrameProfileName && frameProfiles[lastFrameProfileName]) {
            if (frameProfileSelect) frameProfileSelect.value = lastFrameProfileName;
            const profile = frameProfiles[lastFrameProfileName];
            if (charAvatarFrameUrlInput)
                charAvatarFrameUrlInput.value = profile.charFrame || '';
            if (userAvatarFrameUrlInput)
                userAvatarFrameUrlInput.value = profile.userFrame || '';
            if (profile.charFrameAdj) {
                frameAdjustments.char = { ...profile.charFrameAdj };
            }
            if (profile.userFrameAdj) {
                frameAdjustments.user = { ...profile.userFrameAdj };
            }
            applyFromInputs();
        } else {
            applyFromInputs();
        }
    }

    applyAvatarBtn?.addEventListener('click', () => {
        applyFromInputs();
    });

    avatarProfileSelect?.addEventListener('change', (e) => {
        const profileName = e.target.value;
        if (profileName && avatarProfiles[profileName]) {
            const profile = avatarProfiles[profileName];
            if (charAvatarUrlInput) charAvatarUrlInput.value = profile.char || '';
            if (userAvatarUrlInput) userAvatarUrlInput.value = profile.user || '';
            applyFromInputs();
            localStorageRef.setItem('cip_last_avatar_profile_v1', profileName);
        } else if (!profileName) {
            if (charAvatarUrlInput) charAvatarUrlInput.value = '';
            if (userAvatarUrlInput) userAvatarUrlInput.value = '';
            applyFromInputs();
            localStorageRef.removeItem('cip_last_avatar_profile_v1');
        }
    });

    saveAvatarBtn?.addEventListener('click', saveAvatarProfile);
    deleteAvatarBtn?.addEventListener('click', deleteAvatarProfile);

    frameProfileSelect?.addEventListener('change', (e) => {
        const profileName = e.target.value;
        if (profileName && frameProfiles[profileName]) {
            const profile = frameProfiles[profileName];
            if (charAvatarFrameUrlInput)
                charAvatarFrameUrlInput.value = profile.charFrame || '';
            if (userAvatarFrameUrlInput)
                userAvatarFrameUrlInput.value = profile.userFrame || '';
            if (profile.charFrameAdj) {
                frameAdjustments.char = { ...profile.charFrameAdj };
            }
            if (profile.userFrameAdj) {
                frameAdjustments.user = { ...profile.userFrameAdj };
            }
            applyFromInputs();
            localStorageRef.setItem('cip_last_frame_profile_v1', profileName);
        } else if (!profileName) {
            if (charAvatarFrameUrlInput) charAvatarFrameUrlInput.value = '';
            if (userAvatarFrameUrlInput) userAvatarFrameUrlInput.value = '';
            frameAdjustments.char = { size: 120, offsetX: 0, offsetY: 0 };
            frameAdjustments.user = { size: 120, offsetX: 0, offsetY: 0 };
            applyFromInputs();
            localStorageRef.removeItem('cip_last_frame_profile_v1');
        }
    });

    applyFrameBtn?.addEventListener('click', () => {
        applyFromInputs();
    });

    saveFrameBtn?.addEventListener('click', saveFrameProfile);
    deleteFrameBtn?.addEventListener('click', deleteFrameProfile);

    adjustCharFrameBtn?.addEventListener('click', () => {
        currentAdjustingFrame = 'char';
        if (frameAdjustTitle) frameAdjustTitle.textContent = '调整角色头像框';
        if (frameSizeSlider) frameSizeSlider.value = frameAdjustments.char.size;
        if (frameSizeValue)
            frameSizeValue.textContent = frameAdjustments.char.size;
        if (frameOffsetXSlider)
            frameOffsetXSlider.value = frameAdjustments.char.offsetX;
        if (frameOffsetXValue)
            frameOffsetXValue.textContent = frameAdjustments.char.offsetX;
        if (frameOffsetYSlider)
            frameOffsetYSlider.value = frameAdjustments.char.offsetY;
        if (frameOffsetYValue)
            frameOffsetYValue.textContent = frameAdjustments.char.offsetY;
        frameAdjustPanel?.classList.remove('hidden');
    });

    adjustUserFrameBtn?.addEventListener('click', () => {
        currentAdjustingFrame = 'user';
        if (frameAdjustTitle) frameAdjustTitle.textContent = '调整你的头像框';
        if (frameSizeSlider) frameSizeSlider.value = frameAdjustments.user.size;
        if (frameSizeValue)
            frameSizeValue.textContent = frameAdjustments.user.size;
        if (frameOffsetXSlider)
            frameOffsetXSlider.value = frameAdjustments.user.offsetX;
        if (frameOffsetXValue)
            frameOffsetXValue.textContent = frameAdjustments.user.offsetX;
        if (frameOffsetYSlider)
            frameOffsetYSlider.value = frameAdjustments.user.offsetY;
        if (frameOffsetYValue)
            frameOffsetYValue.textContent = frameAdjustments.user.offsetY;
        frameAdjustPanel?.classList.remove('hidden');
    });

    frameSizeSlider?.addEventListener('input', () => {
        if (!currentAdjustingFrame) return;
        const value = parseInt(frameSizeSlider.value, 10) || 120;
        frameAdjustments[currentAdjustingFrame].size = value;
        if (frameSizeValue) frameSizeValue.textContent = value;
        applyFromInputs();
    });

    frameOffsetXSlider?.addEventListener('input', () => {
        if (!currentAdjustingFrame) return;
        const value = parseInt(frameOffsetXSlider.value, 10) || 0;
        frameAdjustments[currentAdjustingFrame].offsetX = value;
        if (frameOffsetXValue) frameOffsetXValue.textContent = value;
        applyFromInputs();
    });

    frameOffsetYSlider?.addEventListener('input', () => {
        if (!currentAdjustingFrame) return;
        const value = parseInt(frameOffsetYSlider.value, 10) || 0;
        frameAdjustments[currentAdjustingFrame].offsetY = value;
        if (frameOffsetYValue) frameOffsetYValue.textContent = value;
        applyFromInputs();
    });

    frameResetBtn?.addEventListener('click', () => {
        if (!currentAdjustingFrame) return;
        frameAdjustments[currentAdjustingFrame] = {
            size: 120,
            offsetX: 0,
            offsetY: 0,
        };
        if (frameSizeSlider) frameSizeSlider.value = 120;
        if (frameSizeValue) frameSizeValue.textContent = 120;
        if (frameOffsetXSlider) frameOffsetXSlider.value = 0;
        if (frameOffsetXValue) frameOffsetXValue.textContent = 0;
        if (frameOffsetYSlider) frameOffsetYSlider.value = 0;
        if (frameOffsetYValue) frameOffsetYValue.textContent = 0;
        applyFromInputs();
    });

    frameCloseBtn?.addEventListener('click', () => {
        frameAdjustPanel?.classList.add('hidden');
    });

    if (unsplashAccessKeyInput) {
        unsplashAccessKeyInput.value = unsplashAccessKey || '';
        unsplashAccessKeyInput.addEventListener('input', (event) => {
            setUnsplashAccessKey(event.target.value || '');
        });
        unsplashAccessKeyInput.addEventListener('change', () => {
            if ((unsplashAccessKeyInput.value || '').trim()) {
                reprocessUnsplashPlaceholders();
            }
        });
    }

    initAvatarStyler();
    refreshDetectedDefaults();
    applyFromInputs();
    watchDefaultAvatarSources();
    loadAvatarProfiles();
    loadFrameProfiles();

    return {
        applyAvatars,
        refreshDefaultAvatars: refreshDetectedDefaults,
        getFrameAdjustments: () => ({
            char: { ...frameAdjustments.char },
            user: { ...frameAdjustments.user },
        }),
    };
}
