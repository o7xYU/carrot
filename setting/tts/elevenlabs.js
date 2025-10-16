import {
    DEFAULT_ELEVENLABS_BASE_URL,
    DEFAULT_ELEVENLABS_MODEL_ID,
} from './constants.js';

function clamp(value, min, max) {
    if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
    return Math.min(max, Math.max(min, value));
}

function sanitizeNumber(value, min, max, precision = null) {
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) value = parsed;
    }
    if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
    let next = clamp(value, min, max);
    if (precision != null) {
        const factor = 10 ** precision;
        next = Math.round(next * factor) / factor;
    }
    return next;
}

export async function requestElevenLabsTTS(fetchImpl, text, options = {}) {
    if (!fetchImpl) throw new Error('浏览器不支持 fetch');
    const payloadText = (text || '').trim();
    if (!payloadText) throw new Error('语音内容不能为空');

    const apiKey = (options.apiKey || '').trim();
    if (!apiKey) throw new Error('未提供 ElevenLabs API Key');
    const voiceId = (options.voiceId || '').trim();
    if (!voiceId) throw new Error('未提供 ElevenLabs Voice ID');

    const baseUrl = (options.baseUrl || DEFAULT_ELEVENLABS_BASE_URL).replace(/\/$/, '');
    const endpoint = `${baseUrl}/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

    const body = {
        text: payloadText,
    };

    const modelId = (options.modelId || '').trim();
    if (modelId) {
        body.model_id = modelId;
    } else {
        body.model_id = DEFAULT_ELEVENLABS_MODEL_ID;
    }

    const latency = sanitizeNumber(options.optimizeStreamingLatency, 0, 4);
    if (typeof latency === 'number') {
        body.optimize_streaming_latency = Math.round(latency);
    }

    const stability = sanitizeNumber(options.stability, 0, 1, 2);
    const similarity = sanitizeNumber(options.similarityBoost, 0, 1, 2);
    const style = sanitizeNumber(options.style, 0, 100, 0);
    const speakerBoost =
        typeof options.useSpeakerBoost === 'boolean'
            ? options.useSpeakerBoost
            : undefined;

    const voiceSettings = {};
    if (typeof stability === 'number') voiceSettings.stability = stability;
    if (typeof similarity === 'number')
        voiceSettings.similarity_boost = similarity;
    if (typeof style === 'number') voiceSettings.style = style;
    if (typeof speakerBoost === 'boolean')
        voiceSettings.use_speaker_boost = speakerBoost;
    if (Object.keys(voiceSettings).length) {
        body.voice_settings = voiceSettings;
    }

    const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`ElevenLabs 请求失败 (HTTP ${res.status}): ${await res.text()}`);
    }

    return await res.blob();
}

export async function verifyElevenLabsConfig(fetchImpl, options = {}) {
    if (!fetchImpl) throw new Error('浏览器不支持 fetch');
    const apiKey = (options.apiKey || '').trim();
    if (!apiKey) throw new Error('未提供 ElevenLabs API Key');
    const voiceId = (options.voiceId || '').trim();
    if (!voiceId) throw new Error('未提供 ElevenLabs Voice ID');
    const baseUrl = (options.baseUrl || DEFAULT_ELEVENLABS_BASE_URL).replace(/\/$/, '');
    const endpoint = `${baseUrl}/v1/voices/${encodeURIComponent(voiceId)}`;

    const res = await fetchImpl(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'xi-api-key': apiKey,
        },
    });

    if (!res.ok) {
        throw new Error(
            `ElevenLabs 校验失败 (HTTP ${res.status}): ${await res.text()}`,
        );
    }

    return await res.json();
}
