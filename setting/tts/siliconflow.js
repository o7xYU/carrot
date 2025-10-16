// 硅基流动 API 参考：https://docs.siliconflow.cn/api-reference/

export const DEFAULT_ENDPOINT = 'https://api.siliconflow.cn/v1';

function normalizeEndpoint(base, path) {
    const trimmed = (base || DEFAULT_ENDPOINT).replace(/\/$/, '');
    return `${trimmed}${path}`;
}

export async function requestSpeech({ key, endpoint, model, voice, text, speed }) {
    if (!key) throw new Error('未配置硅基流动API Key');
    const url = normalizeEndpoint(endpoint, '/audio/speech');
    const body = {
        model: model || 'FunAudioLLM/CosyVoice2-0.5B',
        voice: voice || 'FunAudioLLM/CosyVoice2-0.5B:alex',
        input: text,
        format: 'mp3',
        speed: speed || 1,
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
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
        } catch (error) {
            // ignore
        }
        throw new Error(errText);
    }
    if (contentType.includes('audio')) {
        return await res.blob();
    }
    const json = await res.json();
    if (json && json.audio) {
        const binary = atob(json.audio);
        const uint8 = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            uint8[i] = binary.charCodeAt(i);
        }
        return new Blob([uint8], { type: 'audio/mpeg' });
    }
    throw new Error('未返回音频');
}

export async function fetchModels(key) {
    const res = await fetch(`${DEFAULT_ENDPOINT}/models`, {
        headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data?.data) ? data.data : [];
}

export async function listVoices(key) {
    const res = await fetch(`${DEFAULT_ENDPOINT}/audio/voice/list`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    const list = data?.result || data?.results || [];
    return Array.isArray(list) ? list : [];
}

export async function uploadVoiceSample({ key, name, text, audioBase64 }) {
    const res = await fetch(`${DEFAULT_ENDPOINT}/audio/voice`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            text,
            audio: audioBase64,
        }),
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
}

export async function deleteVoiceSample({ key, uri }) {
    const res = await fetch(`${DEFAULT_ENDPOINT}/audio/voice/deletions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri }),
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
}
