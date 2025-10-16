export const SILICONFLOW_TTS_DOCS = Object.freeze({
    baseUrl: 'https://api.siliconflow.cn/v1',
    speechEndpoint: '/audio/speech',
    voiceUploadEndpoint: '/uploads/audio/voice',
    voiceListEndpoint: '/audio/voice/list',
    voiceDeleteEndpoint: '/audio/voice/deletions',
    modelListEndpoint: '/models',
});

export function buildSiliconflowUrl(base, path) {
    const normalizedBase = (base || SILICONFLOW_TTS_DOCS.baseUrl).replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}
