import BloomFilter from './bloom_filter.js';

// Bloom Filter initialize işlemi
let bloomFilter = null;

/**
 * Bloom Filter'ı yükler ve başlatır
 * Kelime kontrolü için gerekli veri yapısını oluşturur
 * @returns {Promise<BloomFilter>} Yüklenen Bloom Filter nesnesi
 * @throws {Error} Yükleme başarısız olursa hata fırlatır
 */
async function initializeBloomFilter() {
    console.log("Bloom Filter yükleniyor...");
    try {
        // BloomFilter sınıfının initialize metodunu kullan
        bloomFilter = await BloomFilter.initialize();
        console.log("Bloom Filter başarıyla yüklendi");
        return bloomFilter;
    } catch (error) {
        console.error("Bloom Filter yüklenirken hata:", error);
        throw error;
    }
}

/**
 * Verilen kelimenin geçerli bir kelime olup olmadığını Bloom Filter ile kontrol eder
 * @param {string} word Kontrol edilecek kelime
 * @returns {Promise<boolean>} Kelime geçerli ise true, değilse veya hata olursa false
 */
async function checkWordInBloomFilter(word) {
    try {
        if (!bloomFilter) {
            console.log("Bloom Filter yükleniyor...");
            bloomFilter = await initializeBloomFilter();
        }
        if (!bloomFilter) {
            throw new Error("Bloom Filter yüklenemedi");
        }
        return bloomFilter.contains(word.toLowerCase());
    } catch (error) {
        console.error("Kelime kontrolünde hata:", error);
        return false;
    }
}

export { initializeBloomFilter, checkWordInBloomFilter };