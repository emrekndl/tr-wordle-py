import logging
import pathlib
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)

WORD_LIST_PATH = "data/wordlist.txt"


def tr_lower(word):
    """Turkish uppercase letters
    Example:
    >>> tr_lower("İ")
    "İ"
    """
    letters_list = {
        "İ": "i",
        "I": "ı",
        "Ö": "ö",
        "Ü": "ü",
        "Ç": "ç",
        "Ş": "ş",
        "Ğ": "ğ",
    }
    for letter in word:
        if letter in letters_list:
            word = word.replace(letter, letters_list[letter])
    return word


"""
   today_str = datetime.now().strftime("%Y-%m-%d")
    # Örnek: b"2025-06-05"
    h = hashlib.sha256(today_str.encode()).digest()
    # Birkaç byte’ı tam sayıya çevir ve mod al
    idx = int.from_bytes(h[:4], "big") % len(wordlist)
    return tr_lower(wordlist[idx])
"""


def get_daily_word(wordlist):
    """Get a random five-letter word from a list of strings.
    Example:
    >>> get_daily_word(["hello", "world"])
    "HELLO"
    """
    # words count: 5683
    if wordlist:
        today_str = datetime.now().strftime("%Y-%m-%d")
        h = hashlib.sha256(today_str.encode()).digest()
        idx = int.from_bytes(h[:4], "big") % len(wordlist)
        # epoch = datetime(2025, 3, 30)
        # now = datetime.now()
        # delta_days = (now - epoch).days
        # index = delta_days % len(words)

        return tr_lower(wordlist[idx]).lower()

    else:
        logger.error("No suitable words were found in the word list")
        return None


def get_wordlist():
    """ Read the wordlist file and return suitable words"""
    wordlistpath = pathlib.Path(__file__).parent.parent / WORD_LIST_PATH

    return [word.strip()
            for word in wordlistpath.read_text(encoding="utf-8").splitlines()
            if len(word) == 5 and word.isalpha()
            ]
    # re.fullmatch(r"[^\W0-9_]+", word)


def get_wordle():
    """ Return a random daily word """
    wl = get_wordlist()
    return get_daily_word(wl)


def main():
    print(get_wordle())


if __name__ == "__main__":
    main()
