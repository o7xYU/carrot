import { SILICONFLOW_TTS_DOCS, buildSiliconflowUrl } from './siliconflowDocs.js';

export function initTTSSettings({ document, elements }) {
    if (!elements) {
        throw new Error('TTS settings require element references');
    }

    const {
        ttsKeyInput,
        ttsModelInput,
        ttsVoiceInput,
        ttsEndpointInput,
        ttsSpeedRange,
        ttsSpeedValue,
        ttsUploadName,
        ttsUploadText,
        ttsUploadFile,
        ttsUploadFileBtn,
        ttsUploadBtn,
        ttsRefreshVoicesBtn,
        ttsSaveBtn,
        ttsTestText,
        ttsTestBtn,
        ttsCheckBtn,
        ttsStatus,
        ttsVoiceDeleteBtn,
        ttsSubtabs,
        ttsPanes,
    } = elements;

    const ttsQueue = [];
    let ttsIsPlaying = false;
    let ttsCurrentAudio = null;
    let currentBubble = null;

    function getDefaultTTSEndpoint() {
        return SILICONFLOW_TTS_DOCS.baseUrl;
    }

    function getTTSSettings() {
        let settings = null;
        try {
            settings = JSON.parse(localStorage.getItem('cip_tts_settings_v1')) || null;
        } catch (e) {
            settings = null;
        }
        if (!settings) {
            settings = {
                key: '',
                endpoint: getDefaultTTSEndpoint(),
                model: '',
                voice: '',
            };
        }
        if (!settings.endpoint) settings.endpoint = getDefaultTTSEndpoint();
        return settings;
    }

    function applyTTSSettingsToUI(settings) {
        if (ttsKeyInput) ttsKeyInput.value = settings.key || '';
        if (ttsEndpointInput)
            ttsEndpointInput.value = settings.endpoint || getDefaultTTSEndpoint();
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
        return {
            key: (ttsKeyInput?.value || '').trim(),
            endpoint:
                (ttsEndpointInput?.value || '').trim() || getDefaultTTSEndpoint(),
            model: (ttsModelInput?.value || '').trim(),
            voice: (ttsVoiceInput?.value || '').trim(),
        };
    }

    function saveTTSSettings(settings) {
        try {
            localStorage.setItem('cip_tts_settings_v1', JSON.stringify(settings));
        } catch (e) {
            console.error('保存语音设置失败', e);
        }
    }

    function updateTTSStatus(text, isError = false) {
        if (!ttsStatus) return;
        ttsStatus.textContent = text;
        ttsStatus.style.color = isError ? '#e74c3c' : 'inherit';
    }

    async function fetchSiliconFlowTTS(text, settings) {
        const endpoint = buildSiliconflowUrl(
            settings.endpoint,
            SILICONFLOW_TTS_DOCS.speechEndpoint,
        );
        if (!settings.key) throw new Error('未配置硅基流动API Key');
        const body = {
            model: settings.model || 'FunAudioLLM/CosyVoice2-0.5B',
            voice: settings.voice || 'FunAudioLLM/CosyVoice2-0.5B:alex',
            input: text,
            format: 'mp3',
            speed: parseFloat(ttsSpeedRange?.value || '1') || 1,
        };
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${settings.key}`,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg,application/json',
            },
            body: JSON.stringify(body),
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
            let errText = `HTTP ${res.status}`;
            try {
                errText = await res.text();
            } catch (e) {
                // ignore
            }
            throw new Error(errText);
        }
        if (contentType.includes('audio')) {
            return await res.blob();
        }
        const json = await res.json();
        if (json && json.audio) {
            const b64 = json.audio;
            const bin = atob(b64);
            const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            return new Blob([u8], { type: 'audio/mpeg' });
        }
        throw new Error('未返回音频');
    }

    async function synthesizeTTS(text, playOnReady = true) {
        const settings = getTTSSettings();
        if (!text || !text.trim()) throw new Error('文本为空');
        if (!settings.key) throw new Error('未配置API Key');
        updateTTSStatus('合成中...');
        const blob = await fetchSiliconFlowTTS(text, settings);
        updateTTSStatus('合成完成');
        if (playOnReady && blob) enqueueAudioBlob(blob);
        return blob;
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

    function stopTTSPlayback() {
        try {
            if (ttsCurrentAudio) {
                ttsCurrentAudio.pause();
                ttsCurrentAudio.src = '';
            }
        } catch (e) {
            // ignore
        }
        ttsCurrentAudio = null;
        ttsIsPlaying = false;
        ttsQueue.length = 0;
    }

    function playImmediateBlob(blob) {
        stopTTSPlayback();
        if (blob) {
            ttsQueue.push(blob);
            playNextAudio();
        }
    }

    function setCurrentBubble(element) {
        currentBubble = element;
    }

    function clearCurrentBubble() {
        currentBubble = null;
    }

    function isCurrentBubble(element) {
        return currentBubble && currentBubble === element;
    }

    async function populateCustomVoices(settings) {
        try {
            const res = await fetch(
                buildSiliconflowUrl(
                    settings.endpoint,
                    SILICONFLOW_TTS_DOCS.voiceListEndpoint,
                ),
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${settings.key}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            if (res.ok) {
                const data = await res.json();
                const arr = data?.result || data?.results || [];
                return (Array.isArray(arr) ? arr : [])
                    .map((v) => ({
                        value: v?.uri || v?.id || v?.voice_id,
                        label:
                            (v?.name || v?.customName || v?.custom_name || '自定义音色') +
                            ' (自定义)',
                    }))
                    .filter((v) => v.value);
            }
        } catch (e) {
            console.error('获取自定义音色失败', e);
        }
        return [];
    }

    function attachUIEvents() {
        ttsSaveBtn?.addEventListener('click', () => {
            const settings = readTTSSettingsFromUI();
            saveTTSSettings(settings);
            updateTTSStatus('设置已保存');
        });

        if (ttsSubtabs && ttsPanes) {
            Array.from(ttsSubtabs).forEach((btn) => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.subtab;
                    Array.from(ttsSubtabs).forEach((b) =>
                        b.classList.toggle('active', b === btn),
                    );
                    Array.from(ttsPanes).forEach((pane) =>
                        pane.classList.toggle(
                            'active',
                            pane.id === `cip-tts-pane-${target}`,
                        ),
                    );
                });
            });
        }

        ttsTestBtn?.addEventListener('click', async () => {
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
            } catch (e) {
                updateTTSStatus(`测试失败: ${e.message || e}`, true);
            }
        });

        if (ttsSpeedRange && ttsSpeedValue) {
            const updateSpeedLabel = () => {
                const v = parseFloat(ttsSpeedRange.value || '1') || 1;
                ttsSpeedValue.textContent = `${v.toFixed(2)}x`;
            };
            ttsSpeedRange.addEventListener('input', updateSpeedLabel);
            updateSpeedLabel();
        }

        ttsModelInput?.addEventListener('change', async () => {
            const settings = readTTSSettingsFromUI();
            const modelId = ttsModelInput.value || 'FunAudioLLM/CosyVoice2-0.5B';
            if (!ttsVoiceInput) return;
            ttsVoiceInput.innerHTML = '';
            const cosyModel = 'FunAudioLLM/CosyVoice2-0.5B';
            const mossModel = 'fnlp/MOSS-TTSD-v0.5';
            if (/^FunAudioLLM\/CosyVoice2-0\.5B$/i.test(modelId)) {
                const preset = ['alex', 'benjamin', 'charles', 'david', 'anna', 'bella', 'claire', 'diana'].map((v) => ({
                    value: `${modelId}:${v}`,
                    label: v,
                }));
                const g1 = document.createElement('optgroup');
                g1.label = '预设音色 (CosyVoice)';
                preset.forEach(({ value, label }) =>
                    g1.appendChild(new Option(label, value)),
                );
                ttsVoiceInput.appendChild(g1);
            }
            if (/^fnlp\/MOSS-TTSD-v0\.5$/i.test(modelId)) {
                const mossPreset = ['alex', 'anna', 'bella', 'benjamin', 'charles', 'claire', 'david', 'diana'].map((v) => ({
                    value: `${modelId}:${v}`,
                    label: v,
                }));
                const g2 = document.createElement('optgroup');
                g2.label = '预设音色 (MOSS)';
                mossPreset.forEach(({ value, label }) =>
                    g2.appendChild(new Option(label, value)),
                );
                ttsVoiceInput.appendChild(g2);
            }
            const custom = await populateCustomVoices(settings);
            if (custom.length) {
                const g3 = document.createElement('optgroup');
                g3.label = '自定义音色';
                custom.forEach(({ value, label }) =>
                    g3.appendChild(new Option(label, value)),
                );
                ttsVoiceInput.appendChild(g3);
            }
            if (ttsVoiceInput.options.length) ttsVoiceInput.selectedIndex = 0;
            saveTTSSettings(readTTSSettingsFromUI());
        });

        ttsUploadBtn?.addEventListener('click', async () => {
            try {
                if (!ttsKeyInput?.value) throw new Error('请先填写硅基流动 API Key');
                const name = (ttsUploadName?.value || '').trim();
                const text = (ttsUploadText?.value || '').trim();
                const file = ttsUploadFile?.files?.[0] || null;
                if (!name || !/^[a-zA-Z0-9_-]{1,64}$/.test(name))
                    throw new Error('音色名称仅允许字母数字-_，最长64');
                if (!text) throw new Error('请填写参考文本');
                if (!file) throw new Error('请选择参考音频文件');
                const reader = new FileReader();
                const result = await new Promise((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const base64Audio = reader.result;
                            const res = await fetch(
                                buildSiliconflowUrl(
                                    getDefaultTTSEndpoint(),
                                    SILICONFLOW_TTS_DOCS.voiceUploadEndpoint,
                                ),
                                {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `Bearer ${ttsKeyInput.value.trim()}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        model: 'FunAudioLLM/CosyVoice2-0.5B',
                                        customName: name,
                                        text,
                                        audio: base64Audio,
                                    }),
                                },
                            );
                            if (!res.ok)
                                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
                            resolve(await res.json());
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = () => reject(new Error('读取音频失败'));
                    reader.readAsDataURL(file);
                });
                updateTTSStatus(`上传成功，URI: ${result?.uri || '未知'}`);
                ttsModelInput?.dispatchEvent(new Event('change'));
            } catch (e) {
                updateTTSStatus(`上传失败: ${e.message || e}`, true);
            }
        });

        ttsUploadFileBtn?.addEventListener('click', () => ttsUploadFile?.click());

        ttsVoiceDeleteBtn?.addEventListener('click', async () => {
            try {
                const val = ttsVoiceInput?.value || '';
                if (!val) {
                    updateTTSStatus('请先选择要删除的音色', true);
                    return;
                }
                const isCustom = Array.from(
                    ttsVoiceInput?.querySelectorAll(
                        'optgroup[label="自定义音色"] option',
                    ) || [],
                ).some((o) => o.value === val);
                if (!isCustom) {
                    updateTTSStatus('只能删除自定义音色', true);
                    return;
                }
                if (!ttsKeyInput?.value) {
                    updateTTSStatus('请先填写API Key', true);
                    return;
                }
                const res = await fetch(
                    buildSiliconflowUrl(
                        getDefaultTTSEndpoint(),
                        SILICONFLOW_TTS_DOCS.voiceDeleteEndpoint,
                    ),
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${ttsKeyInput.value.trim()}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ uri: val }),
                    },
                );
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
                updateTTSStatus('音色删除成功');
                ttsModelInput?.dispatchEvent(new Event('change'));
            } catch (e) {
                updateTTSStatus(`删除失败: ${e.message || e}`, true);
            }
        });

        ttsRefreshVoicesBtn?.addEventListener('click', () => {
            ttsModelInput?.dispatchEvent(new Event('change'));
            updateTTSStatus('音色已刷新');
        });

        ttsCheckBtn?.addEventListener('click', async () => {
            const settings = readTTSSettingsFromUI();
            if (!settings.key) {
                updateTTSStatus('请先填写API Key', true);
                return;
            }
            try {
                updateTTSStatus('连接中...');
                const res = await fetch(
                    buildSiliconflowUrl(
                        settings.endpoint,
                        SILICONFLOW_TTS_DOCS.modelListEndpoint,
                    ),
                    {
                        headers: { Authorization: `Bearer ${settings.key}` },
                    },
                );
                const modelList = [];
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data?.data) ? data.data : [];
                    const picked = list
                        .map((x) => x?.id || x?.name || '')
                        .filter((id) => /tts|speech|audio/i.test(id));
                    if (picked.length) {
                        modelList.push(...picked);
                    }
                }
                if (!modelList.length) {
                    modelList.push('FunAudioLLM/CosyVoice2-0.5B', 'fnlp/MOSS-TTSD-v0.5');
                }
                if (ttsModelInput) {
                    ttsModelInput.innerHTML = '';
                    modelList.forEach((m) =>
                        ttsModelInput.appendChild(new Option(m, m)),
                    );
                    ttsModelInput.value = modelList[0];
                }
                if (ttsVoiceInput) {
                    ttsVoiceInput.innerHTML = '';
                }
                await new Promise((resolve) => {
                    ttsModelInput?.addEventListener('change', resolve, {
                        once: true,
                    });
                    ttsModelInput?.dispatchEvent(new Event('change'));
                });
                updateTTSStatus('连接成功，已自动填充模型与音色');
            } catch (e) {
                updateTTSStatus(`连接失败: ${e.message || e}`, true);
            }
        });
    }

    if (ttsEndpointInput && !ttsEndpointInput.value) {
        ttsEndpointInput.value = getDefaultTTSEndpoint();
    }

    attachUIEvents();

    return {
        getDefaultTTSEndpoint,
        getTTSSettings,
        applyTTSSettingsToUI,
        readTTSSettingsFromUI,
        saveTTSSettings,
        updateTTSStatus,
        synthesizeTTS,
        playImmediateBlob,
        stopTTSPlayback,
        isCurrentBubble,
        setCurrentBubble,
        clearCurrentBubble,
    };
}
