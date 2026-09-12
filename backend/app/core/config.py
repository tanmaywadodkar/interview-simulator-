import os
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "AI Interview Simulator"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = Field(default="development")
    
    # AI API Configuration
    AI_API_KEY: str = Field(default="")
    AI_MODEL: str = Field(default="gemini-1.5-flash")
    DEMO_MODE: bool = Field(default=True)
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./data/interview.db")
    
    # Security / CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def is_demo_mode(self) -> bool:
        return self.DEMO_MODE or not bool(self.AI_API_KEY.strip())


settings = Settings()
