import {
    DEFAULT_ENDPOINT,
    requestSpeech,
    listVoices,
    uploadVoiceSample,
    deleteVoiceSample,
} from './siliconflow.js';

const state = {
    ttsKeyInput: null,
    ttsModelInput: null,
    ttsVoiceInput: null,
    ttsEndpointInput: null,
    ttsEndpointLabel: null,
    ttsSpeedRange: null,
    ttsSpeedValue: null,
    ttsUploadName: null,
    ttsUploadText: null,
    ttsUploadFile: null,
    ttsUploadFileBtn: null,
    ttsUploadBtn: null,
    ttsRefreshVoicesBtn: null,
    ttsSaveBtn: null,
    ttsTestText: null,
    ttsTestBtn: null,
    ttsCheckBtn: null,
    ttsStatus: null,
    ttsVoiceDeleteBtn: null,
    ttsSubtabs: [],
    ttsPanes: [],
};

const ttsQueue = [];
let ttsIsPlaying = false;
let ttsCurrentAudio = null;
let currentBubble = null;

function assignState(elements = {}) {
    Object.assign(state, elements);
    if (elements.ttsSubtabs) {
        state.ttsSubtabs = Array.from(elements.ttsSubtabs);
    }
    if (elements.ttsPanes) {
        state.ttsPanes = Array.from(elements.ttsPanes);
    }
}

function getDefaultSettings() {
    return {
        key: '',
        endpoint: DEFAULT_ENDPOINT,
        model: '',
        voice: '',
    };
}

export function getStoredTTSSettings() {
    try {
        const raw = localStorage.getItem('cip_tts_settings_v1');
        if (!raw) return getDefaultSettings();
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return getDefaultSettings();
        if (!parsed.endpoint) parsed.endpoint = DEFAULT_ENDPOINT;
        return parsed;
    } catch (error) {
        console.error('胡萝卜插件：读取语音设置失败', error);
        return getDefaultSettings();
    }
}

export function applyTTSSettingsToUI(settings) {
    const safeSettings = settings || getDefaultSettings();
    if (state.ttsKeyInput) {
        state.ttsKeyInput.value = safeSettings.key || '';
    }
    if (state.ttsEndpointInput) {
        state.ttsEndpointInput.value = safeSettings.endpoint || DEFAULT_ENDPOINT;
    }
    if (state.ttsModelInput) {
        if (
            safeSettings.model &&
            (!state.ttsModelInput.options.length ||
                !state.ttsModelInput.querySelector(
                    `option[value="${safeSettings.model}"]`,
                ))
        ) {
            const opt = new Option(
                safeSettings.model,
                safeSettings.model,
                true,
                true,
            );
            state.ttsModelInput.innerHTML = '';
            state.ttsModelInput.add(opt);
        }
        state.ttsModelInput.value = safeSettings.model || '';
    }
    if (state.ttsVoiceInput) {
        if (
            safeSettings.voice &&
            (!state.ttsVoiceInput.options.length ||
                !state.ttsVoiceInput.querySelector(
                    `option[value="${safeSettings.voice}"]`,
                ))
        ) {
            const opt = new Option(
                safeSettings.voice,
                safeSettings.voice,
                true,
                true,
            );
            state.ttsVoiceInput.innerHTML = '';
            state.ttsVoiceInput.add(opt);
        }
        state.ttsVoiceInput.value = safeSettings.voice || '';
    }
}

export function readTTSSettingsFromUI() {
    return {
        key: state.ttsKeyInput?.value?.trim() || '',
        endpoint:
            state.ttsEndpointInput?.value?.trim() || DEFAULT_ENDPOINT,
        model: state.ttsModelInput?.value?.trim() || '',
        voice: state.ttsVoiceInput?.value?.trim() || '',
    };
}

export function saveTTSSettings(settings) {
    try {
        localStorage.setItem('cip_tts_settings_v1', JSON.stringify(settings));
    } catch (error) {
        console.error('保存语音设置失败', error);
    }
}

