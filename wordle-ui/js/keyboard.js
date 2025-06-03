export function updateKeyboardColor(letter, state) {
    const upperLetter = letter.toUpperCase();
    const keyElement = Array.from(document.querySelectorAll(".key")).find(
        (key) => key.textContent.trim() === upperLetter
    );

    if (!keyElement) return;

    const colorPriority = {
        correct: 3,
        misplaced: 2,
        incorrect: 1,
        unused: 0,
    };

    const currentState = Object.keys(colorPriority).find((className) =>
        keyElement.classList.contains(className)
    ) || "unused";

    if (colorPriority[state] > colorPriority[currentState]) {
        Object.keys(colorPriority).forEach((className) =>
            keyElement.classList.remove(className)
        );
        keyElement.classList.add(state);
    }
}

export function disableKeyboard() {
    document.querySelectorAll(".key").forEach((key) => {
        key.classList.add("disabled");
    });
}

export function enableKeyboard() {
    document.querySelectorAll(".key").forEach((key) => {
        key.classList.remove("disabled");
    });
}
