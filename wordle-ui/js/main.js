import {
    initializeBloomFilter,
    checkWordInBloomFilter,
} from "./initialize_bloom.js";
import { checkGuess, fetchWordOfTheDay } from "./api.js";
import { animateRow, createConfetti } from "./animation.js";
import { disableKeyboard, enableKeyboard, updateKeyboardColor } from "./keyboard.js";
import { 
    toastWarning, 
    showCompleteModal, 
    closeModal,
    copyToClipboard 
} from "./ui-utils.js";
import { saveGameState, loadGameState } from "./game-state.js";

// Global state
let currentRow = 0;
let currentSquareIndex = 0;
const maxRows = 6;
const maxSquares = 5;
const usedGuesses = new Set();
let rows;

function toLocaleLowerCase(str) {
    return str.toLocaleLowerCase("tr-TR");
}

document.addEventListener("DOMContentLoaded", async function () {
    rows = document.querySelectorAll(".grid .row");
    const keyButtons = document.querySelectorAll(".key");

    await initializeBloomFilter();
    fetchWordOfTheDay();
    
    const savedState = loadGameState(rows, usedGuesses, {
        onGameComplete: (modalState) => showCompleteModal({}, modalState),
        enableKeyboard
    });

    if (savedState) {
        currentRow = savedState.currentRow;
        currentSquareIndex = savedState.currentSquareIndex;
    }

    keyButtons.forEach((keyButton) => {
        keyButton.addEventListener("mousedown", async function (e) {
            e.preventDefault();
            const key = this.textContent.trim();
            if (keyButton.classList.contains("disabled")) return;

            if (key === "Enter") {
                handleEnterKey();
            } else if (key === "⌫") {
                handleBackspaceKey();
            } else {
                handleLetterKey(key);
            }
        });
    });

    async function handleEnterKey() {
        if (currentSquareIndex === maxSquares) {
            const guess = Array.from(rows[currentRow].querySelectorAll(".square"))
                .map(square => square.textContent)
                .join("");

            if (usedGuesses.has(guess)) {
                toastWarning("Bir kelimeyi iki kez sayamayız!");
                clearCurrentRow();
                return;
            }

            const lowercaseGuess = toLocaleLowerCase(guess);
            try {
                const isValidWord = await checkWordInBloomFilter(lowercaseGuess);
                if (!isValidWord) {
                    handleInvalidWord();
                    return;
                }
            } catch (error) {
                console.error("Bloom filter kontrolünde hata:", error);
                return;
            }

            usedGuesses.add(guess);
            const response = await checkGuess(guess, toLocaleLowerCase);
            if (!response) {
                toastWarning("Cevap alınamadı!");
                return;
            }

            handleGuessResponse(response, toLocaleLowerCase);
        } else {
            handleIncompleteWord();
        }
    }

    function handleBackspaceKey() {
        if (currentSquareIndex > 0) {
            currentSquareIndex--;
            const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
            currentSquare.textContent = "";
        }
    }

    function handleLetterKey(key) {
        if (currentSquareIndex < maxSquares) {
            const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
            currentSquare.textContent = key;
            currentSquare.classList.add("pop");
            setTimeout(() => currentSquare.classList.remove("pop"), 200);
            currentSquareIndex++;
        }
    }

    function clearCurrentRow() {
        const squares = rows[currentRow].querySelectorAll(".square");
        squares.forEach((square) => {
            square.textContent = "";
            square.classList.remove("flip", "correct", "misplaced", "incorrect");
        });
        currentSquareIndex = 0;
    }

    function handleInvalidWord() {
        const invalidMessages = [
            "Hmm... Bu kelimeyi tanımıyoruz ama kulağa hoş geliyor! 😄",
            "Bu kelime listemize girmemiş. Başka bir kelimeyle şansını dene!",
            "Kelimeni bulamadık ama belki bir dahaki güncellemede ekleriz 😉",
            "Sözlüğümüzde yokmuş bu. Yeni bir kelime denemeye ne dersin?",
            "Yaratıcılığına sağlık, ama bu kelime kabul edilmiyor 😅",
            "Bu kelime galiba uzaydan geldi 🚀 Bizim listede yok!",
            "Sözlük şöyle bir baktı ama 'hmm, bu neydi?' dedi 😄",
            "Sözlük bu kelimeyi görmemiş bile! Tekrar dene! 📚",
            "Kelime listesinde yok!",
        ];
        const randomMessage = invalidMessages[Math.floor(Math.random() * invalidMessages.length)];
        toastWarning(randomMessage);
    }

    function handleIncompleteWord() {
        const incompleteMessages = [
            "Kelimeyi yarım bırakmışsın gibi! 🤔",
            "Biraz daha harf eklemeye ne dersin? ✍️",
            "Kelime tam değil sanki! Devam et... 🎯",
            "Harf harf gidiyoruz, biraz daha var! 🚶",
            "Az kaldı, birkaç harf daha ekle! 🎲",
            "Kelime biraz kısa kalmış gibi! 📏",
            "Hmmm... Sanki eksik bir şeyler var! 🤓",
            "Biraz daha düşün, kelime tam değil! 🧩",
            "Acele yok, kelimeyi tamamla! ⏳",
            "Kelimenin devamı gelecek mi? 🎭",
            "Birkaç harf eksik gibi sanki! 🧐",
        ];
        const randomMessage = incompleteMessages[Math.floor(Math.random() * incompleteMessages.length)];
        toastWarning(randomMessage);
    }

    function handleGuessResponse(response, toLocaleLowerCaseFn) {
        let isCorrectGuess = false;
        if (response.correct_letters) {
            const correctLetters = Object.values(response.correct_letters);
            isCorrectGuess = correctLetters.length === maxSquares;
        }

        animateRow(rows[currentRow], response, function(letter, colorClass, isLastLetter) {
            if (letter && colorClass) {
                updateKeyboardColor(letter, colorClass);
            }
            
            if (isLastLetter) {
                const isLastRow = currentRow >= maxRows - 1;

                if (!isCorrectGuess && !isLastRow) {
                    currentRow++;
                    currentSquareIndex = 0;
                    saveGameState(currentRow, currentSquareIndex, rows, usedGuesses, false);
                } else {
                    const modalData = {
                        title: isCorrectGuess ? "Tebrikler 🎉" : "Oyun Bitti",
                        word: Object.keys(response.word_definition || response)[0],
                        definitions: response.word_definition
                            ? response.word_definition[Object.keys(response.word_definition)[0]]
                            : response[Object.keys(response)[0]],
                        attemptCount: `${currentRow + 1}/${maxRows}`,
                        isComplete: isCorrectGuess,
                    };

                    saveGameState(currentRow, currentSquareIndex, rows, usedGuesses, true, modalData);
                    if (isCorrectGuess) {
                        // Show confetti immediately after flip animation
                        createConfetti();
                        // Show modal with a slight delay after confetti
                        setTimeout(() => {
                            showCompleteModal(response);
                        }, 800);
                    } else {
                        // If game is lost, just show the modal
                        setTimeout(() => {
                            showCompleteModal(response);
                        }, 500);
                    }
                    disableKeyboard();
                }
            }
        }, toLocaleLowerCase);
    }

    document.getElementById("closeModal").addEventListener("click", closeModal);

    document.getElementById("shareButton").addEventListener("click", function () {
        let shareText = `Hekat ${new Date().toLocaleDateString()} ${currentRow + 1}/${maxRows}\n\n`;
        for (let r = 0; r <= currentRow; r++) {
            const squares = rows[r].querySelectorAll(".square");
            let rowEmoji = "";
            squares.forEach((sq) => {
                if (sq.classList.contains("correct")) rowEmoji += "🟩";
                else if (sq.classList.contains("misplaced")) rowEmoji += "🟨";
                else rowEmoji += "⬛";
            });
            shareText += rowEmoji + "\n";
        }
        shareText += `\n${window.location.origin}/wordle/\n`;
        copyToClipboard(shareText);
        toastWarning("Oyun panoya kopyalandı. ✓");
    });
});

