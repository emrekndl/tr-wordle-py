import logging
import numpy as np
from utils.random_word import trUpper


logger = logging.getLogger(__name__)


def check(guess: str, word: str) -> dict:
    guess = trUpper(guess)

    guess_arr = np.array(list(guess))
    word_arr = np.array(list(word))

    correct_mask = guess_arr == word_arr
    correct_letters = guess_arr[correct_mask]

    remaning_letters = guess_arr[~correct_mask]
    missplaced_letters = np.intersect1d(remaning_letters, word_arr)
    wrong_letters = np.setdiff1d(remaning_letters, word_arr)

    is_complete = np.all(correct_mask)

    logger.debug(f"correct_letters: {correct_letters}")
    logger.debug(f"wrong_letters: {wrong_letters}")
    logger.debug(f"missplaced_letters: {missplaced_letters}")
    logger.debug(f"is_complete: {is_complete}")

    return {
        "correct_letters": list(correct_letters),
        "incorrect_letters": list(wrong_letters),
        "correct_letters_in_not_correct_position": list(missplaced_letters),
        "is_complete": bool(is_complete),
    }


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
