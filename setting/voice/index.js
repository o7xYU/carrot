import {
    DEFAULT_TTS_ENDPOINT,
    DEFAULT_TTS_MODEL,
    DEFAULT_TTS_VOICE,
    DEFAULT_TTS_SPEED,
    DEFAULT_TTS_VENDOR,
    TTS_VENDORS,
    DEFAULT_ELEVENLABS_MODEL_ID,
    DEFAULT_ELEVENLABS_BASE_URL,
} from '../tts/constants.js';
import {
    SILICON_FLOW_TTS_API_DOC,
    ELEVEN_LABS_TTS_API_DOC,
} from '../tts/apiDocs.js';
import {
    requestElevenLabsTTS,
    verifyElevenLabsConfig,
} from '../tts/elevenlabs.js';

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

function toOptionalNumber(value, min, max, options = {}) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        if (!value.trim()) return null;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    let clamped = Math.min(max, Math.max(min, num));
    if (options.integer) {
        clamped = Math.round(clamped);
    }
    if (typeof options.precision === 'number') {
        const factor = 10 ** options.precision;
        clamped = Math.round(clamped * factor) / factor;
    }
    return clamped;
}

function getDefaultSettings() {
    return {
        vendor: DEFAULT_TTS_VENDOR,
        siliconFlow: {
            key: '',
            endpoint: getDefaultEndpoint(),
            model: '',
            voice: '',
        },
        elevenLabs: {
            apiKey: '',
            voiceId: '',
            modelId: '',
            baseUrl: DEFAULT_ELEVENLABS_BASE_URL,
            optimizeStreamingLatency: null,
            stability: null,
            similarityBoost: null,
            style: null,
            useSpeakerBoost: false,
        },
    };
}

function normalizeSettings(raw) {
    const defaults = getDefaultSettings();
    if (!raw || typeof raw !== 'object') {
        return defaults;
    }

    if (!raw.vendor && (raw.key || raw.endpoint || raw.model || raw.voice)) {
        return {
            ...defaults,
            siliconFlow: {
                ...defaults.siliconFlow,
                key: raw.key || '',
                endpoint: raw.endpoint || getDefaultEndpoint(),
                model: raw.model || '',
                voice: raw.voice || '',
            },
        };
    }

    const result = {
        ...defaults,
        ...raw,
        siliconFlow: {
            ...defaults.siliconFlow,
            ...(raw.siliconFlow || {}),
        },
        elevenLabs: {
            ...defaults.elevenLabs,
            ...(raw.elevenLabs || {}),
        },
    };

    if (!result.siliconFlow.endpoint) {
        result.siliconFlow.endpoint = getDefaultEndpoint();
    }
    if (!result.elevenLabs.baseUrl) {
        result.elevenLabs.baseUrl = DEFAULT_ELEVENLABS_BASE_URL;
    }

    result.elevenLabs.optimizeStreamingLatency = toOptionalNumber(
        result.elevenLabs.optimizeStreamingLatency,
        0,
        4,
        { integer: true },
    );
    result.elevenLabs.stability = toOptionalNumber(
        result.elevenLabs.stability,
        0,
        1,
        { precision: 2 },
    );
    result.elevenLabs.similarityBoost = toOptionalNumber(
        result.elevenLabs.similarityBoost,
        0,
        1,
        { precision: 2 },
    );
    result.elevenLabs.style = toOptionalNumber(
        result.elevenLabs.style,
        0,
        100,
        { integer: true },
    );
    const speakerBoostValue = result.elevenLabs.useSpeakerBoost;
    result.elevenLabs.useSpeakerBoost =
        speakerBoostValue === true ||
        speakerBoostValue === 'true' ||
        speakerBoostValue === 1 ||
        speakerBoostValue === '1';

    if (!Object.values(TTS_VENDORS).includes(result.vendor)) {
        result.vendor = DEFAULT_TTS_VENDOR;
    }

    return result;
}

function getTTSSettings() {
    const ls = getDeps().localStorageRef;
    if (!ls) return getDefaultSettings();
    try {
        const stored = ls.getItem('cip_tts_settings_v1');
        if (!stored) return getDefaultSettings();
        return normalizeSettings(JSON.parse(stored));
    } catch (error) {
        console.warn('读取语音设置失败，已回退到默认配置', error);
        return getDefaultSettings();
    }
}

