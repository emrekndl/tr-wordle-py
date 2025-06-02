import BloomFilter from './bloom_filter.js';

// Bloom Filter initialize işlemi
let bloomFilter = null;

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

// Bloom Filter'dan kelime kontrolü
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