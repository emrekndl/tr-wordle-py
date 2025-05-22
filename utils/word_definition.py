import logging
import requests
from typing import List
from requests.exceptions import JSONDecodeError


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

session = requests.Session()

USER_AGENTS = (
    "Mozilla/5.0 (X11; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
)

session.headers.update(
    {
        "User-Agent": USER_AGENTS[0],
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://sozluk.gov.tr/",
        "DNT": "1",
    }
)


def get_word_definition(word: str) -> List[str]:
    """Fetch and parse word definitions from TDK.gov.tr"""
    w = str(word).lower()
    try:
        response = session.get(f"https://sozluk.gov.tr/gts?ara={w}", timeout=5)
        response.raise_for_status()
        return parse_word_definition(response)
    except (requests.RequestException, JSONDecodeError):
        logger.exception(f"Failed to fetch word definitions: {word}")
        return []


def parse_word_definition(response: requests.Response) -> List[str]:
    """Extract definitions from API response"""

    try:
        json_data = response.json()
    except JSONDecodeError:
        logger.exception("Failed to parse JSON response.")
        return []

    return [
        meaning["anlam"]
        for entry in json_data
        if isinstance(entry, dict)
        for meaning in entry.get("anlamlarListe", [])
        if isinstance(meaning, dict) and "anlam" in meaning
    ]


def main():
    print(get_word_definition("TÜRK"))


if __name__ == "__main__":
    main()