function getSelectedVendorValue() {
    return (
        getElements().ttsVendorSelect?.value ||
        getTTSSettings().vendor ||
        DEFAULT_TTS_VENDOR
    );
}

function getVendorDisplayName(vendor) {
    switch (vendor) {
        case TTS_VENDORS.SILICON_FLOW:
            return '硅基流动';
        case TTS_VENDORS.ELEVEN_LABS:
            return 'ElevenLabs';
        default:
            return '未知厂商';
    }
}

function getSpeechSpeed() {
    const raw = Number(getElements().ttsSpeedRange?.value || DEFAULT_TTS_SPEED);
    if (!Number.isFinite(raw)) return DEFAULT_TTS_SPEED;
    return Math.min(4, Math.max(0.25, raw));
}

function updateVendorVisibility(vendor) {
    const { ttsVendorConditionals = [], ttsSubtabs, ttsPanes } = getElements();

    ttsVendorConditionals.forEach((node) => {
        const target = node?.dataset?.ttsVendor;
        if (!target) return;
        const shouldShow = target === vendor;
        if ('hidden' in node) {
            node.hidden = !shouldShow;
        } else if (node.style) {
            node.style.display = shouldShow ? '' : 'none';
        }
    });

    let activeTarget = null;
    if (ttsSubtabs?.length) {
        ttsSubtabs.forEach((btn) => {
            const targetVendor = btn.dataset.ttsVendor;
            const visible = !targetVendor || targetVendor === vendor;
            btn.hidden = !visible;
            if (visible && btn.classList.contains('active')) {
                activeTarget = btn.dataset.subtab;
            }
        });
        if (!activeTarget) {
            const fallback = Array.from(ttsSubtabs).find((btn) => !btn.hidden);
            if (fallback) {
                activeTarget = fallback.dataset.subtab;
                ttsSubtabs.forEach((btn) =>
                    btn.classList.toggle('active', btn === fallback),
                );
            }
        } else {
            ttsSubtabs.forEach((btn) =>
                btn.classList.toggle(
                    'active',
                    !btn.hidden && btn.dataset.subtab === activeTarget,
                ),
            );
        }
    }

    if (!activeTarget) activeTarget = 'settings';

    if (ttsPanes?.length) {
        ttsPanes.forEach((pane) => {
            const targetVendor = pane.dataset.ttsVendor;
            const visible = !targetVendor || targetVendor === vendor;
            pane.hidden = !visible;
            const paneTarget = pane.id?.replace('cip-tts-pane-', '');
            pane.classList.toggle('active', visible && paneTarget === activeTarget);
        });
    }

    const { ttsEndpointLabel } = getElements();
    if (ttsEndpointLabel) {
        if (vendor === TTS_VENDORS.SILICON_FLOW) {
            ttsEndpointLabel.title = SILICON_FLOW_TTS_API_DOC;
        } else if (vendor === TTS_VENDORS.ELEVEN_LABS) {
            ttsEndpointLabel.title = ELEVEN_LABS_TTS_API_DOC;
        } else {
            ttsEndpointLabel.removeAttribute('title');
        }
    }
}

