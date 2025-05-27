// Global değişkenler (callback dışına alındı)
let currentRow = 0;
let currentSquareIndex = 0;
const maxRows = 6;
const maxSquares = 5;

// const API_BASE = "http://localhost:8000/api/wordle";
const API_BASE = `${window.location.origin}/api/wordle`;

document.addEventListener("DOMContentLoaded", function() {
  const rows = document.querySelectorAll(".grid .row");
  const keyButtons = document.querySelectorAll(".key");

  fetchWordOfTheDay();
  loadGameState();

  keyButtons.forEach(keyButton => {
    keyButton.addEventListener("mousedown", function(e) {
      e.preventDefault(); // Browserin default buton davranışını engelle
      const key = this.textContent.trim();
      // Eğer klavye disable ise hiçbir tuş işlenmesin
      if (keyButton.classList.contains('disabled')) return;
      
      if (key === "Enter") {
        if (currentSquareIndex === maxSquares) {
          const guess = getCurrentGuess();
          checkGuess(guess).then(response => {
            if (!response) {
              alert("API'den yanıt alınamadı.");
              return;
            }
            animateRow(currentRow, response, function() {
              // saveGameState(response.is_complete);
              // if (response.is_complete === true) {
              //   setTimeout(() => showCompleteModal(response), 2000);
              //   disableKeyboard();
              // } else if (currentRow < maxRows - 1) {
              //   currentRow++;
              //   currentSquareIndex = 0;
              // } else {
              //   alert("Oyununuz tamamlandı.");
              //   disableKeyboard();
              // }
              if (!response.is_complete && currentRow < maxRows - 1) {
              currentRow++;
              currentSquareIndex = 0;
            }

            // 2) Güncel row/index ile kaydetme
            saveGameState(response.is_complete);

            // 3) Oyun tamamlanma kontrolleri
            if (response.is_complete) {
              // TODO: word_definitioo will be in modal
              setTimeout(() => showCompleteModal(response), 2000);
              disableKeyboard();
            }
            });
          });
        } else {
          alert("Lütfen 5 harften oluşan bir kelime girin!");
        }
      } else if (key === "⌫") {
        if (currentSquareIndex > 0) {
          currentSquareIndex--;
          const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
          currentSquare.textContent = "";
        }
      } else {
        if (currentSquareIndex < maxSquares) {
          const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
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

  function showCompleteModal(response = {}) {
    const modal = document.getElementById("completeModal");
    modal.style.display = "block";
    const wordContainer = modal.querySelector(".modal-word");
    const definitionList = modal.querySelector(".definition-list");

    // önceki tanımları temizle
    wordContainer.textContent = "";
    definitionList.innerHTML = "";

    if (response.word_definition) {
      const word = Object.keys(response.word_definition)[0];
      const definitions = response.word_definition[word];

      wordContainer.textContent = word;

      // Her tanımı bir <li> olarak ekle
      definitions.forEach(def => {
        const li = document.createElement("li");
        li.textContent = def;
        definitionList.appendChild(li);
      });
    }
  }

  function closeModal() {
    document.getElementById("completeModal").style.display = "none";
  }

  function disableKeyboard() {
    document.querySelectorAll(".key").forEach(key => {
      key.classList.add('disabled');
    });
  }

  function enableKeyboard() {
    document.querySelectorAll(".key").forEach(key => {
      key.classList.remove('disabled');
    });
  }

  function getCurrentGuess() {
    let guess = "";
    const squares = rows[currentRow].querySelectorAll(".square");
    squares.forEach(square => {
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ guess_word: guessWord })
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
    // let misplacedLetters = [...result.correct_letters_in_not_correct_position];
    // const correctMap = result.correct_letters || {};                              // {} default
   // 1) correctMap: string-key → number-key
  const correctMap = {};
  if (result.correct_letters) {
    for (const [k, v] of Object.entries(result.correct_letters)) {
      correctMap[Number(k)] = v;
    }
  }
  const misplacedLetters = Array.isArray(result.correct_letters_in_not_correct_position)
    ? [...result.correct_letters_in_not_correct_position]
    : [];                                                                      // [] default
  const incorrectLetters = Array.isArray(result.incorrect_letters)
    ? result.incorrect_letters
    : [];                                                                      //
    // squares.forEach((square, index) => {
    //   setTimeout(() => {
    //     square.classList.add("flip");
    //     const letter = square.textContent;
    //     if (result.correct_letters.hasOwnProperty(index.toString()) && letter === result.correct_letters[index.toString()]) {
    //       square.classList.add("correct");
    //       updateKeyboardColor(letter, "correct");
    //     } else if (misplacedLetters.includes(letter)) {
    //       misplacedLetters.splice(misplacedLetters.indexOf(letter), 1);
    //       square.classList.add("misplaced");
    //       updateKeyboardColor(letter, "misplaced");
    //     } else if (result.incorrect_letters.includes(letter)) {
    //       square.classList.add("incorrect");
    //       updateKeyboardColor(letter, "incorrect");
    //     }
    //     // Son karedeysek ve callback varsa çağır
    //     if (index === squares.length - 1 && typeof callback === "function") {
    //       setTimeout(callback, 350); // animasyonun bitmesini bekle
    //     }
    //   }, index * 300);
    squares.forEach((square, index) => {
    setTimeout(() => {
      square.classList.add("flip");
      const letter = square.textContent;

      // 2) Doğru pozisyona bak
      if (correctMap.hasOwnProperty(index) && letter === correctMap[index]) {
        square.classList.add("correct");
        updateKeyboardColor(letter, "correct");

      // 3) Yanlış pozisyondaki harfler
      } else if (misplacedLetters.includes(letter)) {
        misplacedLetters.splice(misplacedLetters.indexOf(letter), 1);
        square.classList.add("misplaced");
        updateKeyboardColor(letter, "misplaced");

      // 4) Tamamen yanlış harfler
      } else if (incorrectLetters.includes(letter)) {
        square.classList.add("incorrect");
        updateKeyboardColor(letter, "incorrect");
      }

      // 5) Callback’i son karede çalıştır
      if (index === squares.length - 1 && typeof callback === "function") {
        setTimeout(callback, 350);
      }
    }, index * 300);
    });
  }

  function fetchWordOfTheDay() {
    fetch(`${API_BASE}/wordoftheday`, {
      method: "GET",
      credentials: "include"
    })
    // .then(response => response.json())
    // .then(data => {
    //   console.log(data);
    // })
    // .catch(err => console.error("Günün kelimesi alınamadı:", err));
  }

  function updateKeyboardColor(letter, statusClass) {
    const keyButton = Array.from(document.querySelectorAll(".key")).find(btn => btn.textContent.trim().toUpperCase() === letter.toUpperCase());
    if (keyButton) {
      keyButton.classList.remove("correct", "misplaced", "incorrect");
      keyButton.classList.add(statusClass);
    }
  }

  function saveGameState(isComplete = false) {
    const allowedClasses = ["square", "flip", "correct", "misplaced", "incorrect"];
    const rowsData = Array.from(rows).map(row => {
      return Array.from(row.querySelectorAll(".square")).map(sq => {
        return {
          letter: sq.textContent,
          classes: Array.from(sq.classList).filter(cls => allowedClasses.includes(cls))
        };
      });
    });
    // Klavye tuşlarının class'larını da kaydet
    const keyboardData = Array.from(document.querySelectorAll(".key")).map(btn => {
      return {
        key: btn.textContent.trim(),
        classes: Array.from(btn.classList)
      };
    });
    const gameState = {
      currentRow,
      currentSquareIndex,
      rowsData,
      keyboardData,
      isComplete,
      puzzleId: new Date(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem("wordleGameState", JSON.stringify(gameState));
  }

  function loadGameState() {
    const savedState = localStorage.getItem("wordleGameState");
    if (savedState) {
      const gameState = JSON.parse(savedState);
      currentRow = gameState.currentRow;
      currentSquareIndex = gameState.currentSquareIndex;
      gameState.rowsData.forEach((rowCells, rowIndex) => {
        rowCells.forEach((cell, cellIndex) => {
          const square = rows[rowIndex].querySelectorAll(".square")[cellIndex];
          square.textContent = cell.letter;
          square.className = "square";
          const cellClasses = cell.classes || [];
          cellClasses.forEach(cls => {
            if (cls !== "square") {
              square.classList.add(cls);
            }
          });
        });
      });
      // Klavye tuşlarının class'larını geri yükle
      if (gameState.keyboardData) {
        gameState.keyboardData.forEach(keyObj => {
          const btn = Array.from(document.querySelectorAll(".key")).find(b => b.textContent.trim() === keyObj.key);
          if (btn) {
            btn.className = "key"; // önce sıfırla
            keyObj.classes.forEach(cls => {
              if (cls !== "key") btn.classList.add(cls);
            });
          }
        });
      }
      // --- Oyun tamamlanmamışsa, son oynanan satırda renkli class'lar varsa onları da uygula ---
      if (!gameState.isComplete && gameState.currentRow < gameState.rowsData.length) {
        const lastRow = gameState.rowsData[gameState.currentRow];
        lastRow.forEach((cell, cellIndex) => {
          const square = rows[gameState.currentRow].querySelectorAll(".square")[cellIndex];
          // Eğer cell.classes içinde renklendirme class'ı varsa uygula
          ["correct", "misplaced", "incorrect", "flip"].forEach(cls => {
            if (cell.classes && cell.classes.includes(cls)) {
              square.classList.add(cls);
            }
          });
        });
      }
      if (gameState.isComplete && gameState.currentRow < gameState.rowsData.length) {
        const lastRow = gameState.rowsData[gameState.currentRow];
        let allFilled = lastRow.every(cell => cell.letter && cell.letter !== "");
        let allNotColored = lastRow.every(cell => !cell.classes.includes("correct") && !cell.classes.includes("misplaced") && !cell.classes.includes("incorrect"));
        if (allFilled && allNotColored) {
          // Tüm harfleri doğru bildiyse hepsini yeşil yap
          lastRow.forEach((cell, cellIndex) => {
            const square = rows[gameState.currentRow].querySelectorAll(".square")[cellIndex];
            square.classList.add("flip");
            square.classList.add("correct");
          });
        }
      }
      if (gameState.isComplete) {
        showCompleteModal();
        disableKeyboard();
      } else {
        enableKeyboard();
      }
    }
  }

  document.getElementById("closeModal").addEventListener("click", function() {
    closeModal();
  });

  document.getElementById("shareButton").addEventListener("click", function() {
    let shareText = `Wordle Türkçe ${new Date().toLocaleDateString()} ${currentRow + 1}/${maxRows}\n\n`;
    for (let r = 0; r <= currentRow; r++) {
      const squares = rows[r].querySelectorAll(".square");
      let rowEmoji = "";
      squares.forEach(sq => {
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
    shareText += "\nhttps://wordle-tanımalo-hekat.com/\n";
    copyToClipboard(shareText);
    alert("Sonuç panoya kopyalandı!");
  });

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        console.log("Kopyalandı!");
      }).catch(err => {
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
        alert("Sonuç panoya kopyalandı!");
      } catch (err) {
        alert("Kopyalama başarısız oldu.");
      }
      document.body.removeChild(textarea);
    }
  }

});
