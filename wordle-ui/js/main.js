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
let currentRow = 0;          // Aktif satır
let currentSquareIndex = 0;  // Aktif satırdaki kare pozisyonu
const maxRows = 6;           // Maksimum tahmin hakkı
const maxSquares = 5;        // Kelime uzunluğu
const usedGuesses = new Set(); // Daha önce denenmiş tahminler
let rows;                    // Oyun ızgarasındaki tüm satırlar

/**
 * Türkçe karakterler için lowercase dönüşümü yapar
 * @param {string} str Dönüştürülecek string
 * @returns {string} Küçük harfe dönüştürülmüş string
 */
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

    /**
     * Enter tuşuna basıldığında çalışır
     * Tahmin kelimesini kontrol eder ve sonucu gösterir
     */
    async function handleEnterKey() {
        if (currentSquareIndex === maxSquares) {
            disableKeyboard(); // <-- Klavyeyi devre dışı bırak
            const guess = Array.from(rows[currentRow].querySelectorAll(".square"))
                .map(square => square.textContent)
                .join("");

            if (usedGuesses.has(guess)) {
                toastWarning("Bir kelimeyi iki kez sayamayız!");
                clearCurrentRow();
                enableKeyboard(); // <-- Hata durumunda tekrar etkinleştir
                return;
            }

            const lowercaseGuess = toLocaleLowerCase(guess);
            try {
                const isValidWord = await checkWordInBloomFilter(lowercaseGuess);
                if (!isValidWord) {
                    handleInvalidWord();
                    enableKeyboard(); // <-- Hata durumunda tekrar etkinleştir
                    return;
                }
            } catch (error) {
                console.error("Bloom filter kontrolünde hata:", error);
                enableKeyboard(); // <-- Hata durumunda tekrar etkinleştir
                return;
            }

            const response = await checkGuess(guess, toLocaleLowerCase);
            if (!response) {
                toastWarning("Cevap alınamadı!");
                enableKeyboard(); // <-- Hata durumunda tekrar etkinleştir
                return;
            }

            usedGuesses.add(guess);
            handleGuessResponse(response, true); // <-- 2. parametre ile kontrol
        } else {
            handleIncompleteWord();
        }
    }

    /**
     * Backspace tuşuna basıldığında çalışır
     * Son harfi siler
     */
    function handleBackspaceKey() {
        if (currentSquareIndex > 0) {
            currentSquareIndex--;
            const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
            currentSquare.textContent = "";
        }
    }

    /**
     * Harf tuşlarına basıldığında çalışır
     * Aktif kareye harfi ekler
     * @param {string} key Basılan tuş
     */
    function handleLetterKey(key) {
        if (currentSquareIndex < maxSquares) {
            const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
            currentSquare.textContent = key;
            currentSquare.classList.add("pop");
            setTimeout(() => currentSquare.classList.remove("pop"), 200);
            currentSquareIndex++;
        }
    }

    /**
     * Aktif satırı temizler
     * Tüm karelerdeki harfleri ve renkleri sıfırlar
     */
    function clearCurrentRow() {
        const squares = rows[currentRow].querySelectorAll(".square");
        squares.forEach((square) => {
            square.textContent = "";
            square.classList.remove("flip", "correct", "misplaced", "incorrect");
        });
        currentSquareIndex = 0;
    }

    /**
     * Geçersiz kelime girildiğinde rastgele bir uyarı mesajı gösterir
     */
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

    /**
     * Eksik kelime girildiğinde rastgele bir uyarı mesajı gösterir
     */
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

    /**
     * API'den gelen tahmin sonucunu işler
     * Animasyonları gösterir ve oyun durumunu günceller
     * @param {Object} response API yanıtı
     */
    function handleGuessResponse(response, shouldEnableKeyboard = false) {
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
                    if (shouldEnableKeyboard) enableKeyboard(); // <-- Sadece oyun bitmediyse tekrar aç
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
                    response.currentRow = currentRow + 1;
                    saveGameState(currentRow, currentSquareIndex, rows, usedGuesses, true, modalData);
                    if (isCorrectGuess) {
                        createConfetti();
                        setTimeout(() => {
                            showCompleteModal(response);
                        }, 800);
                    } else {
                        setTimeout(() => {
                            showCompleteModal(response);
                        }, 500);
                    }
                    // Oyun bittiğinde klavye zaten devre dışı kalacak
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

