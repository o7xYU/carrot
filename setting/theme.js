export function initThemeSettings({
    document,
    colorInputs = [],
    colorPickers = [],
    themeSelect,
    newThemeNameInput,
    saveThemeBtn,
    deleteThemeBtn,
}) {
    const inputList = Array.from(colorInputs);
    const pickerList = Array.from(colorPickers);

    let themes = {};
    const defaultTheme = {
        '--cip-accent-color': '#ff7f50',
        '--cip-accent-hover-color': '#e56a40',
        '--cip-insert-text-color': 'white',
        '--cip-panel-bg-color': 'rgba(255, 255, 255, 0.25)',
        '--cip-tabs-bg-color': 'transparent',
        '--cip-text-color': '#333333',
        '--cip-input-bg-color': 'rgba(255, 255, 255, 0.5)',
    };

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
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return '#000000';
        if (colorStr === 'transparent') {
            return '#000000';
        }
        if (colorStr.startsWith('rgba')) {
            const match = colorStr.match(/rgba?\((\d+),(\d+),(\d+)/i);
            if (match) {
                const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
                const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
                const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
            }
        }
        ctx.fillStyle = colorStr;
        return ctx.fillStyle;
    }

    function updateColorInputs(theme) {
        inputList.forEach((input) => {
            const varName = input.dataset.var;
            const colorValue = theme[varName] || '';
            input.value = colorValue;
            const picker = document.querySelector(
                `.cip-color-picker[data-target="${input.id}"]`,
            );
            if (picker) {
                picker.value = colorToHex(colorValue);
            }
        });
    }

    function applyTheme(theme) {
        const themeToApply = theme || defaultTheme;
        Object.entries(themeToApply).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
        const accentColor = themeToApply['--cip-accent-color'];
        const activeTabBg = hexToRgba(accentColor);
        document.documentElement.style.setProperty(
            '--cip-active-bg-color',
            activeTabBg || 'rgba(128, 128, 128, 0.3)',
        );
        updateColorInputs(themeToApply);
    }

    function getColorsFromInputs() {
        const currentColors = {};
        inputList.forEach((input) => {
            currentColors[input.dataset.var] = input.value;
        });
        return currentColors;
    }

    function populateThemeSelect() {
        if (!themeSelect) return;
        const savedSelection = themeSelect.value;
        themeSelect.innerHTML = '<option value="default">默认主题</option>';
        Object.keys(themes).forEach((themeName) => {
            const option = document.createElement('option');
            option.value = themeName;
            option.textContent = themeName;
            themeSelect.appendChild(option);
        });
        themeSelect.value = themes[savedSelection] ? savedSelection : 'default';
    }

    function saveCurrentTheme() {
        if (!newThemeNameInput) return;
        const name = newThemeNameInput.value.trim();
        if (!name) {
            alert('请输入配色方案名称！');
            return;
        }
        if (name === 'default') {
            alert('不能使用 "default" 作为名称。');
            return;
        }
        themes[name] = getColorsFromInputs();
        localStorage.setItem('cip_theme_data_v1', JSON.stringify(themes));
        newThemeNameInput.value = '';
        populateThemeSelect();
        if (themeSelect) {
            themeSelect.value = name;
        }
        alert('配色方案已保存！');
    }

    function deleteSelectedTheme() {
        if (!themeSelect) return;
        const selected = themeSelect.value;
        if (selected === 'default') {
            alert('不能删除默认主题。');
            return;
        }
        if (confirm(`确定要删除 "${selected}" 这个配色方案吗？`)) {
            delete themes[selected];
            localStorage.setItem('cip_theme_data_v1', JSON.stringify(themes));
            populateThemeSelect();
            applyTheme(defaultTheme);
        }
    }

    function loadThemes() {
        const savedThemes = localStorage.getItem('cip_theme_data_v1');
        if (savedThemes) {
            themes = JSON.parse(savedThemes);
        }
        const lastThemeName =
            localStorage.getItem('cip_last_active_theme_v1') || 'default';
        populateThemeSelect();
        const themeToApply = themes[lastThemeName] || defaultTheme;
        applyTheme(themeToApply);
        if (themeSelect) {
            themeSelect.value = themes[lastThemeName]
                ? lastThemeName
                : 'default';
        }
    }

    inputList.forEach((input) => {
        input.addEventListener('input', (e) => {
            const textInput = e.currentTarget;
            const property = textInput.dataset.var;
            const value = textInput.value.trim();
            document.documentElement.style.setProperty(property, value);
            const picker = document.querySelector(
                `.cip-color-picker[data-target="${textInput.id}"]`,
            );
            if (picker) {
                picker.value = colorToHex(value);
            }
            if (property === '--cip-accent-color') {
                const activeTabBg = hexToRgba(colorToHex(value));
                document.documentElement.style.setProperty(
                    '--cip-active-bg-color',
                    activeTabBg || 'rgba(128, 128, 128, 0.3)',
                );
            }
        });
    });

    pickerList.forEach((picker) => {
        picker.addEventListener('input', (e) => {
            const colorPicker = e.currentTarget;
            const targetInputId = colorPicker.dataset.target;
            const textInput = document.getElementById(targetInputId);
            if (textInput) {
                textInput.value = colorPicker.value;
                textInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    themeSelect?.addEventListener('change', (e) => {
        const themeName = e.target.value;
        const theme =
            themeName === 'default' ? defaultTheme : themes[themeName];
        applyTheme(theme);
        localStorage.setItem('cip_last_active_theme_v1', themeName);
    });

    saveThemeBtn?.addEventListener('click', saveCurrentTheme);
    deleteThemeBtn?.addEventListener('click', deleteSelectedTheme);

    return {
        loadThemes,
        applyTheme,
        get defaultTheme() {
            return defaultTheme;
        },
    };
}