export function updateTTSStatus(text, isError = false) {
    if (!state.ttsStatus) return;
    state.ttsStatus.textContent = text;
    state.ttsStatus.style.color = isError ? '#e74c3c' : 'inherit';
}

function enqueueAudioBlob(blob) {
    ttsQueue.push(blob);
    if (!ttsIsPlaying) playNextAudio();
}

function playNextAudio() {
    if (!ttsQueue.length) {
        ttsIsPlaying = false;
        return;
    }
    const blob = ttsQueue.shift();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    ttsCurrentAudio = audio;
    ttsIsPlaying = true;
    audio.onended = () => {
        URL.revokeObjectURL(url);
        ttsIsPlaying = false;
        ttsCurrentAudio = null;
        playNextAudio();
    };
    audio.onerror = () => {
        URL.revokeObjectURL(url);
        ttsIsPlaying = false;
        ttsCurrentAudio = null;
        playNextAudio();
    };
    audio.play().catch(() => {
        updateTTSStatus('自动播放被浏览器阻止，请与页面交互后重试', true);
    });
}

export function stopTTSPlayback() {
    try {
        if (ttsCurrentAudio) {
            ttsCurrentAudio.pause();
            ttsCurrentAudio.src = '';
        }
    } catch (error) {
        // ignore
    }
    ttsCurrentAudio = null;
    ttsIsPlaying = false;
    ttsQueue.length = 0;
}

export function playImmediateBlob(blob) {
    stopTTSPlayback();
    if (blob) {
        ttsQueue.push(blob);
        playNextAudio();
    }
}

export async function synthesizeTTS(text, playOnReady = true) {
    const content = (text || '').trim();
    if (!content) throw new Error('文本为空');
    const settings = getStoredTTSSettings();
    if (!settings.key) throw new Error('未配置API Key');
    updateTTSStatus('合成中...');
    const speed =
        parseFloat(state.ttsSpeedRange?.value || '1') || 1;
    const blob = await requestSpeech({
        key: settings.key,
        endpoint: settings.endpoint || DEFAULT_ENDPOINT,
        model: settings.model,
        voice: settings.voice,
        text: content,
        speed,
    });
    updateTTSStatus('合成完成');
    if (playOnReady && blob) {
        enqueueAudioBlob(blob);
    }
    return blob;
}

export async function toggleBubblePlayback(target, rawText) {
    const text = rawText?.trim();
    if (!target || !text) return;
    if (currentBubble && currentBubble === target) {
        stopTTSPlayback();
        currentBubble = null;
        return;
    }
    currentBubble = target;
    try {
        const blob = await synthesizeTTS(text, false);
        playImmediateBlob(blob);
    } catch (error) {
        currentBubble = null;
        throw error;
    }
}

export function clearBubblePlayback() {
    currentBubble = null;
}

function addPresetVoices(modelId) {
    if (!state.ttsVoiceInput) return;
    const presets = [];
    if (/^FunAudioLLM\/CosyVoice2-0\.5B$/i.test(modelId)) {
        const cosy = [
            'alex',
            'benjamin',
            'charles',
            'david',
            'anna',
            'bella',
            'claire',
            'diana',
        ].map((voice) => ({
            value: `${modelId}:${voice}`,
            label: voice,
            group: '预设音色 (CosyVoice)',
        }));
        presets.push(...cosy);
    }
    if (/^fnlp\/MOSS-TTSD-v0\.5$/i.test(modelId)) {
        const moss = [
            'alex',
            'anna',
            'bella',
            'benjamin',
            'charles',
            'claire',
            'david',
            'diana',
        ].map((voice) => ({
            value: `${modelId}:${voice}`,
            label: voice,
            group: '预设音色 (MOSS)',
        }));
        presets.push(...moss);
    }
    const grouped = presets.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {});
    Object.entries(grouped).forEach(([label, items]) => {
        const groupEl = document.createElement('optgroup');
        groupEl.label = label;
        items.forEach(({ value, label: optionLabel }) => {
            groupEl.appendChild(new Option(optionLabel, value));
        });
        state.ttsVoiceInput.appendChild(groupEl);
    });
}