function applyTTSSettingsToUI(settings) {
    const {
        ttsVendorSelect,
        ttsKeyInput,
        ttsEndpointInput,
        ttsModelInput,
        ttsVoiceInput,
        ttsElevenApiKeyInput,
        ttsElevenVoiceIdInput,
        ttsElevenModelIdInput,
        ttsElevenLatencyInput,
        ttsElevenStabilityInput,
        ttsElevenSimilarityInput,
        ttsElevenStyleInput,
        ttsElevenSpeakerBoostInput,
    } = getElements();

    const normalized = normalizeSettings(settings);
    if (ttsVendorSelect) {
        ttsVendorSelect.value = normalized.vendor || DEFAULT_TTS_VENDOR;
    }

    if (ttsKeyInput) ttsKeyInput.value = normalized.siliconFlow.key || '';
    if (ttsEndpointInput)
        ttsEndpointInput.value =
            normalized.siliconFlow.endpoint || getDefaultEndpoint();

    if (ttsModelInput) {
        const model = normalized.siliconFlow.model;
        if (model) {
            if (
                !ttsModelInput.options.length ||
                !ttsModelInput.querySelector(`option[value="${model}"]`)
            ) {
                const opt = new Option(model, model, true, true);
                ttsModelInput.innerHTML = '';
                ttsModelInput.add(opt);
            }
            ttsModelInput.value = model;
        } else {
            ttsModelInput.selectedIndex = -1;
        }
    }

    if (ttsVoiceInput) {
        const voice = normalized.siliconFlow.voice;
        if (voice) {
            if (
                !ttsVoiceInput.options.length ||
                !ttsVoiceInput.querySelector(`option[value="${voice}"]`)
            ) {
                const opt = new Option(voice, voice, true, true);
                ttsVoiceInput.innerHTML = '';
                ttsVoiceInput.add(opt);
            }
            ttsVoiceInput.value = voice;
        } else {
            ttsVoiceInput.selectedIndex = -1;
        }
    }

    if (ttsElevenApiKeyInput)
        ttsElevenApiKeyInput.value = normalized.elevenLabs.apiKey || '';
    if (ttsElevenVoiceIdInput)
        ttsElevenVoiceIdInput.value = normalized.elevenLabs.voiceId || '';
    if (ttsElevenModelIdInput)
        ttsElevenModelIdInput.value = normalized.elevenLabs.modelId || '';

    const latency = normalized.elevenLabs.optimizeStreamingLatency;
    if (ttsElevenLatencyInput)
        ttsElevenLatencyInput.value =
            latency === null || latency === undefined ? '' : latency;

    const stability = normalized.elevenLabs.stability;
    if (ttsElevenStabilityInput)
        ttsElevenStabilityInput.value =
            stability === null || stability === undefined ? '' : stability;

    const similarity = normalized.elevenLabs.similarityBoost;
    if (ttsElevenSimilarityInput)
        ttsElevenSimilarityInput.value =
            similarity === null || similarity === undefined ? '' : similarity;

    const style = normalized.elevenLabs.style;
    if (ttsElevenStyleInput)
        ttsElevenStyleInput.value =
            style === null || style === undefined ? '' : style;

    if (ttsElevenSpeakerBoostInput) {
        ttsElevenSpeakerBoostInput.checked =
            normalized.elevenLabs.useSpeakerBoost || false;
    }

    updateVendorVisibility(normalized.vendor || DEFAULT_TTS_VENDOR);
}

function readTTSSettingsFromUI() {
    const {
        ttsVendorSelect,
        ttsKeyInput,
        ttsEndpointInput,
        ttsModelInput,
        ttsVoiceInput,
        ttsElevenApiKeyInput,
        ttsElevenVoiceIdInput,
        ttsElevenModelIdInput,
        ttsElevenLatencyInput,
        ttsElevenStabilityInput,
        ttsElevenSimilarityInput,
        ttsElevenStyleInput,
        ttsElevenSpeakerBoostInput,
    } = getElements();

    const nextSettings = {
        vendor: ttsVendorSelect?.value || DEFAULT_TTS_VENDOR,
        siliconFlow: {
            key: (ttsKeyInput?.value || '').trim(),
            endpoint:
                (ttsEndpointInput?.value || '').trim() || getDefaultEndpoint(),
            model: (ttsModelInput?.value || '').trim(),
            voice: (ttsVoiceInput?.value || '').trim(),
        },
        elevenLabs: {
            apiKey: (ttsElevenApiKeyInput?.value || '').trim(),
            voiceId: (ttsElevenVoiceIdInput?.value || '').trim(),
            modelId: (ttsElevenModelIdInput?.value || '').trim(),
            baseUrl: DEFAULT_ELEVENLABS_BASE_URL,
            optimizeStreamingLatency: toOptionalNumber(
                ttsElevenLatencyInput?.value,
                0,
                4,
                { integer: true },
            ),
            stability: toOptionalNumber(
                ttsElevenStabilityInput?.value,
                0,
                1,
                { precision: 2 },
            ),
            similarityBoost: toOptionalNumber(
                ttsElevenSimilarityInput?.value,
                0,
                1,
                { precision: 2 },
            ),
            style: toOptionalNumber(
                ttsElevenStyleInput?.value,
                0,
                100,
                { integer: true },
            ),
            useSpeakerBoost: Boolean(ttsElevenSpeakerBoostInput?.checked),
        },
    };

    return normalizeSettings(nextSettings);
}

