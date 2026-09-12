import re

def sanitize_input(text: str) -> str:
    """
    Basic input sanitizer to prevent unwanted script tags or control characters.
    """
    if not text:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r'<[^>]*>', '', text)
    return cleaned.strip()
