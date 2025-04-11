const API_BASE = "http://localhost:8000/api/wordle";

document.addEventListener("DOMContentLoaded", function() {
  // Global değişkenler
  let currentRow = 0;
  let currentSquareIndex = 0;
  const maxRows = 6;    // Toplam satır sayısı
  const maxSquares = 5; // Her satırdaki kare sayısı
  
  const rows = document.querySelectorAll(".grid .row");
  const keyButtons = document.querySelectorAll(".key");

  // Sayfa yüklendiğinde günün kelimesini çekmek (fetchWordOfTheDay fonksiyonunu burada da kullanabilirsiniz)
  fetchWordOfTheDay();
  loadGameState(); // Oyun state'ini yükle

  // Klavye butonlarına tıklama olayları
  keyButtons.forEach(keyButton => {
    keyButton.addEventListener("click", function() {
      const key = this.textContent.trim();

      if (key === "Enter") {
        if (currentSquareIndex === maxSquares) {
          const guess = getCurrentGuess();
          // Tahmini API'ye gönderiyoruz
          checkGuess(guess).then(response => {
            saveGameState(); // Oyun state'ini kaydet
            // API'den dönen sonucu flip animasyonu ve renklendirme ile uygula
            animateRow(currentRow, response);
             // is_complete kontrolü
            if (response.is_complete === true) {
              // Modal göster
              showCompleteModal(response);  // Günün kelimesi gibi bir bilgi varsa bu fonksiyona gönderilebilir

              // Artık yeni tahmin gönderilemesin veya klavye pasif olsun
              disableKeyboard();
            }
            // Eğer hala satır varsa, bir sonraki satıra geç
            else if (currentRow < maxRows - 1) {
              currentRow++;
              currentSquareIndex = 0;
            } else {
              alert("Oyununuz tamamlandı.");
            }
          });
        } else {
          alert("Lütfen 5 harften oluşan bir kelime girin!");
        }
      } else if (key === "⌫") {
        // Geri silme: Eğer en az bir harf varsa, son harfi sil
        if (currentSquareIndex > 0) {
          currentSquareIndex--;
          const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
          currentSquare.textContent = "";
        }
      } else {
        // Harf tuşlarına basıldığında
        if (currentSquareIndex < maxSquares) {
          const currentSquare = rows[currentRow].querySelectorAll(".square")[currentSquareIndex];
          currentSquare.textContent = key;
          // Basit pop efektini tetikle
          currentSquare.classList.add("pop");
          setTimeout(() => {
            currentSquare.classList.remove("pop");
          }, 200);
          currentSquareIndex++;
        }
      }
    });
  });

  function showCompleteModal(response) {
    const modal = document.getElementById("completeModal");
    modal.style.display = "block";
  
    // Modal içeriğinde "günün kelimesi" var mı yok mu gibi bilgileri de
    // response’tan alıp gösterebilirsiniz.
  }
  
  function closeModal() {
    document.getElementById("completeModal").style.display = "none";
  }
  
  // Yeni tahmin veya harf girişi engelleme
  function disableKeyboard() {
    // Tüm key butonlarını pasif yapabilirsiniz
    document.querySelectorAll(".key").forEach(key => {
      key.disabled = true; 
    });
  }
  // Geçerli satırdaki tahmini string olarak döndüren fonksiyon
  function getCurrentGuess() {
    let guess = "";
    const squares = rows[currentRow].querySelectorAll(".square");
    squares.forEach(square => {
      guess += square.textContent;
    });
    return guess;
  }

  // API’ye tahmin gönderip response döndüren fonksiyon (POST isteği)
  async function checkGuess(guessWord) {
    try {
      const response = await fetch("/api/wordle/check", {
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
    }
  }

  // API'den dönen response verileriyle aktif satırdaki kareleri flip animasyonu ve renklendirme ile güncelleyen fonksiyon
  function animateRow(rowIndex, result) {
    const row = rows[rowIndex];
    const squares = row.querySelectorAll(".square");
    squares.forEach((square, index) => {
      // Her bir kareye delay veriyoruz (örneğin, 300ms arayla)
      setTimeout(() => {
        square.classList.add("flip");
        // Harfin rengini belirle (basit bir kontrol, harfin hangi listede yer aldığını kontrol ediyoruz)
        const letter = square.textContent;
        // NOT: Aynı harf birden fazla kez gelebilir; burada basit kontrol yapıyoruz.
        if (result.correct_letters.hasOwnProperty(index.toString()) && letter === result.correct_letters[index.toString()]) {
          square.classList.add("correct");
          updateKeyboardColor(letter, "correct");
        }
        // Yanlış konumda doğru harf kontrolü:
        else if (result.correct_letters_in_not_correct_position.indexOf(letter) > -1) {
          // Bulunan harfin indeksini alıp, diziden çıkarıyoruz.
          const misplacedIndex = result.correct_letters_in_not_correct_position.indexOf(letter);
          result.correct_letters_in_not_correct_position.splice(misplacedIndex, 1);
          square.classList.add("misplaced");
          // updateKeyboardColor(letter, "misplaced");
      } else if (result.incorrect_letters.includes(letter)) {
          square.classList.add("incorrect");
          updateKeyboardColor(letter, "incorrect");
        }
      }, index * 300);
    });
  }

  // Günün kelimesini çeken fonksiyon (örnek, UI'da kullanılabilir)
  function fetchWordOfTheDay() {
    fetch("/api/wordle/wordoftheday", {
      method: "GET",
      credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
      console.log("Günün kelimesi:", data.word);
      // Eğer istenirse, günün kelimesi UI üzerinde farklı bir alanda gösterilebilir.
    })
    .catch(err => console.error("Günün kelimesi alınamadı:", err));
  }
  
  // Klavyedeki tuşu renklendiren yardımcı fonksiyon
  function updateKeyboardColor(letter, statusClass) {
    // Harfi büyük/küçük harf farkı yoksa ikisini de handle edebilirsiniz.
    // Aşağıda büyük harfli tuş metninin olduğunu varsayalım:
    const keyButton = Array.from(document.querySelectorAll(".key")).find(btn => btn.textContent.trim() === letter);

    if (keyButton) {
      // Örneğin, keyButton üzerinde eklenmiş .correct, .misplaced, .incorrect sınıflarından birini temizleyip
      // yenisini ekleyebilirsiniz. (Basit yaklaşımla önce hepsini remove, sonra ekle)
      keyButton.classList.remove("correct", "misplaced", "incorrect");
      keyButton.classList.add(statusClass);
    }
  }

  // Oyun state'ini saklayan/okuyan fonksiyonlar
  function saveGameState() {
    // Tüm satırları gezerek her satırın durumunu alıyoruz
    const rowsData = Array.from(rows).map(row => {
      // Her satırdaki karelerin harf bilgisini ve class listesini saklıyoruz.
      return Array.from(row.querySelectorAll(".square")).map(sq => {
        return { 
          letter: sq.textContent,
          // classList nesnesi array'e çevriliyor (örneğin: ["flip", "correct"] gibi)
          classes: Array.from(sq.classList)
        };
      });
    });
  
    const gameState = {
      currentRow,
      currentSquareIndex,
      rowsData,
      isComplete: false,
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
  
      // Her satırdaki karelerin durumunu geri yükle
      gameState.rowsData.forEach((rowCells, rowIndex) => {
        rowCells.forEach((cell, cellIndex) => {
          const square = rows[rowIndex].querySelectorAll(".square")[cellIndex];
          square.textContent = cell.letter;
          // Önce mevcut class’ları temizleyip varsayılan "square" class'ını ekliyoruz
          square.className = "square";
          // cell.classes tanımlı değilse boş bir dizi döndür
          const cellClasses = cell.classes || [];
          cellClasses.forEach(cls => {
            if (cls !== "square") {
              square.classList.add(cls);
            }
          });
        });
      });
  
      // Eğer oyun tamamlanmışsa, klavyeyi pasif hale getiriyoruz
      if (gameState.isComplete) {
        showCompleteModal();
        disableKeyboard();
      }
    }
  }
  
document.getElementById("closeModal").addEventListener("click", function() {
  closeModal();
}
);


document.getElementById("shareButton").addEventListener("click", function() {
  let shareText = `Wordle Türkçe ${new Date()} ${currentRow}/${maxRows}\n\n`;

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
  // Modern tarayıcılarda (HTTPS altında) kullanılabilen bir yol:
  navigator.clipboard.writeText(text).then(() => {
    console.log("Kopyalandı!");
  }).catch(err => {
    console.error("Kopyalama hatası:", err);
  });
}

});




