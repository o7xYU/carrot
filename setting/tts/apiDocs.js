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

export const ELEVEN_LABS_TTS_API_DOC = `ElevenLabs 文本转语音接口使用说明：
POST {baseUrl}/v1/text-to-speech/{voice_id}
Headers:
  xi-api-key: <API Key>
  Content-Type: application/json
  Accept: audio/mpeg
Body:
{
  "text": "待合成的文本",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.5,
    "style": 0,
    "use_speaker_boost": false
  }
}
接口返回音频二进制流 (MPEG)，可用于即时播放。`;
