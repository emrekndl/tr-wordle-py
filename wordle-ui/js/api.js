// API Base URL
const API_BASE = `${window.location.origin}/api/wordle`;

/**
 * Kullanıcının tahminini API'ye gönderir ve sonucu alır
 * @param {string} guessWord Tahmin edilen kelime
 * @param {Function} toLocaleLowerCase Türkçe karakterler için lowercase dönüşümü yapan fonksiyon
 * @returns {Promise<Object|null>} API yanıtı veya hata durumunda null
 */
export async function checkGuess(guessWord, toLocaleLowerCase) {
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

/**
 * Günün kelimesini arka planda oluşturulur.
 * @returns {Promise<void>}
 */
export async function fetchWordOfTheDay() {
    return fetch(`${API_BASE}/wordoftheday`, {
        method: "GET",
        credentials: "include",
    });
}
