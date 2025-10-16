import {
    DEFAULT_TTS_ENDPOINT,
    DEFAULT_TTS_MODEL,
    DEFAULT_TTS_VOICE,
    DEFAULT_TTS_SPEED,
} from '../tts/constants.js';
import { SILICON_FLOW_TTS_API_DOC } from '../tts/apiDocs.js';

const voiceState = {
    elements: {},
    dependencies: {
        localStorageRef: typeof localStorage !== 'undefined' ? localStorage : null,
        fetchRef: typeof fetch !== 'undefined' ? fetch : null,
        documentRef: typeof document !== 'undefined' ? document : null,
        windowRef: typeof window !== 'undefined' ? window : null,
    },
    queue: [],
    isPlaying: false,
    currentAudio: null,
    currentBubble: null,
};

function getElements() {
    return voiceState.elements;
}

function getDeps() {
    return voiceState.dependencies;
}

function getDefaultEndpoint() {
    return DEFAULT_TTS_ENDPOINT;
}

function getTTSSettings() {
    const ls = getDeps().localStorageRef;
    let settings = null;
    try {
        settings = JSON.parse(ls?.getItem('cip_tts_settings_v1')) || null;
    } catch (error) {
        settings = null;
    }
    if (!settings) {
        settings = {
            key: '',
            endpoint: getDefaultEndpoint(),
            model: '',
            voice: '',
        };
    }
    if (!settings.endpoint) settings.endpoint = getDefaultEndpoint();
    return settings;
}

function applyTTSSettingsToUI(settings) {
    const {
        ttsKeyInput,
        ttsEndpointInput,
        ttsModelInput,
        ttsVoiceInput,
    } = getElements();
    if (ttsKeyInput) ttsKeyInput.value = settings.key || '';
    if (ttsEndpointInput)
        ttsEndpointInput.value = settings.endpoint || getDefaultEndpoint();
    if (ttsModelInput && settings.model) {
        if (
            !ttsModelInput.options.length ||
            !ttsModelInput.querySelector(`option[value="${settings.model}"]`)
        ) {
            const opt = new Option(settings.model, settings.model, true, true);
            ttsModelInput.innerHTML = '';
            ttsModelInput.add(opt);
        }
        ttsModelInput.value = settings.model;
    }
    if (ttsVoiceInput && settings.voice) {
        if (
            !ttsVoiceInput.options.length ||
            !ttsVoiceInput.querySelector(`option[value="${settings.voice}"]`)
        ) {
            const opt = new Option(settings.voice, settings.voice, true, true);
            ttsVoiceInput.innerHTML = '';
            ttsVoiceInput.add(opt);
        }
        ttsVoiceInput.value = settings.voice;
    }
}

function readTTSSettingsFromUI() {
    const {
        ttsKeyInput,
        ttsEndpointInput,
        ttsModelInput,
        ttsVoiceInput,
    } = getElements();
    return {
        key: (ttsKeyInput?.value || '').trim(),
        endpoint:
            (ttsEndpointInput?.value || '').trim() || getDefaultEndpoint(),
        model: (ttsModelInput?.value || '').trim(),
        voice: (ttsVoiceInput?.value || '').trim(),
    };
}

function saveTTSSettings(settings) {
    try {
        getDeps().localStorageRef?.setItem(
            'cip_tts_settings_v1',
            JSON.stringify(settings),
        );
    } catch (error) {
        console.error('保存语音设置失败', error);
    }
}

function updateTTSStatus(text, isError = false) {
    const { ttsStatus } = getElements();
    if (!ttsStatus) return;
    ttsStatus.textContent = text;
    ttsStatus.style.color = isError ? '#e74c3c' : 'inherit';
}

async function fetchSiliconFlowTTS(text, settings) {
    const base = settings.endpoint || getDefaultEndpoint();
    const endpoint = base.endsWith('/audio/speech')
        ? base
        : `${base.replace(/\/$/, '')}/audio/speech`;
    if (!settings.key) throw new Error('未配置硅基流动API Key');
    const body = {
        model: settings.model || DEFAULT_TTS_MODEL,
        voice: settings.voice || DEFAULT_TTS_VOICE,
        input: text,
        format: 'mp3',
        speed:
            parseFloat(getElements().ttsSpeedRange?.value || DEFAULT_TTS_SPEED) ||
            DEFAULT_TTS_SPEED,
    };
    const fetchImpl = getDeps().fetchRef;
    if (!fetchImpl) throw new Error('浏览器不支持 fetch');
    const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.key}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return await res.blob();
}