async function appendCustomVoices(key) {
    if (!state.ttsVoiceInput || !key) return;
    try {
        const list = await listVoices(key);
        if (!Array.isArray(list) || !list.length) return;
        const groupEl = document.createElement('optgroup');
        groupEl.label = '自定义音色';
        list
            .map((item) => ({
                value: item?.uri || item?.id || item?.voice_id,
                label:
                    (item?.name ||
                        item?.customName ||
                        item?.custom_name ||
                        '自定义音色') + ' (自定义)',
            }))
            .filter((item) => item.value)
            .forEach(({ value, label }) => {
                groupEl.appendChild(new Option(label, value));
            });
        if (groupEl.children.length) {
            state.ttsVoiceInput.appendChild(groupEl);
        }
    } catch (error) {
        console.error('胡萝卜插件：加载自定义音色失败', error);
    }
}

async function refreshVoicesForModel() {
    if (!state.ttsModelInput || !state.ttsVoiceInput) return;
    const settings = readTTSSettingsFromUI();
    const modelId = state.ttsModelInput.value || 'FunAudioLLM/CosyVoice2-0.5B';
    state.ttsVoiceInput.innerHTML = '';
    addPresetVoices(modelId);
    await appendCustomVoices(settings.key);
    if (state.ttsVoiceInput.options.length) {
        state.ttsVoiceInput.selectedIndex = 0;
    }
}

function initSubtabs() {
    if (!state.ttsSubtabs.length || !state.ttsPanes.length) return;
    state.ttsSubtabs.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.subtab;
            state.ttsSubtabs.forEach((item) =>
                item.classList.toggle('active', item === btn),
            );
            state.ttsPanes.forEach((pane) =>
                pane.classList.toggle(
                    'active',
                    pane.id === `cip-tts-pane-${target}`,
                ),
            );
        });
    });
}

function initSpeedSlider() {
    if (!state.ttsSpeedRange || !state.ttsSpeedValue) return;
    const updateSpeedLabel = () => {
        const value = parseFloat(state.ttsSpeedRange.value || '1') || 1;
        state.ttsSpeedValue.textContent = `${value.toFixed(2)}x`;
    };
    state.ttsSpeedRange.addEventListener('input', updateSpeedLabel);
    updateSpeedLabel();
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const result = reader.result || '';
                const base64 = String(result).split(',')[1];
                if (!base64) throw new Error('无法解析音频文件');
                resolve(base64);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('读取音频失败'));
        reader.readAsDataURL(file);
    });
}

function ensureEndpointDefault() {
    if (!state.ttsEndpointInput) return;
    try {
        state.ttsEndpointInput.value = DEFAULT_ENDPOINT;
    } catch (error) {
        // ignore
    }
}

