export const SILICON_FLOW_TTS_API_DOC = `SiliconFlow 语音合成接口使用说明：
POST {endpoint}/audio/speech
Headers:
  Authorization: Bearer <API Key>
  Content-Type: application/json
Body:
{
  "model": "FunAudioLLM/CosyVoice2-0.5B",
  "voice": "FunAudioLLM/CosyVoice2-0.5B:alex",
  "input": "待合成的文本",
  "format": "mp3",
  "speed": 1
}
接口返回音频二进制流，可用于即时播放。`;
