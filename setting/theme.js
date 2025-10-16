export function initThemeSettings(
    {
        colorInputs = [],
        colorPickers = [],
        themeSelect,
        newThemeNameInput,
        saveThemeBtn,
        deleteThemeBtn,
    },
    {
        documentRef = document,
        localStorageRef = localStorage,
    } = {},
) {
    const defaultTheme = {
        '--cip-accent-color': '#ff7f50',
        '--cip-accent-hover-color': '#e56a40',
        '--cip-insert-text-color': 'white',
        '--cip-panel-bg-color': 'rgba(255, 255, 255, 0.25)',
        '--cip-tabs-bg-color': 'transparent',
        '--cip-text-color': '#333333',
        '--cip-input-bg-color': 'rgba(255, 255, 255, 0.5)',
    };

    let themes = {};

    const colorInputList = Array.from(colorInputs || []);
    const colorPickerList = Array.from(colorPickers || []);

    function hexToRgba(hex, alpha = 0.3) {
        if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return null;
        let c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        const r = (c >> 16) & 255;
        const g = (c >> 8) & 255;
        const b = c & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function colorToHex(colorStr) {
        if (!colorStr) return '#000000';
        if (colorStr.startsWith('#')) return colorStr;
        const ctx = documentRef.createElement('canvas').getContext('2d');
        if (!ctx) return '#000000';
        if (colorStr === 'transparent') {
            return '#ffffff';
        }
        if (colorStr.startsWith('rgba')) {
            const parts = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (parts) {
                const r = parseInt(parts[1], 10).toString(16).padStart(2, '0');
                const g = parseInt(parts[2], 10).toString(16).padStart(2, '0');
                const b = parseInt(parts[3], 10).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
            }
        }
        ctx.fillStyle = colorStr;
        return ctx.fillStyle;
    }

    function updateColorInputs(theme) {
        colorInputList.forEach((input) => {
            const varName = input.dataset.var;
            const colorValue = theme[varName] || '';
            input.value = colorValue;
            const picker = documentRef.querySelector(
                `.cip-color-picker[data-target="${input.id}"]`,
            );
            if (picker) {
                picker.value = colorToHex(colorValue);
            }
        });
    }

    function applyTheme(theme) {
        const themeToApply = theme || defaultTheme;
        for (const [key, value] of Object.entries(themeToApply)) {
            documentRef.documentElement.style.setProperty(key, value);
        }
        const accentColor = themeToApply['--cip-accent-color'];
        const activeTabBg = hexToRgba(colorToHex(accentColor));
        documentRef.documentElement.style.setProperty(
            '--cip-active-bg-color',
            activeTabBg || 'rgba(128, 128, 128, 0.3)',
        );
        updateColorInputs(themeToApply);
    }

    function getColorsFromInputs() {
        const currentColors = {};
        colorInputList.forEach((input) => {
            currentColors[input.dataset.var] = input.value;
        });
        return currentColors;
    }

    function populateThemeSelect() {
        if (!themeSelect) return;
        const savedSelection = themeSelect.value;
        themeSelect.innerHTML = '<option value="default">默认</option>';
        for (const themeName in themes) {
            const option = documentRef.createElement('option');
            option.value = themeName;
            option.textContent = themeName;
            themeSelect.appendChild(option);
        }
        themeSelect.value = themes[savedSelection] ? savedSelection : 'default';
    }

    function saveCurrentTheme() {
        if (!newThemeNameInput) return;
        const name = newThemeNameInput.value.trim();
        if (!name) {
            alert('请输入配色方案名称');
            return;
        }
        themes[name] = getColorsFromInputs();
        localStorageRef.setItem('cip_theme_data_v1', JSON.stringify(themes));
        populateThemeSelect();
        themeSelect && (themeSelect.value = name);
        localStorageRef.setItem('cip_last_active_theme_v1', name);
        alert('主题已保存');
    }

    function deleteSelectedTheme() {
        if (!themeSelect) return;
        const selected = themeSelect.value;
        if (!selected || selected === 'default') {
            alert('请选择要删除的自定义主题');
            return;
        }
        if (confirm(`确定要删除主题 "${selected}" 吗？`)) {
            delete themes[selected];
            localStorageRef.setItem('cip_theme_data_v1', JSON.stringify(themes));
            populateThemeSelect();
            applyTheme(defaultTheme);
            localStorageRef.setItem('cip_last_active_theme_v1', 'default');
        }
    }

    function loadThemes() {
        try {
            const savedThemes = localStorageRef.getItem('cip_theme_data_v1');
            if (savedThemes) {
                themes = JSON.parse(savedThemes);
            }
        } catch (error) {
            console.warn('加载主题设置失败', error);
            themes = {};
        }
        populateThemeSelect();
        const lastThemeName =
            localStorageRef.getItem('cip_last_active_theme_v1') || 'default';
        const themeToApply = themes[lastThemeName] || defaultTheme;
        if (themeSelect) {
            themeSelect.value = themes[lastThemeName] ? lastThemeName : 'default';
        }
        applyTheme(themeToApply);
    }

    colorInputList.forEach((input) => {
        input.addEventListener('input', (e) => {
            const textInput = e.currentTarget;
            const property = textInput.dataset.var;
            const value = textInput.value.trim();
            documentRef.documentElement.style.setProperty(property, value);
            const picker = documentRef.querySelector(
                `.cip-color-picker[data-target="${textInput.id}"]`,
            );
            if (picker) {
                picker.value = colorToHex(value);
            }
            if (property === '--cip-accent-color') {
                const activeTabBg = hexToRgba(colorToHex(value));
                documentRef.documentElement.style.setProperty(
                    '--cip-active-bg-color',
                    activeTabBg || 'rgba(128, 128, 128, 0.3)',
                );
            }
        });
    });

    colorPickerList.forEach((picker) => {
        picker.addEventListener('input', (e) => {
            const colorPicker = e.currentTarget;
            const targetInputId = colorPicker.dataset.target;
            const textInput = documentRef.getElementById(targetInputId);
            if (textInput) {
                textInput.value = colorPicker.value;
                textInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    themeSelect?.addEventListener('change', (e) => {
        const themeName = e.target.value;
        const theme = themeName === 'default' ? defaultTheme : themes[themeName];
        applyTheme(theme);
        localStorageRef.setItem('cip_last_active_theme_v1', themeName);
    });

    saveThemeBtn?.addEventListener('click', saveCurrentTheme);
    deleteThemeBtn?.addEventListener('click', deleteSelectedTheme);

    loadThemes();

    return {
        applyTheme,
        getDefaultTheme: () => ({ ...defaultTheme }),
    };
}
