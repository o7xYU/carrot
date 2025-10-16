// ===== ElevenLabs TTS Provider for 胡萝卜插件 =====

// tts/providers/elevenlabs.js
export default class ElevenLabsProvider {
    constructor({ fetch: fetchImpl } = {}) {
        this.name = 'elevenlabs';
        this.displayName = 'ElevenLabs';
        this.apiEndpoint = 'https://api.elevenlabs.io/v1'; // 固定端点
        this.fetchImpl =
            fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);

        // 默认设置
        this.defaultSettings = {
            stability: 0.75,
            similarity_boost: 0.75,
            style_exaggeration: 0.0,
            speaker_boost: true,
            speed: 1.0,
        };
    }

    // 统一接口：合成语音
    async synthesize(text, settings) {
        const apiKey = settings.key;
        const voiceId = settings.voice || 'EXAVITQu4vr4xnSDxMaL';
        const modelId = settings.model || 'eleven_multilingual_v2';
        
        // 确保 stability 值是允许的值之一
        let stability = parseFloat(settings.stability) || 0.5;
        
        // 将 stability 映射到允许的值
        if (stability <= 0.25) {
            stability = 0.0;  // Creative
        } else if (stability <= 0.75) {
            stability = 0.5;  // Natural
        } else {
            stability = 1.0;  // Robust
        }
        
        // 确保 similarity_boost 在有效范围内
        const similarity_boost = Math.max(0, Math.min(1, parseFloat(settings.similarity) || 0.75));
        
        const fetchFn = this.fetchImpl;
        if (typeof fetchFn !== 'function') {
            throw new Error('当前环境不支持 fetch');
        }

        const response = await fetchFn(
            `${this.apiEndpoint}/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: modelId,
                    voice_settings: {
                        stability: stability,
                        similarity_boost: similarity_boost
                    }
            })
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs API错误 (${response.status}): ${error}`);
        }

        return await response.blob();
    }

    // 统一接口：获取模型列表（从ST复制）
    async getModels(settings) {
        return [
            { id: 'eleven_v3', name: 'Eleven v3' },
            { id: 'eleven_ttv_v3', name: 'Eleven ttv v3' },
            { id: 'eleven_multilingual_v2', name: 'Multilingual v2' },
            { id: 'eleven_flash_v2_5', name: 'Eleven Flash v2.5' },
            { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5 (推荐)' },
            { id: 'eleven_multilingual_ttv_v2', name: 'Multilingual ttv v2' },
            { id: 'eleven_monolingual_v1', name: 'English v1 (Old)' },
            { id: 'eleven_multilingual_v1', name: 'Multilingual v1 (Old)' },
            { id: 'eleven_turbo_v2', name: 'Turbo v2 (Old)' }
        ];
    }

    // 统一接口：获取音色列表
    async getVoices(settings) {
        if (!settings.key) {
            throw new Error('请先填写ElevenLabs API Key');
        }
        
        const fetchFn = this.fetchImpl;
        if (typeof fetchFn !== 'function') {
            throw new Error('当前环境不支持 fetch');
        }

        const response = await fetchFn(`${this.apiEndpoint}/voices`, {
            headers: {
                'xi-api-key': settings.key,
            },
        });
        
        if (!response.ok) {
            throw new Error(`获取音色列表失败: ${response.status} - ${await response.text()}`);
        }
        
        const data = await response.json();
        
        // 转换为统一格式
        return data.voices.map(voice => ({
            id: voice.voice_id,
            name: voice.name,
            group: voice.category === 'premade' ? '官方预设' : 
                   voice.category === 'cloned' ? '克隆音色' : 
                   voice.category === 'professional' ? '专业音色' : '其他'
        }));
    }

    // 不支持通过API上传音色
    async uploadVoice(data, settings) {
        throw new Error('ElevenLabs的音色克隆需要在官网进行');
    }

    // 不支持通过API删除音色
    async deleteVoice(voiceId, settings) {
        throw new Error('请在ElevenLabs官网管理音色');
    }
}