function playNextAudio() {
    if (!voiceState.queue.length) {
        voiceState.isPlaying = false;
        voiceState.currentAudio = null;
        voiceState.currentBubble = null;
        return;
    }
    const blob = voiceState.queue.shift();
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        voiceState.isPlaying = false;
        voiceState.currentAudio = null;
        voiceState.currentBubble = null;
        playNextAudio();
    };
    audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        voiceState.isPlaying = false;
        voiceState.currentAudio = null;
        voiceState.currentBubble = null;
        playNextAudio();
    };
    voiceState.isPlaying = true;
    voiceState.currentAudio = audio;
    audio.play().catch((error) => {
        console.error('TTS 播放失败', error);
        updateTTSStatus('自动播放被浏览器阻止，请与页面交互后重试', true);
    });
}

function stopTTSPlayback() {
    try {
        if (voiceState.currentAudio) {
            voiceState.currentAudio.pause();
            voiceState.currentAudio.src = '';
        }
    } catch (error) {
        console.warn('停止播放失败', error);
    }
    voiceState.currentAudio = null;
    voiceState.isPlaying = false;
    voiceState.queue.length = 0;
    voiceState.currentBubble = null;
}

function playImmediateBlob(blob) {
    stopTTSPlayback();
    if (blob) {
        voiceState.queue.push(blob);
        playNextAudio();
    }
}

async function synthesizeTTS(text, playOnReady = true) {
    const settings = readTTSSettingsFromUI();
    if (!settings.key) throw new Error('请先填写硅基流动 API Key');
    if (!settings.model) settings.model = DEFAULT_TTS_MODEL;
    if (!settings.voice) settings.voice = DEFAULT_TTS_VOICE;
    const blob = await fetchSiliconFlowTTS(text, settings);
    if (playOnReady) {
        voiceState.queue.push(blob);
        if (!voiceState.isPlaying) playNextAudio();
    }
    return blob;
}

function setCurrentBubble(bubble) {
    voiceState.currentBubble = bubble;
}

function getCurrentBubble() {
    return voiceState.currentBubble;
}

function setupSpeedControls() {
    const { ttsSpeedRange, ttsSpeedValue } = getElements();
    if (ttsSpeedRange && ttsSpeedValue) {
        const updateSpeedLabel = () => {
            const v = parseFloat(ttsSpeedRange.value || DEFAULT_TTS_SPEED) || 1;
            ttsSpeedValue.textContent = `${v.toFixed(2)}x`;
        };
        updateSpeedLabel();
        ttsSpeedRange.addEventListener('input', updateSpeedLabel);
    }
}

function setupModelChangeHandler() {
    const { ttsModelInput, ttsVoiceInput, ttsKeyInput } = getElements();
    if (!ttsModelInput || !ttsVoiceInput) return;
    ttsModelInput.addEventListener('change', async () => {
        const doc = getDeps().documentRef;
        if (!doc) return;
        ttsVoiceInput.innerHTML = '';
        const cosyModel = 'FunAudioLLM/CosyVoice2-0.5B';
        const cosyPreset = [
            'alex',
            'benjamin',
            'charles',
            'david',
            'anna',
            'bella',
            'claire',
            'diana',
        ].map((name) => ({
            value: `${cosyModel}:${name}`,
            label: name,
        }));
        const cosyGroup = doc.createElement('optgroup');
        cosyGroup.label = '预设音色 (CosyVoice)';
        cosyPreset.forEach(({ value, label }) =>
            cosyGroup.appendChild(new Option(label, value)),
        );
        ttsVoiceInput.appendChild(cosyGroup);

        const mossModel = 'fnlp/MOSS-TTSD-v0.5';
        const mossPreset = [
            'alex',
            'anna',
            'bella',
            'benjamin',
            'charles',
            'claire',
            'david',
            'diana',
        ].map((name) => ({
            value: `${mossModel}:${name}`,
            label: name,
        }));
        const mossGroup = doc.createElement('optgroup');
        mossGroup.label = '预设音色 (MOSS)';
        mossPreset.forEach(({ value, label }) =>
            mossGroup.appendChild(new Option(label, value)),
        );
        ttsVoiceInput.appendChild(mossGroup);

        const apiKey = ttsKeyInput?.value.trim();
        if (apiKey) {
            try {
                const res = await getDeps().fetchRef(
                    'https://api.siliconflow.cn/v1/audio/voice/list',
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );
                if (res.ok) {
                    const data = await res.json();
                    const arr = data?.result || data?.results || [];
                    const list = (Array.isArray(arr) ? arr : []).map((item) => ({
                        value: item?.uri || item?.id || item?.voice_id,
                        label:
                            (item?.name ||
                                item?.customName ||
                                item?.custom_name ||
                                '自定义音色') + ' (自定义)',
                    }));
                    if (list.length) {
                        const customGroup = doc.createElement('optgroup');
                        customGroup.label = '自定义音色';
                        list
                            .filter((item) => item.value)
                            .forEach(({ value, label }) =>
                                customGroup.appendChild(new Option(label, value)),
                            );
                        ttsVoiceInput.appendChild(customGroup);
                    }
                }
            } catch (error) {
                console.warn('获取自定义音色失败', error);
            }
        }
        if (ttsVoiceInput.options.length) {
            ttsVoiceInput.selectedIndex = 0;
        }
    });
}

