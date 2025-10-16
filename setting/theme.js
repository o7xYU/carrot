const state = {
    colorInputs: [],
    colorPickers: [],
    themeSelect: null,
    newThemeNameInput: null,
    saveThemeBtn: null,
    deleteThemeBtn: null,
};

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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#000000';
    if (colorStr === 'transparent') {
        return '#ffffff';
    }
    ctx.fillStyle = colorStr;
    return ctx.fillStyle || '#000000';
}

function getColorsFromInputs() {
    const result = {};
    state.colorInputs.forEach((input) => {
        const property = input.dataset.var;
        if (!property) return;
        result[property] = input.value.trim();
    });
    return result;
}

function updateColorInputs(theme) {
    state.colorInputs.forEach((input) => {
        const varName = input.dataset.var;
        if (!varName) return;
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
    for (const [key, value] of Object.entries(themeToApply)) {
        document.documentElement.style.setProperty(key, value);
    }
    const accentColor = themeToApply['--cip-accent-color'];
    if (accentColor) {
        const activeTabBg = hexToRgba(colorToHex(accentColor));
        if (activeTabBg) {
            document.documentElement.style.setProperty(
                '--cip-active-bg-color',
                activeTabBg,
            );
        }
    }
    updateColorInputs(themeToApply);
}

function populateThemeSelect() {
    const { themeSelect } = state;
    if (!themeSelect) return;
    const savedSelection = themeSelect.value;
    themeSelect.innerHTML = '<option value="default">默认主题</option>';
    for (const themeName in themes) {
        const option = document.createElement('option');
        option.value = themeName;
        option.textContent = themeName;
        themeSelect.appendChild(option);
    }
    themeSelect.value = themes[savedSelection] ? savedSelection : 'default';
}

function saveCurrentTheme() {
    const { newThemeNameInput, themeSelect } = state;
    if (!newThemeNameInput || !themeSelect) return;
    const name = newThemeNameInput.value.trim();
    if (!name) {
        alert('请输入主题名称');
        return;
    }
    themes[name] = getColorsFromInputs();
    localStorage.setItem('cip_theme_data_v1', JSON.stringify(themes));
    populateThemeSelect();
    themeSelect.value = name;
    localStorage.setItem('cip_last_active_theme_v1', name);
    applyTheme(themes[name]);
}

function deleteSelectedTheme() {
    const { themeSelect } = state;
    if (!themeSelect) return;
    const selected = themeSelect.value;
    if (selected === 'default' || !themes[selected]) {
        alert('请选择一个自定义主题进行删除');
        return;
    }
    if (!confirm(`确定要删除主题 "${selected}" 吗？`)) return;
    delete themes[selected];
    localStorage.setItem('cip_theme_data_v1', JSON.stringify(themes));
    populateThemeSelect();
    themeSelect.value = 'default';
    localStorage.setItem('cip_last_active_theme_v1', 'default');
    applyTheme(defaultTheme);
}

function loadThemesFromStorage() {
    try {
        const savedThemes = localStorage.getItem('cip_theme_data_v1');
        if (savedThemes) {
            themes = JSON.parse(savedThemes);
        }
    } catch (error) {
        console.error('胡萝卜插件：加载主题失败', error);
        themes = {};
    }
    populateThemeSelect();
    const lastThemeName =
        localStorage.getItem('cip_last_active_theme_v1') || 'default';
    const themeToApply = themes[lastThemeName] || defaultTheme;
    applyTheme(themeToApply);
    if (state.themeSelect) {
        state.themeSelect.value =
            themes[lastThemeName] ? lastThemeName : 'default';
    }
}

export function initThemeSettings({
    colorInputs = [],
    colorPickers = [],
    themeSelect = null,
    newThemeNameInput = null,
    saveThemeBtn = null,
    deleteThemeBtn = null,
} = {}) {
    state.colorInputs = Array.from(colorInputs);
    state.colorPickers = Array.from(colorPickers);
    state.themeSelect = themeSelect;
    state.newThemeNameInput = newThemeNameInput;
    state.saveThemeBtn = saveThemeBtn;
    state.deleteThemeBtn = deleteThemeBtn;

    state.colorInputs.forEach((input) => {
        input.addEventListener('input', (e) => {
            const textInput = e.currentTarget;
            const property = textInput.dataset.var;
            const value = textInput.value.trim();
            if (property) {
                document.documentElement.style.setProperty(property, value);
            }
            const picker = document.querySelector(
                `.cip-color-picker[data-target="${textInput.id}"]`,
            );
            if (picker) {
                picker.value = colorToHex(value);
            }
            if (property === '--cip-accent-color') {
                const activeTabBg = hexToRgba(colorToHex(value));
                if (activeTabBg) {
                    document.documentElement.style.setProperty(
                        '--cip-active-bg-color',
                        activeTabBg,
                    );
                }
            }
        });
    });

    state.colorPickers.forEach((picker) => {
        picker.addEventListener('input', (e) => {
            const colorPicker = e.currentTarget;
            const targetInputId = colorPicker.dataset.target;
            if (!targetInputId) return;
            const textInput = document.getElementById(targetInputId);
            if (textInput) {
                textInput.value = colorPicker.value;
                textInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });

    if (state.themeSelect) {
        state.themeSelect.addEventListener('change', (e) => {
            const themeName = e.target.value;
            const theme =
                themeName === 'default' ? defaultTheme : themes[themeName];
            applyTheme(theme);
            localStorage.setItem('cip_last_active_theme_v1', themeName);
        });
    }

    state.saveThemeBtn?.addEventListener('click', saveCurrentTheme);
    state.deleteThemeBtn?.addEventListener('click', deleteSelectedTheme);
}

export function loadThemes() {
    loadThemesFromStorage();
}

export function getDefaultTheme() {
    return { ...defaultTheme };
}
