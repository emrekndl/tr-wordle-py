// Global toast avatar
let toastAvatar = null;

/**
 * Toast mesajları için kullanılacak avatar resmini yükler ve saklar
 * @returns {Promise<string>} Avatar resmi URL'i
 */
function loadToastAvatar() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            toastAvatar = img.src;
            resolve(img.src);
        };
        img.onerror = reject;
        img.src = "img/4534727.png";
    });
}

// İlk yüklemede avatarı hazırla
loadToastAvatar().catch(console.error);

/**
 * Ekranın sağ üst köşesinde bir uyarı toast mesajı gösterir
 * @param {string} message Gösterilecek mesaj
 */
export function toastWarning(message) {
    Toastify({
        text: `${message}`,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        olderFirst: false,
        offset: {
            x: '3em',
            y: '4em'
        },
        style: {
            background: "linear-gradient(to right, #00b09b,rgb(221, 184, 20))",
        },
        avatar: toastAvatar,
    }).showToast();
}

/**
 * Oyun sonunda kazanma/kaybetme modalını gösterir
 * @param {Object} response API'den gelen kelime ve tanım bilgileri
 * @param {Object} savedModalState Kaydedilmiş modal durumu (opsiyonel)
 */
export function showCompleteModal(response = {}, savedModalState = null) {
    const modal = document.getElementById("completeModal");
    modal.style.display = "block";
    const wordContainer = modal.querySelector(".modal-word");
    const definitionList = modal.querySelector(".definition-list");
    const modalTitle = modal.querySelector("h2");
    const attemptCount = modal.querySelector(".attempt-count");

    wordContainer.textContent = "";
    definitionList.innerHTML = "";

    if (savedModalState) {
        modalTitle.textContent = savedModalState.title;
        wordContainer.textContent = savedModalState.word;
        if (savedModalState.definitions) {
            savedModalState.definitions.forEach((def) => {
                const li = document.createElement("li");
                li.textContent = def;
                definitionList.appendChild(li);
            });
        }
        attemptCount.textContent = savedModalState.attemptCount;
        attemptCount.style.color = savedModalState.isComplete
            ? "#6aaa64"
            : "#dc3545";
    } else {
        const currentRow = response.currentRow || 1;
        attemptCount.textContent = `${currentRow}/6`;
        let isCorrectGuess = false;
        if (response.correct_letters) {
            const correctLetters = Object.values(response.correct_letters);
            isCorrectGuess = correctLetters.length === 5;
        }

        attemptCount.style.color = isCorrectGuess ? "#6aaa64" : "#dc3545";

        if (isCorrectGuess) {
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
            const messages = levelMessages[currentRow] || levelMessages[6];
            const randomIndex = Math.floor(Math.random() * messages.length);
            modalTitle.textContent = "Tebrikler  🎉 " + messages[randomIndex];
        } else {
            const failMessages = [
                "💪 E hadi be! Yarın mutlaka...",
                "🌅 Olmadı bu sefer, dert etme!",
                "🔄 Sen yarın bir daha gel...",
                "🎯 Çok yaklaştın aslında!"
            ];
            const randomIndex = Math.floor(Math.random() * failMessages.length);
            modalTitle.textContent = "Oyun Bitti " + failMessages[randomIndex];
        }

        let word = null;
        let definitions = null;

        try {
            if (response && response.word_definition) {
                word = Object.keys(response.word_definition)[0];
                definitions = response.word_definition[word];
            } else if (response && Object.keys(response).length > 0) {
                word = Object.keys(response)[0];
                definitions = response[word];
            }

            if (word) {
                wordContainer.textContent = word;
                if (Array.isArray(definitions)) {
                    definitions.forEach((def) => {
                        const li = document.createElement("li");
                        li.textContent = def;
                        definitionList.appendChild(li);
                    });
                }
            }
        } catch (error) {
            console.error("Error while processing word definition:", error);
        }
    }
}

/**
 * Metni panoya kopyalar
 * @param {string} text Kopyalanacak metin
 */
export function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .catch((err) => {
                console.error("Kopyalama hatası:", err);
            });
    } else {
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

/**
 * Modalı kapatır
 */
export function closeModal() {
    document.getElementById("completeModal").style.display = "none";
}
