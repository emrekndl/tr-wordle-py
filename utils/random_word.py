import pathlib
import logging
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def trUpper(word):
    """Turkish uppercase letters
    Example:
    >>> trUpper("i")
    "İ"
    """
    letters_list = {
        "i": "İ",
        "ı": "I",
        "ö": "Ö",
        "ü": "Ü",
        "ç": "Ç",
        "ş": "Ş",
        "ğ": "Ğ",
    }
    for letter in word:
        if letter in letters_list:
            word = word.replace(letter, letters_list[letter])
    return word


def get_daily_word(wordlist):
    """Get a random five-letter word from a list of strings.
    Example:
    >>> get_daily_word(["hello", "world"])
    "HELLO"
    """
    # words count: 5683
    if words := [
        word
        for word in wordlist
        if len(word) == 5 and word.isalpha()
        # re.fullmatch(r"[^\W0-9_]+", word)
    ]:
        epoch = datetime(2025, 3, 30)
        now = datetime.now()
        # now = datetime.now() + timedelta(days=2)
        # ms_in_day = 24 * 60 * 60 * 1000
        # index = math.floor((now - epoch) / ms_in_day) % len(words)
        delta_days = (now - epoch).days
        index = delta_days % len(words)

        return trUpper(words[index]).upper()

    else:
        logger.error("No words of length 5 in the word list")
        return None


def get_wordlist():
    wordlistpath = pathlib.Path(__file__).parent.parent / "data/wordlist.csv"

    wordlist = wordlistpath.read_text(encoding="utf-8").splitlines()

    return wordlist


def get_wordle():
    wl = get_wordlist()
    return get_daily_word(wl)


def main():
    print(get_wordle())


if __name__ == "__main__":
    main()
