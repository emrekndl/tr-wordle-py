import logging

import numpy as np

from utils.random_word import tr_lower

logger = logging.getLogger(__name__)


def check(guess: str, word: str) -> dict:
    guess = tr_lower(guess)

    guess_arr = np.array(list(guess))
    word_arr = np.array(list(word))
    idx_with_correct_letters = dict()
    correct_letters_in_not_correct_position = []

    correct_mask = guess_arr == word_arr
    remaning_letters_word = word_arr[~correct_mask].tolist()

    remaning_letters_guess = guess_arr[~correct_mask]
    wrong_letters = np.setdiff1d(remaning_letters_guess, word_arr)

    for idx, mask in enumerate(correct_mask):
        if mask:
            idx_with_correct_letters[idx] = guess_arr.item(idx)
        else:
            if guess_arr[idx] not in wrong_letters.tolist():
                if guess_arr[idx] in remaning_letters_word:
                    remaning_letters_word.remove(guess_arr[idx])
                    correct_letters_in_not_correct_position.append(guess_arr.item(idx))

    is_complete = np.all(correct_mask)

    logger.debug(f"correct_letters: {idx_with_correct_letters}")
    logger.debug(f"missplaced_letters: {correct_letters_in_not_correct_position}")
    logger.debug(f"wrong_letters: {wrong_letters}")
    logger.debug(f"is_complete: {is_complete}")

    return {
        "correct_letters": idx_with_correct_letters,
        "incorrect_letters": list(wrong_letters),
        "correct_letters_in_not_correct_position": correct_letters_in_not_correct_position,
        "is_complete": bool(is_complete),
    }