function setupUploadHandlers() {
    const {
        ttsUploadBtn,
        ttsUploadName,
        ttsUploadText,
        ttsUploadFile,
        ttsUploadFileBtn,
        ttsKeyInput,
        ttsModelInput,
    } = getElements();
    if (ttsUploadBtn) {
        ttsUploadBtn.addEventListener('click', async () => {
            try {
                if (!ttsKeyInput?.value) {
                    throw new Error('请先填写硅基流动 API Key');
                }
                const name = (ttsUploadName?.value || '').trim();
                const text = (ttsUploadText?.value || '').trim();
                const file = ttsUploadFile?.files?.[0];
                if (!name) throw new Error('请填写音色名称');
                if (!text) throw new Error('请填写参考文本');
                if (!file) throw new Error('请选择参考音频文件');
                if (!/^[a-zA-Z0-9_\-]+$/.test(name)) {
                    throw new Error('音色名称仅支持字母数字下划线');
                }
                const body = new FormData();
                body.append('name', name);
                body.append('text', text);
                body.append('voice', file);
                const res = await getDeps().fetchRef(
                    'https://api.siliconflow.cn/v1/audio/voice/upload',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${ttsKeyInput.value.trim()}`,
                        },
                        body,
                    },
                );
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
                }
                const result = await res.json();
                updateTTSStatus(`上传成功，URI: ${result?.uri || '未知'}`);
                ttsModelInput?.dispatchEvent(new Event('change'));
            } catch (error) {
                updateTTSStatus(`上传失败: ${error.message || error}`, true);
            }
        });
    }
    if (ttsUploadFileBtn && ttsUploadFile) {
        ttsUploadFileBtn.addEventListener('click', () => ttsUploadFile.click());
    }
}

function setupDeleteVoiceHandler() {
    const { ttsVoiceDeleteBtn, ttsVoiceInput, ttsKeyInput, ttsModelInput } =
        getElements();
    if (!ttsVoiceDeleteBtn || !ttsVoiceInput) return;
    ttsVoiceDeleteBtn.addEventListener('click', async () => {
        try {
            const val = ttsVoiceInput.value || '';
            if (!val) {
                updateTTSStatus('请先选择要删除的音色', true);
                return;
            }
            const isCustom = Array.from(
                ttsVoiceInput.querySelectorAll(
                    'optgroup[label="自定义音色"] option',
                ),
            ).some((opt) => opt.value === val);
            if (!isCustom) {
                updateTTSStatus('只能删除自定义音色', true);
                return;
            }
            if (!ttsKeyInput?.value) {
                updateTTSStatus('请先填写API Key', true);
                return;
            }
            const res = await getDeps().fetchRef(
                'https://api.siliconflow.cn/v1/audio/voice/deletions',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${ttsKeyInput.value.trim()}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uri: val }),
                },
            );
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }
            updateTTSStatus('音色删除成功');
            ttsModelInput?.dispatchEvent(new Event('change'));
        } catch (error) {
            updateTTSStatus(`删除失败: ${error.message || error}`, true);
        }
    });
}

function setupRefreshHandler() {
    const { ttsRefreshVoicesBtn, ttsModelInput } = getElements();
    if (ttsRefreshVoicesBtn) {
        ttsRefreshVoicesBtn.addEventListener('click', () => {
            ttsModelInput?.dispatchEvent(new Event('change'));
            updateTTSStatus('音色已刷新');
        });
    }
}

function setupCheckHandler() {
    const { ttsCheckBtn, ttsModelInput, ttsVoiceInput } = getElements();
    if (!ttsCheckBtn || !ttsModelInput || !ttsVoiceInput) return;
    ttsCheckBtn.addEventListener('click', async () => {
        const settings = readTTSSettingsFromUI();
        try {
            updateTTSStatus('连接中...');
            const models = [
                'FunAudioLLM/CosyVoice2-0.5B',
                'fnlp/MOSS-TTSD-v0.5',
            ];
            ttsModelInput.innerHTML = '';
            models.forEach((m) => ttsModelInput.appendChild(new Option(m, m)));
            ttsModelInput.value = models[0];
            ttsVoiceInput.innerHTML = '';
            const doc = getDeps().documentRef;
            if (!doc) return;
            const cosyGroup = doc.createElement('optgroup');
            cosyGroup.label = '预设音色 (CosyVoice)';
            ['alex', 'benjamin', 'charles', 'david', 'anna', 'bella', 'claire', 'diana']
                .map((name) => ({
                    value: `${models[0]}:${name}`,
                    label: name,
                }))
                .forEach(({ value, label }) =>
                    cosyGroup.appendChild(new Option(label, value)),
                );
            ttsVoiceInput.appendChild(cosyGroup);
            const mossGroup = doc.createElement('optgroup');
            mossGroup.label = '预设音色 (MOSS)';
            ['alex', 'anna', 'bella', 'benjamin', 'charles', 'claire', 'david', 'diana']
                .map((name) => ({
                    value: `${models[1]}:${name}`,
                    label: name,
                }))
                .forEach(({ value, label }) =>
                    mossGroup.appendChild(new Option(label, value)),
                );
            ttsVoiceInput.appendChild(mossGroup);
            const apiKey = settings.key;
            if (apiKey) {
                try {
                    const res = await getDeps().fetchRef(
                        'https://api.siliconflow.cn/v1/audio/voice/list',
                        {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                            },
                        },
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const arr = data?.result || data?.results || [];
                        const list = (Array.isArray(arr) ? arr : []).map((item) => ({
                            value: item?.uri || item?.id || item?.voice_id,
                            label:
                                (item?.name ||
                                    item?.customName ||
                                    item?.custom_name ||
                                    '自定义音色') + ' (自定义)',
                        }));
                        if (list.length) {
                            const customGroup = doc.createElement('optgroup');
                            customGroup.label = '自定义音色';
                            list
                                .filter((item) => item.value)
                                .forEach(({ value, label }) =>
                                    customGroup.appendChild(
                                        new Option(label, value),
                                    ),
                                );
                            ttsVoiceInput.appendChild(customGroup);
                        }
                    }
                } catch (error) {
                    console.warn('获取自定义音色失败', error);
                }
            }
            if (ttsVoiceInput.options.length) ttsVoiceInput.selectedIndex = 0;
            saveTTSSettings(readTTSSettingsFromUI());
            updateTTSStatus('连接成功，已自动填充模型与音色');
        } catch (error) {
            updateTTSStatus(`连接失败: ${error.message || error}`, true);
        }
    });
}

function setupTabs() {
    const { ttsSubtabs, ttsPanes } = getElements();
    if (!ttsSubtabs || !ttsPanes) return;
    ttsSubtabs.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.subtab;
            ttsSubtabs.forEach((b) =>
                b.classList.toggle('active', b === btn),
            );
            ttsPanes.forEach((pane) =>
                pane.classList.toggle(
                    'active',
                    pane.id === `cip-tts-pane-${target}`,
                ),
            );
        });
    });
}

function setupSaveAndTest() {
    const {
        ttsSaveBtn,
        ttsTestBtn,
        ttsTestText,
    } = getElements();
    if (ttsSaveBtn) {
        ttsSaveBtn.addEventListener('click', () => {
            const settings = readTTSSettingsFromUI();
            saveTTSSettings(settings);
            updateTTSStatus('设置已保存');
        });
    }
    if (ttsTestBtn) {
        ttsTestBtn.addEventListener('click', async () => {
            const text = (ttsTestText?.value || '').trim();
            if (!text) {
                updateTTSStatus('请输入要测试的文字', true);
                return;
            }
            try {
                const current = readTTSSettingsFromUI();
                saveTTSSettings(current);
                await synthesizeTTS(text, true);
                updateTTSStatus('测试语音已播放');
            } catch (error) {
                updateTTSStatus(`测试失败: ${error.message || error}`, true);
            }
        });
    }
}

export function initVoiceSettings(elements, dependencies = {}) {
    voiceState.elements = elements || {};
    voiceState.dependencies = { ...voiceState.dependencies, ...dependencies };

    const { ttsEndpointInput, ttsEndpointLabel, ttsModelInput } = getElements();
    if (ttsEndpointInput && !ttsEndpointInput.value) {
        ttsEndpointInput.value = getDefaultEndpoint();
    }
    if (ttsEndpointLabel) {
        ttsEndpointLabel.title = SILICON_FLOW_TTS_API_DOC;
    }

    applyTTSSettingsToUI(getTTSSettings());

    setupTabs();
    setupSaveAndTest();
    setupSpeedControls();
    setupModelChangeHandler();
    setupUploadHandlers();
    setupDeleteVoiceHandler();
    setupRefreshHandler();
    setupCheckHandler();

    ttsModelInput?.dispatchEvent(new Event('change'));

    return {
        synthesizeTTS,
        stopTTSPlayback,
        playImmediateBlob,
        updateTTSStatus,
        setCurrentBubble,
        getCurrentBubble,
        applyTTSSettingsToUI,
        getTTSSettings,
    };
}
