// API Base URL
const API_BASE = `${window.location.origin}/api/wordle`;

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

export function fetchWordOfTheDay() {
    return fetch(`${API_BASE}/wordoftheday`, {
        method: "GET",
        credentials: "include",
    });
}