function saveTTSSettings(settings) {
    try {
        getDeps().localStorageRef?.setItem(
            'cip_tts_settings_v1',
            JSON.stringify(normalizeSettings(settings)),
        );
    } catch (error) {
        console.error('保存语音设置失败 (localStorage)', error);
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
    if (!settings.key) throw new Error('请先填写硅基流动 API Key');

    const body = {
        model: settings.model || DEFAULT_TTS_MODEL,
        voice: settings.voice || DEFAULT_TTS_VOICE,
        input: text,
        format: 'mp3',
        speed: getSpeechSpeed(),
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
        throw new Error(
            `硅基流动请求失败 (HTTP ${res.status}): ${await res.text()}`,
        );
    }
    return await res.blob();
}

async function fetchElevenLabsTTS(text, settings) {
    const fetchImpl = getDeps().fetchRef;
    return await requestElevenLabsTTS(fetchImpl, text, {
        ...settings,
        baseUrl: settings.baseUrl || DEFAULT_ELEVENLABS_BASE_URL,
    });
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
    const vendor = settings.vendor || DEFAULT_TTS_VENDOR;
    let blob = null;

    if (vendor === TTS_VENDORS.SILICON_FLOW) {
        const vendorSettings = { ...settings.siliconFlow };
        if (!vendorSettings.key) {
            throw new Error('请先填写硅基流动 API Key');
        }
        if (!vendorSettings.model) vendorSettings.model = DEFAULT_TTS_MODEL;
        if (!vendorSettings.voice) vendorSettings.voice = DEFAULT_TTS_VOICE;
        blob = await fetchSiliconFlowTTS(text, vendorSettings);
    } else if (vendor === TTS_VENDORS.ELEVEN_LABS) {
        const vendorSettings = { ...settings.elevenLabs };
        vendorSettings.baseUrl =
            vendorSettings.baseUrl || DEFAULT_ELEVENLABS_BASE_URL;
        if (!vendorSettings.apiKey) {
            throw new Error('请先填写 ElevenLabs API Key');
        }
        if (!vendorSettings.voiceId) {
            throw new Error('请先填写 ElevenLabs Voice ID');
        }
        if (!vendorSettings.modelId) {
            vendorSettings.modelId = DEFAULT_ELEVENLABS_MODEL_ID;
        }
        blob = await fetchElevenLabsTTS(text, vendorSettings);
    } else {
        throw new Error('未知的语音厂商，请重新选择');
    }

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
        if (getSelectedVendorValue() !== TTS_VENDORS.SILICON_FLOW) return;
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
                if (getSelectedVendorValue() !== TTS_VENDORS.SILICON_FLOW) {
                    updateTTSStatus('上传音色仅支持硅基流动，请切换厂商', true);
                    return;
                }
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
            if (getSelectedVendorValue() !== TTS_VENDORS.SILICON_FLOW) {
                updateTTSStatus('删除音色仅支持硅基流动，请切换厂商', true);
                return;
            }
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
            if (getSelectedVendorValue() !== TTS_VENDORS.SILICON_FLOW) {
                updateTTSStatus('刷新音色仅支持硅基流动，请切换厂商', true);
                return;
            }
            ttsModelInput?.dispatchEvent(new Event('change'));
            updateTTSStatus('音色已刷新');
        });
    }
}

