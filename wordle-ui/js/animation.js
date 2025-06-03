/**
 * Kazanma durumunda konfeti efekti oluşturur
 * Rastgele renkli ve boyutlu konfetiler ekranın üstünden aşağı doğru düşer
 */
export function createConfetti() {
    const colors = ["#538d4e", "#b59f3b", "#3a3a3c", "#d7dadc"];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");

        const color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.backgroundColor = color;

        const startX = Math.random() * window.innerWidth;
        confetti.style.left = `${startX}px`;
        confetti.style.top = "-10px";

        const size = Math.random() * 8 + 4;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        const duration = 3 + Math.random() * 5;
        const delay = Math.random() * 2;
        confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;

        const rotation = Math.random() * 360;
        confetti.style.transform = `rotate(${rotation}deg)`;

        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, (duration + delay) * 1000);
    }
}

/**
 * Bir satırdaki kareleri sırayla çevirir ve doğru/yanlış/yanlış yerde renklerini gösterir
 * @param {HTMLElement} row Animasyon yapılacak satır elementi
 * @param {Object} result API'den gelen tahmin sonucu
 * @param {Function} callback Her harf için çağrılacak callback fonksiyonu
 * @param {Function} toLocaleLowerCase Türkçe karakterler için lowercase dönüşümü yapan fonksiyon
 */
export function animateRow(row, result, callback, toLocaleLowerCase) {
    const squares = row.querySelectorAll(".square");

    const correctMap = {};
    if (result.correct_letters) {
        Object.entries(result.correct_letters).forEach(([k, v]) => {
            correctMap[parseInt(k)] = v;
        });
    }

    const misplacedLetters = Array.isArray(result.correct_letters_in_not_correct_position)
        ? [...result.correct_letters_in_not_correct_position]
        : [];

    const incorrectLetters = Array.isArray(result.incorrect_letters)
        ? result.incorrect_letters
        : [];

    let allCorrect = true;
    squares.forEach((square, index) => {
        const letter = toLocaleLowerCase(square.textContent);
        if (!correctMap.hasOwnProperty(index) || correctMap[index] !== letter) {
            allCorrect = false;
        }
    });

    squares.forEach((square, index) => {
        setTimeout(() => {
            square.classList.add("flip");

            const letter = square.textContent;
            const letterLower = toLocaleLowerCase(letter);

            let colorClass = "incorrect";
            if (allCorrect || (correctMap.hasOwnProperty(index) && correctMap[index] === letterLower)) {
                colorClass = "correct";
            }
            else if (misplacedLetters.map(l => toLocaleLowerCase(l)).includes(letterLower)) {
                colorClass = "misplaced";
            }

            setTimeout(() => {
                square.classList.add(colorClass);
                if (typeof callback === "function") {
                    callback(letter, colorClass, index === squares.length - 1);
                }
            }, 250);
        }, index * 300);
    });
}
