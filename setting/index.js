const MODULE_LOADERS = [
    () => import('./theme.js'),
    () => import('./avatar.js'),
    () => import('./alarm.js'),
    () => import('./voice/index.js'),
    () => import('./sync.js'),
];

const MODULE_KEYS = [
    ['initThemeSettings', 'setting/theme.js'],
    ['initAvatarSettings', 'setting/avatar.js'],
    ['initAlarmSettings', 'setting/alarm.js'],
    ['initVoiceSettings', 'setting/voice/index.js'],
    ['initSyncSettings', 'setting/sync.js'],
];

function assertFunction(moduleName, exportName, exportValue) {
    if (typeof exportValue !== 'function') {
        throw new Error(
            `模块 ${moduleName} 缺少导出的函数 ${exportName}`,
        );
    }
}

export async function loadSettingModules() {
    const modules = await Promise.all(MODULE_LOADERS.map((loader) => loader()));

    const exportsMap = {};
    modules.forEach((module, index) => {
        const [exportName, moduleName] = MODULE_KEYS[index];
        const exportValue = module?.[exportName];
        assertFunction(moduleName, exportName, exportValue);
        exportsMap[exportName] = exportValue;
    });

    return exportsMap;
}
