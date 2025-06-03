import {
  initializeBloomFilter,
  checkWordInBloomFilter,
} from "./initialize_bloom.js";

// Global değişkenler
let currentRow = 0;
let currentSquareIndex = 0;
const maxRows = 6;
const maxSquares = 5;
const usedGuesses = new Set(); // Kullanılan tahminleri takip etmek için
let rows; // Grid satırları için global değişken

function toLocaleLowerCase(str) {
  return str.toLocaleLowerCase("tr-TR");
}

function toastWarning(message) {
    Toastify({
        text: `${message}`,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        olderFirst: false,
        offset: {
            x: '3em', // horizontal axis - can be a number or a string indicating unity. eg: '2em'
            y: '4em' // vertical axis - can be a number or a string indicating unity. eg: '2em'
        },
        style: {
            background: "linear-gradient(to right, #00b09b,rgb(221, 184, 20))",
        },
        avatar: "https://cdn-icons-png.flaticon.com/128/4534/4534727.png",
        // avatar: "https://cdn-icons-png.flaticon.com/128/3898/3898117.png",
    }).showToast();
}

// const API_BASE = "http://localhost:8000/api/wordle";
const API_BASE = `${window.location.origin}/api/wordle`;

document.addEventListener("DOMContentLoaded", async function () {
  rows = document.querySelectorAll(".grid .row"); // Global rows değişkenini initialize et
  const keyButtons = document.querySelectorAll(".key");

  // Bloom Filter'ı yükle
  await initializeBloomFilter();

  fetchWordOfTheDay();
  loadGameState();

  keyButtons.forEach((keyButton) => {
    keyButton.addEventListener("mousedown", async function (e) {
      e.preventDefault(); // Browserin default buton davranışını engelle
      const key = this.textContent.trim();
      // Eğer klavye disable ise hiçbir tuş işlenmesin
      if (keyButton.classList.contains("disabled")) return;

      if (key === "Enter") {
        if (currentSquareIndex === maxSquares) {
          const guess = getCurrentGuess();
          // Daha önce kullanılan tahmini kontrol et
          if (usedGuesses.has(guess)) {
            toastWarning("Bir kelimeyi iki kez sayamayız!");
            // Geçersiz kelimeyi gridten sil ve squares'i sıfırla
            const squares = rows[currentRow].querySelectorAll(".square");
            squares.forEach((square) => {
              square.textContent = "";
              square.classList.remove(
                "flip",
                "correct",
                "misplaced",
                "incorrect"
              );
            });
            currentSquareIndex = 0;
            return;
          }
          // Önce Bloom Filter ile kelimeyi kontrol et
          const lowercaseGuess = toLocaleLowerCase(guess);
          try {
            const isValidWord = await checkWordInBloomFilter(lowercaseGuess);
            if (!isValidWord) {
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
              const randomIndex = Math.floor(Math.random() * invalidMessages.length);
              toastWarning(invalidMessages[randomIndex]);
              return;
            }
          } catch (error) {
            console.error("Bloom filter kontrolünde hata:", error);
          }

          // Tahmin geçerli, usedGuesses'e ekle
          usedGuesses.add(guess);
          checkGuess(guess).then((response) => {
            if (!response) {
              console.log("No response from API!")
              toastWarning("Cevap alınamadı!");
              return;
            }

            // Animasyonları başlat
            animateRow(currentRow, response, function () {

              // Doğru tahmin kontrolü
              let isCorrectGuess = false;
              if (response.correct_letters) {
                const correctLetters = Object.values(response.correct_letters);
                isCorrectGuess = correctLetters.length === maxSquares;
              }

              // Son satır kontrolü
              const isLastRow = currentRow >= maxRows - 1;

              if (!isCorrectGuess && !isLastRow) {
                currentRow++;
                currentSquareIndex = 0;
                // Normal tahmin - state'i kaydet
                saveGameState(false);
              } else {
                // Oyun bitti (ya doğru tahmin ya da son satır)
                const modalData = {
                  title: isCorrectGuess ? "Tebrikler 🎉" : "Oyun Bitti",
                  word: Object.keys(response.word_definition || response)[0],
                  definitions: response.word_definition
                    ? response.word_definition[
                        Object.keys(response.word_definition)[0]
                      ]
                    : response[Object.keys(response)[0]],
                  attemptCount: `${currentRow + 1}/${maxRows}`,
                  isComplete: isCorrectGuess,
                };

                // State'i kaydet ve modalı göster
                saveGameState(true, modalData);
                setTimeout(() => showCompleteModal(response), 2000);
                if (isCorrectGuess) {
                  createConfetti();
                }
                disableKeyboard();
              }
            });
          });
        } else {
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
          const randomIndex = Math.floor(Math.random() * incompleteMessages.length);
          toastWarning(incompleteMessages[randomIndex]);
        }
      } else if (key === "⌫") {
        if (currentSquareIndex > 0) {
          currentSquareIndex--;
          const currentSquare =
            rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
          currentSquare.textContent = "";
        }
      } else {
        if (currentSquareIndex < maxSquares) {
          const currentSquare =
            rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
          currentSquare.textContent = key;
          currentSquare.classList.add("pop");
          setTimeout(() => {
            currentSquare.classList.remove("pop");
          }, 200);
          currentSquareIndex++;
        }
      }
    });
  });

  function showCompleteModal(response = {}, savedModalState = null) {
    const modal = document.getElementById("completeModal");
    modal.style.display = "block";
    const wordContainer = modal.querySelector(".modal-word");
    const definitionList = modal.querySelector(".definition-list");
    const modalTitle = modal.querySelector("h2");
    const attemptCount = modal.querySelector(".attempt-count");

    // önceki tanımları temizle
    wordContainer.textContent = "";
    definitionList.innerHTML = "";

    let modalData = null;

    if (savedModalState) {
      // Kaydedilmiş modal verilerini kullan
      modalTitle.textContent = savedModalState.title;
      wordContainer.textContent = savedModalState.word;
      savedModalState.definitions.forEach((def) => {
        const li = document.createElement("li");
        li.textContent = def;
        definitionList.appendChild(li);
      });
      attemptCount.textContent = savedModalState.attemptCount;
      attemptCount.style.color = savedModalState.isComplete
        ? "#6aaa64"
        : "#dc3545";
    } else {
      // Yeni oyun - API yanıtını kullan
      attemptCount.textContent = `${currentRow + 1}/${maxRows}`;

      // Renklendirme için doğru/yanlış kontrolü
      let isCorrectGuess = false;
      if (response.correct_letters) {
        const correctLetters = Object.values(response.correct_letters);
        isCorrectGuess = correctLetters.length === maxSquares;
      }

      attemptCount.style.color = isCorrectGuess ? "#6aaa64" : "#dc3545";

      if (isCorrectGuess) {
        // Her seviye için birden fazla mesaj
        // O seviye için rastgele bir mesaj seç
        const levelMessages = {
          1: [
            "🎯 Vay be! İlk denemede...",
            "🧠 Bu nasıl bir sezgi böyle?",
            "🔮 Resmen telepati bu!"
          ],
          2: [
            "⚡️ Beyin fırtınası yaptın resmen!",
            "💫 2'de buldun, müthiş gidiyor!",
            "🚀 Hem hızlı hem doğru!"
          ],
          3: [
            "👁️ Üçüncü göz devrede!",
            "💪 Ortalama üstü performans...",
            "🎯 3 olsun bizim olsun!"
          ],
          4: [
            "🌅 Yavaş yavaş açılıyorsun!",
            "🧘 Stres yapmadan, sakin sakin...",
            "💫 İyi gidiyorsun böyle devam!"
          ],
          5: [
            "🏃 Son vagondan atlayan şampiyon!",
            "🚂 Az kalsın kaçırıyordun treni!",
            "😅 Stresli ama tatlı bir galibiyet!"
          ],
          6: [
            "😰 Şansa bak be, az kalsın!",
            "🎲 Son şans kuponu tuttu!",
            "🎭 Foto finişle kazandın!"
          ]
        };
        const messages = levelMessages[currentRow + 1];
        const randomIndex = Math.floor(Math.random() * messages.length);
        modalTitle.textContent = "Tebrikler  🎉 " + messages[randomIndex];
      } else {
        // Bilememe durumu için farklı mesajlar
        const failMessages = [
          "💪 E hadi be! Yarın mutlaka...",
          "🌅 Olmadı bu sefer, dert etme!",
          "🔄 Sen yarın bir daha gel...",
          "🎯 Çok yaklaştın aslında!"
        ];
        const randomIndex = Math.floor(Math.random() * failMessages.length);
        modalTitle.textContent = "Oyun Bitti " + failMessages[randomIndex];
      }

      // Kelime ve tanım bilgisi iki farklı formatta gelebilir
      let word, definitions;
      if (response.word_definition) {
        word = Object.keys(response.word_definition)[0];
        definitions = response.word_definition[word];
      } else if (Object.keys(response).length > 0) {
        word = Object.keys(response)[0];
        definitions = response[word];
      }

      if (word && definitions) {
        wordContainer.textContent = word;
        definitions.forEach((def) => {
          const li = document.createElement("li");
          li.textContent = def;
          definitionList.appendChild(li);
        });
      }
    }
  }

  function closeModal() {
    document.getElementById("completeModal").style.display = "none";
  }

  function disableKeyboard() {
    document.querySelectorAll(".key").forEach((key) => {
      key.classList.add("disabled");
    });
  }

  function enableKeyboard() {
    document.querySelectorAll(".key").forEach((key) => {
      key.classList.remove("disabled");
    });
  }

  function getCurrentGuess() {
    let guess = "";
    const squares = rows[currentRow].querySelectorAll(".square");
    squares.forEach((square) => {
      guess += square.textContent;
    });
    return guess;
  }

  async function checkGuess(guessWord) {
    try {
      const response = await fetch(`${API_BASE}/check`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guess_word: toLocaleLowerCase(guessWord) }),
      });
      if (!response.ok) {
        throw new Error("API hatası: " + response.statusText);
      }
      return await response.json();
    } catch (error) {
      console.error("Tahmin gönderilirken hata oluştu:", error);
      return null;
    }
  }

  function animateRow(rowIndex, result, callback) {
    const row = rows[rowIndex];
    const squares = row.querySelectorAll(".square");

    // API'den gelen yanıtı düzenle
    const correctMap = {};
    if (result.correct_letters) {
      Object.entries(result.correct_letters).forEach(([k, v]) => {
        correctMap[parseInt(k)] = v;
      });
    }

    const misplacedLetters = Array.isArray(
      result.correct_letters_in_not_correct_position
    )
      ? [...result.correct_letters_in_not_correct_position]
      : [];

    const incorrectLetters = Array.isArray(result.incorrect_letters)
      ? result.incorrect_letters
      : [];

    // Tüm harflerin doğru olup olmadığını kontrol et
    let allCorrect = true;
    squares.forEach((square, index) => {
      const letter = toLocaleLowerCase(square.textContent);
      if (!correctMap.hasOwnProperty(index) || correctMap[index] !== letter) {
        allCorrect = false;
      }
    });

    squares.forEach((square, index) => {
      setTimeout(() => {
        // Önce flip animasyonunu başlat
        square.classList.add("flip");

        const letter = square.textContent;
        const letterLower = toLocaleLowerCase(letter);

        let colorClass = "incorrect";
        // Tüm kelime doğruysa veya doğru pozisyondaki harf ise
        if (
          allCorrect ||
          (correctMap.hasOwnProperty(index) &&
            correctMap[index] === letterLower)
        ) {
          colorClass = "correct";
        }
        // Yanlış pozisyondaki harfler için kontrol
        else if (
          misplacedLetters
            .map((l) => toLocaleLowerCase(l))
            .includes(letterLower)
        ) {
          colorClass = "misplaced";
        }

        // Renk sınıfını ekle ve klavyeyi güncelle
        setTimeout(() => {
          square.classList.add(colorClass);
          updateKeyboardColor(letter, colorClass);
        }, 250); // Flip animasyonunun ortasında rengi değiştir

        // Callback'i son karede çalıştır
        if (index === squares.length - 1 && typeof callback === "function") {
          setTimeout(callback, 350);
        }
      }, index * 300);
    });
  }

  function fetchWordOfTheDay() {
    fetch(`${API_BASE}/wordoftheday`, {
      method: "GET",
      credentials: "include",
    });
    // .then(response => response.json())
    // .then(data => {
    //   console.log(data);
    // })
    // .catch(err => console.error("Günün kelimesi alınamadı:", err));
  }

  function updateKeyboardColor(letter, state) {
    // Klavyedeki tuşu textContent ile bul
    const upperLetter = letter.toUpperCase();
    const keyElement = Array.from(document.querySelectorAll(".key")).find(
      (key) => key.textContent.trim() === upperLetter
    );

    if (!keyElement) {
      console.log("Key element not found for:", upperLetter);
      return;
    }

    const colorPriority = {
      correct: 3,
      misplaced: 2,
      incorrect: 1,
      unused: 0,
    };

    const currentState =
      Object.keys(colorPriority).find((className) =>
        keyElement.classList.contains(className)
      ) || "unused";

    // Sadece daha yüksek öncelikli durum varsa güncelle
    if (colorPriority[state] > colorPriority[currentState]) {
      // Önceki renk sınıflarını kaldır
      Object.keys(colorPriority).forEach((className) =>
        keyElement.classList.remove(className)
      );
      keyElement.classList.add(state);
    }
  }

  function saveGameState(isComplete = false, modalData = null) {
    console.log("Saving game state...", {
      currentRow,
      currentSquareIndex,
      isComplete,
    });

    // Tüm grid ve klavye state'ini tek seferde kaydet
    const allowedClasses = [
      "square",
      "flip",
      "correct",
      "misplaced",
      "incorrect",
    ];
    const colorClasses = ["correct", "misplaced", "incorrect"];
    if (!rows) {
      console.error("rows elements not found");
      rows = document.querySelectorAll(".grid .row");
      if (!rows || rows.length === 0) {
        console.error("Could not find grid rows");
        return;
      }
    }

    // Grid verilerini kaydet
    const rowsData = Array.from(rows).map((row) => {
      return Array.from(row.querySelectorAll(".square")).map((sq) => {
        // Sadece renk sınıflarını kaydet
        const colorClass = colorClasses.find((cls) =>
          sq.classList.contains(cls)
        );
        return {
          letter: sq.textContent || "",
          classes: colorClass ? ["square", "flip", colorClass] : ["square"],
        };
      });
    });

    // Klavye verilerini kaydet
    const keyboardData = Array.from(document.querySelectorAll(".key")).map(
      (btn) => {
        // Sadece renk sınıfını kaydet
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

    // Önceki state'i kontrol et
    let previousState = null;
    try {
      previousState = JSON.parse(localStorage.getItem("wordleGameState"));
    } catch (e) {
      console.log("No previous state found");
    }

    // Modal verilerini oluştur
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
      console.log("Game state saved successfully", gameState);
    } catch (e) {
      console.error("Error saving game state:", e);
    }

    // Her tahmin sonrası state'i kaydet
    if (!isComplete) {
      const currentGuess = getCurrentGuess();
      if (currentGuess) {
        usedGuesses.add(currentGuess);
      }
    }
  }

  function loadGameState() {
    const savedState = localStorage.getItem("wordleGameState");
    if (savedState) {
      const gameState = JSON.parse(savedState);
      console.log("Loading game state:", gameState);

      // Sadece aynı gün için state'i yükle
      const savedDate = new Date(gameState.updatedAt).toDateString();
      const currentDate = new Date().toDateString();

      if (savedDate === currentDate) {
        // Önce tüm grid ve klavyeyi temizle
        document.querySelectorAll(".square").forEach((square) => {
          square.textContent = "";
          square.className = "square";
        });
        document.querySelectorAll(".key").forEach((key) => {
          key.className = key.classList.contains("wide") ? "key wide" : "key";
        });

        currentRow = gameState.currentRow;
        currentSquareIndex = gameState.currentSquareIndex;

        // Clear and rebuild usedGuesses from existing rows
        usedGuesses.clear();
        gameState.rowsData.forEach((rowCells, rowIndex) => {
          if (rowIndex < currentRow) {
            let guess = "";
            rowCells.forEach((cell) => {
              guess += cell.letter;
            });
            if (guess) {
              usedGuesses.add(guess);
            }
          }
        });

        // Grid'i yükle ve renkleri uygula
        gameState.rowsData.forEach((rowCells, rowIndex) => {
          if (rowIndex <= gameState.currentRow) {
            // Sadece doldurulmuş satırları yükle
            rowCells.forEach((cell, cellIndex) => {
              const square =
                rows[rowIndex].querySelectorAll(".square")[cellIndex];
              if (!square) {
                console.error("Square not found:", rowIndex, cellIndex);
                return;
              }

              // İçerik ve sınıfları ayarla
              square.textContent = cell.letter;

              // Renk sınıfını ayarla
              const colorClass = cell.classes.find((cls) =>
                ["correct", "misplaced", "incorrect"].includes(cls)
              );

              // Renk sınıfı varsa hemen uygula (animasyonsuz)
              if (colorClass) {
                requestAnimationFrame(() => {
                  square.classList.add("flip");
                  square.classList.add(colorClass);
                });
              }
            });
          }
        });
        // Klavye durumunu geri yükle
        if (gameState.keyboardData) {
          gameState.keyboardData.forEach((keyObj) => {
            const btn = Array.from(document.querySelectorAll(".key")).find(
              (key) => key.textContent.trim() === keyObj.key
            );
            if (btn) {
              // Özel renk sınıfını bul ve uygula
              const colorClass = keyObj.classes.find((cls) =>
                ["correct", "misplaced", "incorrect"].includes(cls)
              );
              if (colorClass) {
                btn.classList.add(colorClass);
              }
              // Wide sınıfını koru
              if (keyObj.classes.includes("wide")) {
                btn.classList.add("wide");
              }
            }
          });
        }
        // --- Oyun tamamlanmamışsa, son oynanan satırda renkli class'lar varsa onları da uygula ---
        if (
          !gameState.isComplete &&
          gameState.currentRow < gameState.rowsData.length
        ) {
          const lastRow = gameState.rowsData[gameState.currentRow];
          lastRow.forEach((cell, cellIndex) => {
            const square =
              rows[gameState.currentRow].querySelectorAll(".square")[cellIndex];
            // Eğer cell.classes içinde renklendirme class'ı varsa uygula
            ["correct", "misplaced", "incorrect", "flip"].forEach((cls) => {
              if (cell.classes && cell.classes.includes(cls)) {
                square.classList.add(cls);
              }
            });
          });
        }
        // Son satırı renklendir (özellikle 6. denemede kelime doğru tahmin edildiğinde)
        if (
          gameState.isComplete &&
          gameState.currentRow <= gameState.rowsData.length - 1
        ) {
          const lastRow = gameState.rowsData[gameState.currentRow];
          let allFilled = lastRow.every(
            (cell) => cell.letter && cell.letter !== ""
          );

          // Son satır dolu ve oyun tamamlanmışsa, tüm harfleri yeşil yap
          if (allFilled) {
            // Renklendirme class'larını kontrol et ve gerekirse uygula
            lastRow.forEach((cell, cellIndex) => {
              const square =
                rows[gameState.currentRow].querySelectorAll(".square")[
                  cellIndex
                ];
              if (
                !square.classList.contains("correct") &&
                !square.classList.contains("misplaced") &&
                !square.classList.contains("incorrect")
              ) {
                square.classList.add("flip");
                square.classList.add("correct");
              }
            });
          }
        }
        // Oyun durumunu kontrol et
        if (gameState.isComplete && gameState.modalState) {
          showCompleteModal({}, gameState.modalState);
          disableKeyboard();
        } else {
          enableKeyboard();
        }
      } else {
        // Farklı gün veya state yok, temizle
        localStorage.removeItem("wordleGameState");
        currentRow = 0;
        currentSquareIndex = 0;
        usedGuesses.clear();
        enableKeyboard();
      }
    }
  }

  document.getElementById("closeModal").addEventListener("click", function () {
    closeModal();
  });

  document.getElementById("shareButton").addEventListener("click", function () {
    let shareText = `Hekat ${new Date().toLocaleDateString()} ${
      currentRow + 1
    }/${maxRows}\n\n`;
    for (let r = 0; r <= currentRow; r++) {
      const squares = rows[r].querySelectorAll(".square");
      let rowEmoji = "";
      squares.forEach((sq) => {
        if (sq.classList.contains("correct")) {
          rowEmoji += "🟩";
        } else if (sq.classList.contains("misplaced")) {
          rowEmoji += "🟨";
        } else {
          rowEmoji += "⬛";
        }
      });
      shareText += rowEmoji + "\n";
    }
    shareText += `\n${window.location.origin}/wordle/\n`;
    copyToClipboard(shareText);
    toastWarning("Oyun panoya kopyalandı. ✓");
  });

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log("Kopyalandı");
        })
        .catch((err) => {
          console.error("Kopyalama hatası:", err);
        });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        toastWarning("Oyun panoya kopyalandı. ✓");
      } catch (err) {
        toastWarning("Kopyalanamadı!");
      }
      document.body.removeChild(textarea);
    }
  }

  function createConfetti() {
    // Wordle renk paleti
    const colors = ["#538d4e", "#b59f3b", "#3a3a3c", "#d7dadc"];
    const confettiCount = 150; // Konfeti sayısı

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");

      // Rastgele renk seç
      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.backgroundColor = color;

      // Rastgele başlangıç pozisyonu (ekranın üst kısmı)
      const startX = Math.random() * window.innerWidth;
      confetti.style.left = `${startX}px`;
      confetti.style.top = "-10px";

      // Rastgele boyut
      const size = Math.random() * 8 + 4;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;

      // Animasyon süresi ve gecikmesi
      const duration = 3 + Math.random() * 5;
      const delay = Math.random() * 2;
      confetti.style.animation = `fall ${duration}s linear ${delay}s forwards`;

      // Rastgele dönüş açısı
      const rotation = Math.random() * 360;
      confetti.style.transform = `rotate(${rotation}deg)`;

      document.body.appendChild(confetti);

      // Animasyon bittikten sonra konfetiyi sil
      setTimeout(() => {
        confetti.remove();
      }, (duration + delay) * 1000);
    }
  }
});
