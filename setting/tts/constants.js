export const TTS_VENDORS = [
    {
        id: 'siliconflow',
        name: '硅基流动',
        endpoint: 'https://api.siliconflow.cn/v1',
    },
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        endpoint: 'https://api.elevenlabs.io/v1',
    },
];

export const DEFAULT_TTS_VENDOR = 'siliconflow';

export const DEFAULT_TTS_ENDPOINT = TTS_VENDORS.find(
    (vendor) => vendor.id === DEFAULT_TTS_VENDOR,
)?.endpoint || 'https://api.siliconflow.cn/v1';

export const DEFAULT_TTS_MODEL = 'FunAudioLLM/CosyVoice2-0.5B';
export const DEFAULT_TTS_VOICE = 'FunAudioLLM/CosyVoice2-0.5B:alex';
export const DEFAULT_TTS_SPEED = 1;