export function initTTSSettings(elements = {}) {
    assignState(elements);
    ensureEndpointDefault();
    initSubtabs();
    initSpeedSlider();

    state.ttsSaveBtn?.addEventListener('click', () => {
        const settings = readTTSSettingsFromUI();
        saveTTSSettings(settings);
        updateTTSStatus('设置已保存');
    });

    state.ttsTestBtn?.addEventListener('click', async () => {
        const text = state.ttsTestText?.value?.trim() || '';
        if (!text) {
            updateTTSStatus('请输入要测试的文字', true);
            return;
        }
        try {
            saveTTSSettings(readTTSSettingsFromUI());
            await synthesizeTTS(text, true);
            updateTTSStatus('测试语音已播放');
        } catch (error) {
            updateTTSStatus(`测试失败: ${error.message || error}`, true);
        }
    });

    state.ttsModelInput?.addEventListener('change', () => {
        refreshVoicesForModel();
    });

    state.ttsUploadBtn?.addEventListener('click', async () => {
        try {
            if (!state.ttsKeyInput?.value) {
                throw new Error('请先填写硅基流动 API Key');
            }
            const name = state.ttsUploadName?.value?.trim();
            const text = state.ttsUploadText?.value?.trim();
            const file = state.ttsUploadFile?.files?.[0];
            if (!name || !/^[0-9a-zA-Z_\-]+$/.test(name)) {
                throw new Error('请输入有效的音色名称 (字母/数字/下划线/短横线)');
            }
            if (!text) {
                throw new Error('请输入参考文本');
            }
            if (!file) {
                throw new Error('请选择参考音频文件');
            }
            const base64 = await readFileAsBase64(file);
            await uploadVoiceSample({
                key: state.ttsKeyInput.value.trim(),
                name,
                text,
                audioBase64: base64,
            });
            updateTTSStatus('上传成功，URI 已生成');
            state.ttsModelInput?.dispatchEvent(new Event('change'));
        } catch (error) {
            updateTTSStatus(`上传失败: ${error.message || error}`, true);
        }
    });

    if (state.ttsUploadFileBtn && state.ttsUploadFile) {
        state.ttsUploadFileBtn.addEventListener('click', () => {
            state.ttsUploadFile?.click();
        });
    }

    state.ttsVoiceDeleteBtn?.addEventListener('click', async () => {
        try {
            const value = state.ttsVoiceInput?.value || '';
            if (!value) {
                updateTTSStatus('请先选择要删除的音色', true);
                return;
            }
            const isCustom = Array.from(
                state.ttsVoiceInput?.querySelectorAll(
                    'optgroup[label="自定义音色"] option',
                ) || [],
            ).some((option) => option.value === value);
            if (!isCustom) {
                updateTTSStatus('只能删除自定义音色', true);
                return;
            }
            if (!state.ttsKeyInput?.value) {
                updateTTSStatus('请先填写API Key', true);
                return;
            }
            await deleteVoiceSample({
                key: state.ttsKeyInput.value.trim(),
                uri: value,
            });
            updateTTSStatus('音色删除成功');
            state.ttsModelInput?.dispatchEvent(new Event('change'));
        } catch (error) {
            updateTTSStatus(`删除失败: ${error.message || error}`, true);
        }
    });

    state.ttsRefreshVoicesBtn?.addEventListener('click', () => {
        state.ttsModelInput?.dispatchEvent(new Event('change'));
        updateTTSStatus('音色已刷新');
    });

    state.ttsCheckBtn?.addEventListener('click', async () => {
        try {
            updateTTSStatus('连接中...');
            if (state.ttsModelInput) {
                const models = [
                    'FunAudioLLM/CosyVoice2-0.5B',
                    'fnlp/MOSS-TTSD-v0.5',
                ];
                state.ttsModelInput.innerHTML = '';
                models.forEach((model) =>
                    state.ttsModelInput?.appendChild(new Option(model, model)),
                );
                state.ttsModelInput.value = models[0];
            }
            if (state.ttsVoiceInput) {
                state.ttsVoiceInput.innerHTML = '';
                addPresetVoices('FunAudioLLM/CosyVoice2-0.5B');
                addPresetVoices('fnlp/MOSS-TTSD-v0.5');
                await appendCustomVoices(state.ttsKeyInput?.value?.trim() || '');
                if (state.ttsVoiceInput.options.length) {
                    state.ttsVoiceInput.selectedIndex = 0;
                }
            }
            saveTTSSettings(readTTSSettingsFromUI());
            updateTTSStatus('连接成功，已自动填充模型与音色');
        } catch (error) {
            updateTTSStatus(`连接失败: ${error.message || error}`, true);
        }
    });
}
