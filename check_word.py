import logging

logger = logging.getLogger(__name__)
# import unicodedata
#
# TR_ALPHABET = [
#     "A",
#     "B",
#     "C",
#     "Ç",
#     "D",
#     "E",
#     "F",
#     "G",
#     "Ğ",
#     "H",
#     "I",
#     "İ",
#     "J",
#     "K",
#     "L",
#     "M",
#     "N",
#     "O",
#     "Ö",
#     "P",
#     "R",
#     "S",
#     "Ş",
#     "T",
#     "U",
#     "Ü",
#     "V",
#     "Y",
#     "Z",
# ]
# normalized_alphabet = [unicodedata.normalize("NFC", char) for char in TR_ALPHABET]


def check(guess, word):
    """Show the guesses and the word"""

    guess = guess.upper()
    correct_letters = {
        letter for letter, correct in zip(guess, word) if letter == correct
    }
    missplaced_letters = set(guess) & set(word) - correct_letters
    wrong_letters = set(guess) - set(word)
    logger.debug(
        f"correct_letters: {correct_letters}, missplaced_letters: {missplaced_letters}, wrong_letters: {wrong_letters}, guess: {guess}, word: {word}, is_complete: {len(correct_letters) == 5}"
    )

    return {
        "correct_letters": list(correct_letters),
        "incorrect_letters": list(wrong_letters),
        "correct_letters_in_not_correct_position": list(missplaced_letters),
        "is_complete": len(correct_letters) == 5,
    }
