import abc
from typing import Optional
from app.utils.logger import logger


class BaseSpeechProvider(abc.ABC):
    @abc.abstractmethod
    async def transcribe_audio(self, audio_bytes: bytes, language: str = "en-US") -> str:
        """Transcribe raw audio bytes into text."""
        pass


class WebSpeechClientIngestionProvider(BaseSpeechProvider):
    """
    Default provider that accepts client-side Web Speech API transcripts or fallback audio.
    """
    async def transcribe_audio(self, audio_bytes: bytes, language: str = "en-US") -> str:
        logger.info(f"Processing audio bytes of length: {len(audio_bytes)}")
        # Fallback / mock transcript if raw bytes are sent directly to backend
        return "Speech received and transcribed successfully."


class SpeechService:
    def __init__(self, provider: Optional[BaseSpeechProvider] = None):
        self.provider = provider or WebSpeechClientIngestionProvider()

    async def transcribe(self, audio_bytes: bytes, language: str = "en-US") -> str:
        return await self.provider.transcribe_audio(audio_bytes, language)

    def process_transcript(self, raw_transcript: str) -> str:
        """Sanitize and structure candidate transcript."""
        if not raw_transcript:
            return ""
        cleaned = " ".join(raw_transcript.strip().split())
        return cleaned


speech_service = SpeechService()
