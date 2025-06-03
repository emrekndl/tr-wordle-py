/**
 * Oyun durumunu localStorage'a kaydeder
 * @param {number} currentRow Aktif satır numarası
 * @param {number} currentSquareIndex Aktif karedeki index
 * @param {NodeList} rows Tüm satırlar
 * @param {Set} usedGuesses Kullanılmış tahminler
 * @param {boolean} isComplete Oyun bitti mi?
 * @param {Object} modalData Modal içeriği (opsiyonel)
 */
export function saveGameState(currentRow, currentSquareIndex, rows, usedGuesses, isComplete = false, modalData = null) {
    const allowedClasses = ["square", "flip", "correct", "misplaced", "incorrect"];
    const colorClasses = ["correct", "misplaced", "incorrect"];
    if (!rows) {
        console.error("rows elements not found");
        rows = document.querySelectorAll(".grid .row");
        if (!rows || rows.length === 0) {
            console.error("Could not find grid rows");
            return;
        }
    }

    const rowsData = Array.from(rows).map((row) => {
        return Array.from(row.querySelectorAll(".square")).map((sq) => {
            const colorClass = colorClasses.find((cls) =>
                sq.classList.contains(cls)
            );
            return {
                letter: sq.textContent || "",
                classes: colorClass ? ["square", "flip", colorClass] : ["square"],
            };
        });
    });

    const keyboardData = Array.from(document.querySelectorAll(".key")).map(
        (btn) => {
            const colorClass = colorClasses.find((cls) =>
                btn.classList.contains(cls)
            );
            const isWide = btn.classList.contains("wide");
            return {
                key: btn.textContent.trim(),
                classes: [
                    "key",
                    ...(isWide ? ["wide"] : []),
                    ...(colorClass ? [colorClass] : []),
                ],
            };
        }
    );

    let previousState = null;
    try {
        previousState = JSON.parse(localStorage.getItem("wordleGameState"));
    } catch (e) {}

    let modalState;
    if (modalData) {
        modalState = modalData;
    } else if (previousState && previousState.modalState) {
        modalState = previousState.modalState;
    } else {
        const modal = document.getElementById("completeModal");
        modalState = {
            title: modal.querySelector("h2").textContent,
            word: modal.querySelector(".modal-word").textContent,
            definitions: Array.from(
                modal.querySelectorAll(".definition-list li")
            ).map((li) => li.textContent),
            attemptCount: modal.querySelector(".attempt-count").textContent,
            isComplete: isComplete,
        };
    }

    const gameState = {
        currentRow,
        currentSquareIndex,
        rowsData,
        keyboardData,
        isComplete,
        modalState,
        puzzleId: new Date().toDateString(),
        updatedAt: new Date().toISOString(),
        date: new Date().toDateString(),
    };

    try {
        localStorage.setItem("wordleGameState", JSON.stringify(gameState));
    } catch (e) {
        console.error("Error saving game state:", e);
    }

    if (!isComplete && currentSquareIndex === 5) {
        const squares = rows[currentRow].querySelectorAll(".square");
        const currentGuess = Array.from(squares).map(sq => sq.textContent).join("");
        if (currentGuess) {
            usedGuesses.add(currentGuess);
        }
    }
    return gameState;
}

/**
 * localStorage'dan oyun durumunu yükler
 * @param {NodeList} rows Tüm satırlar
 * @param {Set} usedGuesses Kullanılmış tahminler
 * @param {Object} options Yükleme seçenekleri
 * @param {Function} options.onGameComplete Oyun bittiğinde çağrılacak fonksiyon
 * @param {Function} options.enableKeyboard Klavyeyi aktif etme fonksiyonu
 * @returns {Object|null} Kaydedilmiş oyun durumu
 */
export function loadGameState(rows, usedGuesses, {onGameComplete, enableKeyboard}) {
    const savedState = localStorage.getItem("wordleGameState");
    if (!savedState) return null;

    const gameState = JSON.parse(savedState);
    const savedDate = new Date(gameState.updatedAt).toDateString();
    const currentDate = new Date().toDateString();

    if (savedDate !== currentDate) {
        localStorage.removeItem("wordleGameState");
        return null;
    }

    document.querySelectorAll(".square").forEach((square) => {
        square.textContent = "";
        square.className = "square";
    });
    document.querySelectorAll(".key").forEach((key) => {
        key.className = key.classList.contains("wide") ? "key wide" : "key";
    });

    usedGuesses.clear();
    gameState.rowsData.forEach((rowCells, rowIndex) => {
        if (rowIndex < gameState.currentRow) {
            let guess = "";
            rowCells.forEach((cell) => {
                guess += cell.letter;
            });
            if (guess) {
                usedGuesses.add(guess);
            }
        }
    });

    gameState.rowsData.forEach((rowCells, rowIndex) => {
        if (rowIndex <= gameState.currentRow) {
            rowCells.forEach((cell, cellIndex) => {
                const square = rows[rowIndex].querySelectorAll(".square")[cellIndex];
                if (!square) {
                    console.error("Square not found:", rowIndex, cellIndex);
                    return;
                }

                square.textContent = cell.letter;

                const colorClass = cell.classes.find((cls) =>
                    ["correct", "misplaced", "incorrect"].includes(cls)
                );

                if (colorClass) {
                    requestAnimationFrame(() => {
                        square.classList.add("flip");
                        square.classList.add(colorClass);
                    });
                }
            });
        }
    });

    if (gameState.keyboardData) {
        gameState.keyboardData.forEach((keyObj) => {
            const btn = Array.from(document.querySelectorAll(".key")).find(
                (key) => key.textContent.trim() === keyObj.key
            );
            if (btn) {
                const colorClass = keyObj.classes.find((cls) =>
                    ["correct", "misplaced", "incorrect"].includes(cls)
                );
                if (colorClass) {
                    btn.classList.add(colorClass);
                }
                if (keyObj.classes.includes("wide")) {
                    btn.classList.add("wide");
                }
            }
        });
    }

    if (!gameState.isComplete && gameState.currentRow < gameState.rowsData.length) {
        const lastRow = gameState.rowsData[gameState.currentRow];
        lastRow.forEach((cell, cellIndex) => {
            const square = rows[gameState.currentRow].querySelectorAll(".square")[cellIndex];
            ["correct", "misplaced", "incorrect", "flip"].forEach((cls) => {
                if (cell.classes && cell.classes.includes(cls)) {
                    square.classList.add(cls);
                }
            });
        });
    }

    if (gameState.isComplete && gameState.currentRow <= gameState.rowsData.length - 1) {
        const lastRow = gameState.rowsData[gameState.currentRow];
        let allFilled = lastRow.every((cell) => cell.letter && cell.letter !== "");

        if (allFilled) {
            lastRow.forEach((cell, cellIndex) => {
                const square = rows[gameState.currentRow].querySelectorAll(".square")[cellIndex];
                if (!square.classList.contains("correct") &&
                    !square.classList.contains("misplaced") &&
                    !square.classList.contains("incorrect")) {
                    square.classList.add("flip");
                    square.classList.add("correct");
                }
            });
        }
    }

    if (gameState.isComplete && gameState.modalState) {
        onGameComplete(gameState.modalState);
    } else {
        enableKeyboard();
    }

    return gameState;
}
