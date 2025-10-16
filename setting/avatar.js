export function initAvatarSettings({
    document,
    elements,
    unsplash = {},
}) {
    if (!elements) {
        throw new Error('Avatar settings require element references');
    }

    const {
        charAvatarUrlInput,
        userAvatarUrlInput,
        charAvatarFrameUrlInput,
        userAvatarFrameUrlInput,
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
    } = elements;

    const {
        input: unsplashAccessKeyInput,
        initialValue: unsplashInitialValue = '',
        setAccessKey = () => {},
        reprocessPlaceholders = () => {},
    } = unsplash;

    let avatarStyleTag = null;
    let avatarProfiles = {};
    let frameProfiles = {};
    let currentAdjustingFrame = null;
    let frameAdjustments = {
        char: { size: 120, offsetX: 0, offsetY: 0 },
        user: { size: 120, offsetX: 0, offsetY: 0 },
    };

    function initAvatarStyler() {
        avatarStyleTag = document.getElementById('cip-avatar-styler');
        if (!avatarStyleTag) {
            avatarStyleTag = document.createElement('style');
            avatarStyleTag.id = 'cip-avatar-styler';
            document.head.appendChild(avatarStyleTag);
        }
    }

    function applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl) {
        if (!avatarStyleTag) {
            console.error('CIP Error: Avatar styler tag not found.');
            return;
        }
        let cssRules = '';
        cssRules +=
            `.custom-B_C_avar, .custom-B_U_avar { position: relative; overflow: visible !important; }\n`;

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
            cssRules +=
                `.custom-B_C_avar::after { content: ""; position: absolute; top: 50%; left: 50%; width: ${charAdj.size}%; height: ${charAdj.size}%; transform: translate(${charTransformX}%, ${charTransformY}%); background-image: url('${safeCharFrameUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; pointer-events: none; z-index: 1; }\n`;
        }
        if (userFrameUrl) {
            const safeUserFrameUrl = userFrameUrl.replace(/'/g, "\\'");
            const userAdj = frameAdjustments.user;
            const userTransformX = -50 + userAdj.offsetX;
            const userTransformY = -50 + userAdj.offsetY;
            cssRules +=
                `.custom-B_U_avar::after { content: ""; position: absolute; top: 50%; left: 50%; width: ${userAdj.size}%; height: ${userAdj.size}%; transform: translate(${userTransformX}%, ${userTransformY}%); background-image: url('${safeUserFrameUrl}'); background-repeat: no-repeat; background-position: center; background-size: contain; pointer-events: none; z-index: 1; }\n`;
        }

        avatarStyleTag.textContent = cssRules;
    }

    function populateAvatarSelect() {
        if (!avatarProfileSelect) return;
        const savedSelection = avatarProfileSelect.value;
        avatarProfileSelect.innerHTML = '<option value="">选择配置...</option>';
        Object.keys(avatarProfiles).forEach((profileName) => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            avatarProfileSelect.appendChild(option);
        });
        avatarProfileSelect.value = avatarProfiles[savedSelection]
            ? savedSelection
            : '';
    }

    function saveAvatarProfile() {
        if (!newAvatarProfileNameInput) return;
        const name = newAvatarProfileNameInput.value.trim();
        const charUrl = charAvatarUrlInput?.value.trim() || '';
        const userUrl = userAvatarUrlInput?.value.trim() || '';

        if (!name) {
            alert('请输入配置名称！');
            return;
        }
        if (!charUrl && !userUrl) {
            alert('请至少输入一个头像链接！');
            return;
        }

        avatarProfiles[name] = {
            char: charUrl,
            user: userUrl,
        };
        localStorage.setItem(
            'cip_avatar_profiles_v1',
            JSON.stringify(avatarProfiles),
        );
        newAvatarProfileNameInput.value = '';
        populateAvatarSelect();
        if (avatarProfileSelect) {
            avatarProfileSelect.value = name;
        }
        alert('头像配置已保存！');
    }

    function deleteAvatarProfile() {
        if (!avatarProfileSelect) return;
        const selected = avatarProfileSelect.value;
        if (!selected) {
            alert('请先选择一个要删除的配置。');
            return;
        }
        if (confirm(`确定要删除 "${selected}" 这个头像配置吗？`)) {
            delete avatarProfiles[selected];
            localStorage.setItem(
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

    function loadAvatarProfiles() {
        const savedProfiles = localStorage.getItem('cip_avatar_profiles_v1');
        if (savedProfiles) {
            avatarProfiles = JSON.parse(savedProfiles);
        }
        populateAvatarSelect();
        const lastProfileName = localStorage.getItem('cip_last_avatar_profile_v1');
        if (lastProfileName && avatarProfiles[lastProfileName]) {
            if (avatarProfileSelect) {
                avatarProfileSelect.value = lastProfileName;
                avatarProfileSelect.dispatchEvent(new Event('change'));
            }
        }
    }

    function populateFrameSelect() {
        if (!frameProfileSelect) return;
        const savedSelection = frameProfileSelect.value;
        frameProfileSelect.innerHTML = '<option value="">选择头像框配置...</option>';
        Object.keys(frameProfiles).forEach((profileName) => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            frameProfileSelect.appendChild(option);
        });
        frameProfileSelect.value = frameProfiles[savedSelection]
            ? savedSelection
            : '';
    }

    function saveFrameProfile() {
        if (!newFrameProfileNameInput) return;
        const name = newFrameProfileNameInput.value.trim();
        const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
        const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';

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
        localStorage.setItem(
            'cip_frame_profiles_v1',
            JSON.stringify(frameProfiles),
        );
        newFrameProfileNameInput.value = '';
        populateFrameSelect();
        if (frameProfileSelect) {
            frameProfileSelect.value = name;
        }
        alert('头像框配置已保存！');
    }

    function deleteFrameProfile() {
        if (!frameProfileSelect) return;
        const selected = frameProfileSelect.value;
        if (!selected) {
            alert('请先选择一个要删除的头像框配置。');
            return;
        }
        if (confirm(`确定要删除 "${selected}" 这个头像框配置吗？`)) {
            delete frameProfiles[selected];
            localStorage.setItem(
                'cip_frame_profiles_v1',
                JSON.stringify(frameProfiles),
            );
            populateFrameSelect();
            if (charAvatarFrameUrlInput) charAvatarFrameUrlInput.value = '';
            if (userAvatarFrameUrlInput) userAvatarFrameUrlInput.value = '';
            frameAdjustments = {
                char: { size: 120, offsetX: 0, offsetY: 0 },
                user: { size: 120, offsetX: 0, offsetY: 0 },
            };
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, '', '');
        }
    }

    function loadFrameProfiles() {
        const savedProfiles = localStorage.getItem('cip_frame_profiles_v1');
        if (savedProfiles) {
            frameProfiles = JSON.parse(savedProfiles);
        }
        populateFrameSelect();
        const lastFrameProfileName = localStorage.getItem(
            'cip_last_frame_profile_v1',
        );
        if (lastFrameProfileName && frameProfiles[lastFrameProfileName]) {
            if (frameProfileSelect) {
                frameProfileSelect.value = lastFrameProfileName;
                frameProfileSelect.dispatchEvent(new Event('change'));
            }
        }
    }

    function bindAvatarEvents() {
        applyAvatarBtn?.addEventListener('click', () => {
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
            const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
        });

        avatarProfileSelect?.addEventListener('change', (e) => {
            const profileName = e.target.value;
            if (profileName && avatarProfiles[profileName]) {
                const profile = avatarProfiles[profileName];
                if (charAvatarUrlInput) charAvatarUrlInput.value = profile.char || '';
                if (userAvatarUrlInput) userAvatarUrlInput.value = profile.user || '';
                const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
                const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
                applyAvatars(profile.char, profile.user, charFrameUrl, userFrameUrl);
                localStorage.setItem('cip_last_avatar_profile_v1', profileName);
            } else if (!profileName) {
                if (charAvatarUrlInput) charAvatarUrlInput.value = '';
                if (userAvatarUrlInput) userAvatarUrlInput.value = '';
                const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
                const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
                applyAvatars('', '', charFrameUrl, userFrameUrl);
                localStorage.removeItem('cip_last_avatar_profile_v1');
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
                const charUrl = charAvatarUrlInput?.value.trim() || '';
                const userUrl = userAvatarUrlInput?.value.trim() || '';
                applyAvatars(charUrl, userUrl, profile.charFrame, profile.userFrame);
                localStorage.setItem(
                    'cip_last_frame_profile_v1',
                    profileName,
                );
            } else if (!profileName) {
                if (charAvatarFrameUrlInput) charAvatarFrameUrlInput.value = '';
                if (userAvatarFrameUrlInput) userAvatarFrameUrlInput.value = '';
                frameAdjustments = {
                    char: { size: 120, offsetX: 0, offsetY: 0 },
                    user: { size: 120, offsetX: 0, offsetY: 0 },
                };
                const charUrl = charAvatarUrlInput?.value.trim() || '';
                const userUrl = userAvatarUrlInput?.value.trim() || '';
                applyAvatars(charUrl, userUrl, '', '');
                localStorage.removeItem('cip_last_frame_profile_v1');
            }
        });

        applyFrameBtn?.addEventListener('click', () => {
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
            const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
        });

        saveFrameBtn?.addEventListener('click', saveFrameProfile);
        deleteFrameBtn?.addEventListener('click', deleteFrameProfile);

        adjustCharFrameBtn?.addEventListener('click', () => {
            currentAdjustingFrame = 'char';
            if (frameAdjustTitle)
                frameAdjustTitle.textContent = '调整角色头像框';
            if (frameSizeSlider)
                frameSizeSlider.value = String(frameAdjustments.char.size);
            if (frameSizeValue)
                frameSizeValue.textContent = String(frameAdjustments.char.size);
            if (frameOffsetXSlider)
                frameOffsetXSlider.value = String(frameAdjustments.char.offsetX);
            if (frameOffsetXValue)
                frameOffsetXValue.textContent = String(
                    frameAdjustments.char.offsetX,
                );
            if (frameOffsetYSlider)
                frameOffsetYSlider.value = String(frameAdjustments.char.offsetY);
            if (frameOffsetYValue)
                frameOffsetYValue.textContent = String(
                    frameAdjustments.char.offsetY,
                );
            frameAdjustPanel?.classList.remove('hidden');
        });

        adjustUserFrameBtn?.addEventListener('click', () => {
            currentAdjustingFrame = 'user';
            if (frameAdjustTitle)
                frameAdjustTitle.textContent = '调整你的头像框';
            if (frameSizeSlider)
                frameSizeSlider.value = String(frameAdjustments.user.size);
            if (frameSizeValue)
                frameSizeValue.textContent = String(frameAdjustments.user.size);
            if (frameOffsetXSlider)
                frameOffsetXSlider.value = String(frameAdjustments.user.offsetX);
            if (frameOffsetXValue)
                frameOffsetXValue.textContent = String(
                    frameAdjustments.user.offsetX,
                );
            if (frameOffsetYSlider)
                frameOffsetYSlider.value = String(frameAdjustments.user.offsetY);
            if (frameOffsetYValue)
                frameOffsetYValue.textContent = String(
                    frameAdjustments.user.offsetY,
                );
            frameAdjustPanel?.classList.remove('hidden');
        });

        frameSizeSlider?.addEventListener('input', (e) => {
            if (frameSizeValue)
                frameSizeValue.textContent = String(e.target.value);
            if (!currentAdjustingFrame) return;
            frameAdjustments[currentAdjustingFrame].size = parseInt(
                e.target.value,
                10,
            );
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
            const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
        });

        frameOffsetXSlider?.addEventListener('input', (e) => {
            if (frameOffsetXValue)
                frameOffsetXValue.textContent = String(e.target.value);
            if (!currentAdjustingFrame) return;
            frameAdjustments[currentAdjustingFrame].offsetX = parseInt(
                e.target.value,
                10,
            );
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
            const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
        });

        frameOffsetYSlider?.addEventListener('input', (e) => {
            if (frameOffsetYValue)
                frameOffsetYValue.textContent = String(e.target.value);
            if (!currentAdjustingFrame) return;
            frameAdjustments[currentAdjustingFrame].offsetY = parseInt(
                e.target.value,
                10,
            );
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
            const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
        });

        frameResetBtn?.addEventListener('click', () => {
            if (!currentAdjustingFrame) return;
            frameAdjustments[currentAdjustingFrame] = {
                size: 120,
                offsetX: 0,
                offsetY: 0,
            };
            if (frameSizeSlider) frameSizeSlider.value = '120';
            if (frameSizeValue) frameSizeValue.textContent = '120';
            if (frameOffsetXSlider) frameOffsetXSlider.value = '0';
            if (frameOffsetXValue) frameOffsetXValue.textContent = '0';
            if (frameOffsetYSlider) frameOffsetYSlider.value = '0';
            if (frameOffsetYValue) frameOffsetYValue.textContent = '0';
            const charUrl = charAvatarUrlInput?.value.trim() || '';
            const userUrl = userAvatarUrlInput?.value.trim() || '';
            const charFrameUrl = charAvatarFrameUrlInput?.value.trim() || '';
            const userFrameUrl = userAvatarFrameUrlInput?.value.trim() || '';
            applyAvatars(charUrl, userUrl, charFrameUrl, userFrameUrl);
        });

        frameCloseBtn?.addEventListener('click', () => {
            frameAdjustPanel?.classList.add('hidden');
        });
    }

    function bindUnsplashInputs() {
        if (!unsplashAccessKeyInput) return;
        unsplashAccessKeyInput.value = unsplashInitialValue || '';
        unsplashAccessKeyInput.addEventListener('input', (event) => {
            setAccessKey(event.target.value || '');
        });
        unsplashAccessKeyInput.addEventListener('change', () => {
            reprocessPlaceholders();
        });
    }

    initAvatarStyler();
    bindAvatarEvents();
    bindUnsplashInputs();

    return {
        applyAvatars,
        loadAvatarProfiles,
        loadFrameProfiles,
    };
}