function setupCheckHandler() {
    const { ttsCheckBtn, ttsModelInput, ttsVoiceInput } = getElements();
    if (!ttsCheckBtn) return;
    ttsCheckBtn.addEventListener('click', async () => {
        const settings = readTTSSettingsFromUI();
        const vendor = settings.vendor || DEFAULT_TTS_VENDOR;
        try {
            if (vendor === TTS_VENDORS.SILICON_FLOW) {
                if (!ttsModelInput || !ttsVoiceInput) {
                    throw new Error('当前环境缺少模型或音色选择控件');
                }
                updateTTSStatus('正在连接硅基流动...');
                const models = [
                    'FunAudioLLM/CosyVoice2-0.5B',
                    'fnlp/MOSS-TTSD-v0.5',
                ];
                ttsModelInput.innerHTML = '';
                models.forEach((m) => ttsModelInput.appendChild(new Option(m, m)));
                ttsModelInput.value = models[0];
                ttsVoiceInput.innerHTML = '';
                const doc = getDeps().documentRef;
                if (!doc) throw new Error('无法访问文档对象');
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
                const apiKey = settings.siliconFlow?.key;
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
            } else if (vendor === TTS_VENDORS.ELEVEN_LABS) {
                const fetchImpl = getDeps().fetchRef;
                if (!fetchImpl) throw new Error('浏览器不支持 fetch');
                const { elevenLabs } = settings;
                if (!elevenLabs.apiKey) {
                    throw new Error('请先填写 ElevenLabs API Key');
                }
                if (!elevenLabs.voiceId) {
                    throw new Error('请先填写 ElevenLabs Voice ID');
                }
                updateTTSStatus('正在验证 ElevenLabs 配置...');
                await verifyElevenLabsConfig(fetchImpl, {
                    apiKey: elevenLabs.apiKey,
                    voiceId: elevenLabs.voiceId,
                    baseUrl: elevenLabs.baseUrl,
                });
                saveTTSSettings(settings);
                updateTTSStatus('连接成功，ElevenLabs 配置有效');
            } else {
                throw new Error('未知的语音厂商，无法连接');
            }
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
            if (btn.hidden) return;
            const target = btn.dataset.subtab;
            ttsSubtabs.forEach((b) =>
                b.classList.toggle('active', !b.hidden && b === btn),
            );
            ttsPanes.forEach((pane) =>
                pane.classList.toggle(
                    'active',
                    !pane.hidden && pane.id === `cip-tts-pane-${target}`,
                ),
            );
        });
    });
}

function setupVendorChangeHandler() {
    const { ttsVendorSelect, ttsModelInput } = getElements();
    if (!ttsVendorSelect) return;
    ttsVendorSelect.addEventListener('change', () => {
        const next = readTTSSettingsFromUI();
        applyTTSSettingsToUI(next);
        saveTTSSettings(next);
        updateTTSStatus(
            `已切换到 ${getVendorDisplayName(next.vendor)}, 请完善对应配置`,
        );
        if (next.vendor === TTS_VENDORS.SILICON_FLOW) {
            ttsModelInput?.dispatchEvent(new Event('change'));
        }
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

    const doc = getDeps().documentRef;
    if (doc) {
        const conditionalSet = new Set([
            ...(Array.isArray(voiceState.elements.ttsVendorGroups)
                ? voiceState.elements.ttsVendorGroups
                : []),
            ...Array.from(doc.querySelectorAll('[data-tts-vendor]')),
        ]);
        voiceState.elements.ttsVendorConditionals = Array.from(conditionalSet);
    } else if (!voiceState.elements.ttsVendorConditionals) {
        voiceState.elements.ttsVendorConditionals = Array.isArray(
            voiceState.elements.ttsVendorGroups,
        )
            ? voiceState.elements.ttsVendorGroups
            : [];
    }

    const { ttsEndpointInput, ttsModelInput } = getElements();
    if (ttsEndpointInput && !ttsEndpointInput.value) {
        ttsEndpointInput.value = getDefaultEndpoint();
    }

    const initialSettings = getTTSSettings();
    applyTTSSettingsToUI(initialSettings);

    setupTabs();
    setupVendorChangeHandler();
    setupSaveAndTest();
    setupSpeedControls();
    setupModelChangeHandler();
    setupUploadHandlers();
    setupDeleteVoiceHandler();
    setupRefreshHandler();
    setupCheckHandler();

    if (initialSettings.vendor === TTS_VENDORS.SILICON_FLOW) {
        ttsModelInput?.dispatchEvent(new Event('change'));
    }

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
