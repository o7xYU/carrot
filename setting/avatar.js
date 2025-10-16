const defaultFrameAdjustment = { size: 120, offsetX: 0, offsetY: 0 };

const state = {
    charAvatarUrlInput: null,
    userAvatarUrlInput: null,
    charAvatarFrameUrlInput: null,
    userAvatarFrameUrlInput: null,
    unsplashAccessKeyInput: null,
    avatarProfileSelect: null,
    applyAvatarBtn: null,
    deleteAvatarBtn: null,
    newAvatarProfileNameInput: null,
    saveAvatarBtn: null,
    frameProfileSelect: null,
    applyFrameBtn: null,
    deleteFrameBtn: null,
    newFrameProfileNameInput: null,
    saveFrameBtn: null,
    adjustCharFrameBtn: null,
    adjustUserFrameBtn: null,
    frameAdjustPanel: null,
    frameAdjustTitle: null,
    frameSizeSlider: null,
    frameSizeValue: null,
    frameOffsetXSlider: null,
    frameOffsetXValue: null,
    frameOffsetYSlider: null,
    frameOffsetYValue: null,
    frameResetBtn: null,
    frameCloseBtn: null,
    unsplashAccessKey: '',
    setUnsplashAccessKey: null,
    reprocessUnsplashPlaceholders: null,
};

let avatarStyleTag = null;
let avatarProfiles = {};
let frameProfiles = {};
let currentAdjustingFrame = null;
let frameAdjustments = {
    char: { ...defaultFrameAdjustment },
    user: { ...defaultFrameAdjustment },
};

function assignState(elements = {}) {
    Object.assign(state, elements);
}

function safeValue(input) {
    return input?.value?.trim() || '';
}

function createOrGetStyleTag() {
    avatarStyleTag = document.getElementById('cip-avatar-styler');
    if (!avatarStyleTag) {
        avatarStyleTag = document.createElement('style');
        avatarStyleTag.id = 'cip-avatar-styler';
        document.head.appendChild(avatarStyleTag);
    }
}

function applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl) {
    if (!avatarStyleTag) {
        console.error('CIP Error: Avatar styler tag not found! Was initAvatarStyler() called?');
        return;
    }

    let cssRules = '';
    cssRules += `.custom-B_C_avar, .custom-B_U_avar { position: relative; overflow: visible !important; }\n`;

    if (charUrl) {
        const safeCharUrl = charUrl.replace(/'/g, "\\'");
        cssRules += `.custom-B_C_avar { background-image: url('${safeCharUrl}') !important; }\n`;
    }
    if (userUrl) {
        const safeUserUrl = userUrl.replace(/'/g, "\\'");
        cssRules += `.custom-B_U_avar { background-image: url('${safeUserUrl}') !important; }\n`;
    }

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

function populateAvatarSelect() {
    const { avatarProfileSelect } = state;
    if (!avatarProfileSelect) return;
    const savedSelection = avatarProfileSelect.value;
    avatarProfileSelect.innerHTML = '<option value="">选择配置...</option>';
    for (const profileName in avatarProfiles) {
        const option = document.createElement('option');
        option.value = profileName;
        option.textContent = profileName;
        avatarProfileSelect.appendChild(option);
    }
    avatarProfileSelect.value = avatarProfiles[savedSelection] ? savedSelection : '';
}

function populateFrameSelect() {
    const { frameProfileSelect } = state;
    if (!frameProfileSelect) return;
    const savedSelection = frameProfileSelect.value;
    frameProfileSelect.innerHTML = '<option value="">选择配置...</option>';
    for (const profileName in frameProfiles) {
        const option = document.createElement('option');
        option.value = profileName;
        option.textContent = profileName;
        frameProfileSelect.appendChild(option);
    }
    frameProfileSelect.value = frameProfiles[savedSelection] ? savedSelection : '';
}

function saveAvatarProfile() {
    const { newAvatarProfileNameInput, charAvatarUrlInput, userAvatarUrlInput, avatarProfileSelect } = state;
    if (!newAvatarProfileNameInput || !charAvatarUrlInput || !userAvatarUrlInput || !avatarProfileSelect) return;
    const name = newAvatarProfileNameInput.value.trim();
    if (!name) {
        alert('请输入头像配置名称！');
        return;
    }
    avatarProfiles[name] = {
        char: safeValue(charAvatarUrlInput),
        user: safeValue(userAvatarUrlInput),
    };
    localStorage.setItem('cip_avatar_profiles_v1', JSON.stringify(avatarProfiles));
    newAvatarProfileNameInput.value = '';
    populateAvatarSelect();
    avatarProfileSelect.value = name;
    alert('头像配置已保存！');
}

function deleteAvatarProfile() {
    const { avatarProfileSelect, charAvatarUrlInput, userAvatarUrlInput } = state;
    if (!avatarProfileSelect || !charAvatarUrlInput || !userAvatarUrlInput) return;
    const selected = avatarProfileSelect.value;
    if (!selected) {
        alert('请先选择一个要删除的头像配置。');
        return;
    }
    if (!confirm(`确定要删除 "${selected}" 这个头像配置吗？`)) return;
    delete avatarProfiles[selected];
    localStorage.setItem('cip_avatar_profiles_v1', JSON.stringify(avatarProfiles));
    populateAvatarSelect();
    charAvatarUrlInput.value = '';
    userAvatarUrlInput.value = '';
    const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
    const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
    applyAvatars('', '', charFrameUrl, userFrameUrl);
}

function saveFrameProfile() {
    const {
        newFrameProfileNameInput,
        charAvatarFrameUrlInput,
        userAvatarFrameUrlInput,
        frameProfileSelect,
    } = state;
    if (!newFrameProfileNameInput || !charAvatarFrameUrlInput || !userAvatarFrameUrlInput || !frameProfileSelect) return;
    const name = newFrameProfileNameInput.value.trim();
    const charFrameUrl = safeValue(charAvatarFrameUrlInput);
    const userFrameUrl = safeValue(userAvatarFrameUrlInput);
    if (!name) {
        alert('请输入头像框配置名称！');
        return;
    }
    if (!charFrameUrl && !userFrameUrl) {
        alert('请至少输入一个头像框链接！');
        return;
    }
    frameProfiles[name] = {
        charFrame: charFrameUrl,
        userFrame: userFrameUrl,
        charFrameAdj: { ...frameAdjustments.char },
        userFrameAdj: { ...frameAdjustments.user },
    };
    localStorage.setItem('cip_frame_profiles_v1', JSON.stringify(frameProfiles));
    newFrameProfileNameInput.value = '';
    populateFrameSelect();
    frameProfileSelect.value = name;
    alert('头像框配置已保存！');
}

function deleteFrameProfile() {
    const { frameProfileSelect, charAvatarFrameUrlInput, userAvatarFrameUrlInput } = state;
    if (!frameProfileSelect || !charAvatarFrameUrlInput || !userAvatarFrameUrlInput) return;
    const selected = frameProfileSelect.value;
    if (!selected) {
        alert('请先选择一个要删除的头像框配置。');
        return;
    }
    if (!confirm(`确定要删除 "${selected}" 这个头像框配置吗？`)) return;
    delete frameProfiles[selected];
    localStorage.setItem('cip_frame_profiles_v1', JSON.stringify(frameProfiles));
    populateFrameSelect();
    charAvatarFrameUrlInput.value = '';
    userAvatarFrameUrlInput.value = '';
    frameAdjustments = {
        char: { ...defaultFrameAdjustment },
        user: { ...defaultFrameAdjustment },
    };
    const charUrl = safeValue(state.charAvatarUrlInput);
    const userUrl = safeValue(state.userAvatarUrlInput);
    applyAvatars(charUrl, userUrl, '', '');
}

function openFrameAdjustPanel(type) {
    const {
        frameAdjustPanel,
        frameAdjustTitle,
        frameSizeSlider,
        frameSizeValue,
        frameOffsetXSlider,
        frameOffsetXValue,
        frameOffsetYSlider,
        frameOffsetYValue,
    } = state;
    currentAdjustingFrame = type;
    const isChar = type === 'char';
    const adjustments = frameAdjustments[type];
    if (!frameAdjustPanel || !frameAdjustTitle || !frameSizeSlider || !frameSizeValue || !frameOffsetXSlider || !frameOffsetXValue || !frameOffsetYSlider || !frameOffsetYValue) return;
    frameAdjustTitle.textContent = isChar ? '调整角色头像框' : '调整你的头像框';
    frameSizeSlider.value = adjustments.size;
    frameSizeValue.textContent = adjustments.size;
    frameOffsetXSlider.value = adjustments.offsetX;
    frameOffsetXValue.textContent = adjustments.offsetX;
    frameOffsetYSlider.value = adjustments.offsetY;
    frameOffsetYValue.textContent = adjustments.offsetY;
    frameAdjustPanel.classList.remove('hidden');
}

function updateFrameAdjustment(field, value) {
    if (!currentAdjustingFrame) return;
    frameAdjustments[currentAdjustingFrame][field] = value;
    const charUrl = safeValue(state.charAvatarUrlInput);
    const userUrl = safeValue(state.userAvatarUrlInput);
    const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
    const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
    applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
}

function resetCurrentAdjustment() {
    if (!currentAdjustingFrame) return;
    frameAdjustments[currentAdjustingFrame] = { ...defaultFrameAdjustment };
    const {
        frameSizeSlider,
        frameSizeValue,
        frameOffsetXSlider,
        frameOffsetXValue,
        frameOffsetYSlider,
        frameOffsetYValue,
    } = state;
    if (frameSizeSlider && frameSizeValue) {
        frameSizeSlider.value = defaultFrameAdjustment.size;
        frameSizeValue.textContent = defaultFrameAdjustment.size;
    }
    if (frameOffsetXSlider && frameOffsetXValue) {
        frameOffsetXSlider.value = defaultFrameAdjustment.offsetX;
        frameOffsetXValue.textContent = defaultFrameAdjustment.offsetX;
    }
    if (frameOffsetYSlider && frameOffsetYValue) {
        frameOffsetYSlider.value = defaultFrameAdjustment.offsetY;
        frameOffsetYValue.textContent = defaultFrameAdjustment.offsetY;
    }
    const charUrl = safeValue(state.charAvatarUrlInput);
    const userUrl = safeValue(state.userAvatarUrlInput);
    const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
    const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
    applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
}

function closeFrameAdjustPanel() {
    state.frameAdjustPanel?.classList.add('hidden');
    currentAdjustingFrame = null;
}

function handleAvatarProfileChange(profileName) {
    const { charAvatarUrlInput, userAvatarUrlInput } = state;
    if (!charAvatarUrlInput || !userAvatarUrlInput) return;
    if (profileName && avatarProfiles[profileName]) {
        const profile = avatarProfiles[profileName];
        charAvatarUrlInput.value = profile.char || '';
        userAvatarUrlInput.value = profile.user || '';
        const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
        const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
        applyAvatars(profile.char, profile.user, charFrameUrl, userFrameUrl);
        localStorage.setItem('cip_last_avatar_profile_v1', profileName);
    } else if (!profileName) {
        charAvatarUrlInput.value = '';
        userAvatarUrlInput.value = '';
        const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
        const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
        applyAvatars('', '', charFrameUrl, userFrameUrl);
        localStorage.removeItem('cip_last_avatar_profile_v1');
    }
}

function handleFrameProfileChange(profileName) {
    const {
        charAvatarFrameUrlInput,
        userAvatarFrameUrlInput,
    } = state;
    if (!charAvatarFrameUrlInput || !userAvatarFrameUrlInput) return;
    if (profileName && frameProfiles[profileName]) {
        const profile = frameProfiles[profileName];
        charAvatarFrameUrlInput.value = profile.charFrame || '';
        userAvatarFrameUrlInput.value = profile.userFrame || '';
        if (profile.charFrameAdj) {
            frameAdjustments.char = { ...profile.charFrameAdj };
        }
        if (profile.userFrameAdj) {
            frameAdjustments.user = { ...profile.userFrameAdj };
        }
        const charUrl = safeValue(state.charAvatarUrlInput);
        const userUrl = safeValue(state.userAvatarUrlInput);
        applyAvatars(charUrl, userUrl, profile.charFrame, profile.userFrame);
        localStorage.setItem('cip_last_frame_profile_v1', profileName);
    } else if (!profileName) {
        charAvatarFrameUrlInput.value = '';
        userAvatarFrameUrlInput.value = '';
        frameAdjustments = {
            char: { ...defaultFrameAdjustment },
            user: { ...defaultFrameAdjustment },
        };
        const charUrl = safeValue(state.charAvatarUrlInput);
        const userUrl = safeValue(state.userAvatarUrlInput);
        applyAvatars(charUrl, userUrl, '', '');
        localStorage.removeItem('cip_last_frame_profile_v1');
    }
}

export function initAvatarSettings({
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
    frameProfileSelect,
    applyFrameBtn,
    deleteFrameBtn,
    newFrameProfileNameInput,
    saveFrameBtn,
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
    unsplashAccessKey = '',
    setUnsplashAccessKey = () => {},
    reprocessUnsplashPlaceholders = () => {},
} = {}) {
    assignState({
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
        frameProfileSelect,
        applyFrameBtn,
        deleteFrameBtn,
        newFrameProfileNameInput,
        saveFrameBtn,
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
        unsplashAccessKey,
        setUnsplashAccessKey,
        reprocessUnsplashPlaceholders,
    });

    if (state.unsplashAccessKeyInput) {
        state.unsplashAccessKeyInput.value = state.unsplashAccessKey;
        state.unsplashAccessKeyInput.addEventListener('input', (event) => {
            state.setUnsplashAccessKey(event.target.value || '');
        });
        state.unsplashAccessKeyInput.addEventListener('change', () => {
            if (state.unsplashAccessKeyInput?.value) {
                state.reprocessUnsplashPlaceholders();
            }
        });
    }

    state.applyAvatarBtn?.addEventListener('click', () => {
        const charUrl = safeValue(state.charAvatarUrlInput);
        const userUrl = safeValue(state.userAvatarUrlInput);
        const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
        const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
        applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
    });

    state.avatarProfileSelect?.addEventListener('change', (e) => {
        handleAvatarProfileChange(e.target.value);
    });

    state.saveAvatarBtn?.addEventListener('click', saveAvatarProfile);
    state.deleteAvatarBtn?.addEventListener('click', deleteAvatarProfile);

    state.frameProfileSelect?.addEventListener('change', (e) => {
        handleFrameProfileChange(e.target.value);
    });

    state.applyFrameBtn?.addEventListener('click', () => {
        const charUrl = safeValue(state.charAvatarUrlInput);
        const userUrl = safeValue(state.userAvatarUrlInput);
        const charFrameUrl = safeValue(state.charAvatarFrameUrlInput);
        const userFrameUrl = safeValue(state.userAvatarFrameUrlInput);
        applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
    });

    state.saveFrameBtn?.addEventListener('click', saveFrameProfile);
    state.deleteFrameBtn?.addEventListener('click', deleteFrameProfile);

    state.adjustCharFrameBtn?.addEventListener('click', () => {
        openFrameAdjustPanel('char');
    });

    state.adjustUserFrameBtn?.addEventListener('click', () => {
        openFrameAdjustPanel('user');
    });

    state.frameSizeSlider?.addEventListener('input', (e) => {
        if (state.frameSizeValue) {
            state.frameSizeValue.textContent = e.target.value;
        }
        updateFrameAdjustment('size', parseInt(e.target.value, 10));
    });

    state.frameOffsetXSlider?.addEventListener('input', (e) => {
        if (state.frameOffsetXValue) {
            state.frameOffsetXValue.textContent = e.target.value;
        }
        updateFrameAdjustment('offsetX', parseInt(e.target.value, 10));
    });

    state.frameOffsetYSlider?.addEventListener('input', (e) => {
        if (state.frameOffsetYValue) {
            state.frameOffsetYValue.textContent = e.target.value;
        }
        updateFrameAdjustment('offsetY', parseInt(e.target.value, 10));
    });

    state.frameResetBtn?.addEventListener('click', () => {
        resetCurrentAdjustment();
    });

    state.frameCloseBtn?.addEventListener('click', () => {
        closeFrameAdjustPanel();
    });
}

export function initAvatarStyler() {
    createOrGetStyleTag();
}

export function loadAvatarProfiles() {
    try {
        const savedProfiles = localStorage.getItem('cip_avatar_profiles_v1');
        if (savedProfiles) {
            avatarProfiles = JSON.parse(savedProfiles);
        }
    } catch (error) {
        console.error('胡萝卜插件：加载头像配置失败', error);
        avatarProfiles = {};
    }
    populateAvatarSelect();
    const lastProfileName = localStorage.getItem('cip_last_avatar_profile_v1');
    if (lastProfileName && avatarProfiles[lastProfileName] && state.avatarProfileSelect) {
        state.avatarProfileSelect.value = lastProfileName;
        state.avatarProfileSelect.dispatchEvent(new Event('change'));
    }
}

export function loadFrameProfiles() {
    try {
        const savedProfiles = localStorage.getItem('cip_frame_profiles_v1');
        if (savedProfiles) {
            frameProfiles = JSON.parse(savedProfiles);
        }
    } catch (error) {
        console.error('胡萝卜插件：加载头像框配置失败', error);
        frameProfiles = {};
    }
    populateFrameSelect();
    const lastFrameProfileName = localStorage.getItem('cip_last_frame_profile_v1');
    if (lastFrameProfileName && frameProfiles[lastFrameProfileName] && state.frameProfileSelect) {
        state.frameProfileSelect.value = lastFrameProfileName;
        state.frameProfileSelect.dispatchEvent(new Event('change'));
    }
}

export function getAvatarState() {
    return {
        applyAvatars,
        handleAvatarProfileChange,
        handleFrameProfileChange,
    };
}
