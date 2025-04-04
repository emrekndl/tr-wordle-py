import random
import pathlib


def trUpper(word):
    """Turkish uppercase letters
    Example:
    >>> trUpper("i")
    "İ"
    """
    letters_list = {
        "i": "İ",
    }
    for letter in word:
        if letter in letters_list:
            word = word.replace(letter, letters_list[letter])
    return word


def get_random_word(wordlist):
    """Get a random five-letter word from a list of strings.
    Example:
    >>> get_random_word(["hello", "world"])
    "HELLO"
    """
    if words := [
        trUpper(word).upper()
        for word in wordlist
        if len(word) == 5 and word.isalpha()
        # if len(word) == 5 and re.fullmatch(r"[^\W0-9_]+", word)
    ]:
        return random.choice(words)
    else:
        print("No words of length 5 in the word list")
        raise SystemExit()


def get_wordlist():
    WORDLISTPATH = pathlib.Path(__file__).parent / "wordlist.txt"

    WORD = get_random_word(WORDLISTPATH.read_text().split("\n"))

    return WORD


def main():
    print(get_wordlist())


if __name__ == "__main__":
    main()
