/**
 * Kelime kontrolü için Bloom Filter veri yapısını implement eden sınıf
 * Az bellek kullanarak hızlı kelime arama sağlar
 */
class BloomFilter {
    /**
     * Bloom Filter'ı oluşturur
     * @param {number} size Filtre boyutu (bit sayısı)
     * @param {number} numHashes Hash fonksiyonu sayısı
     * @param {Uint8Array} bitset Önceden oluşturulmuş bit dizisi (opsiyonel)
     */
    constructor(size, numHashes, bitset) {
        this.size = size;
        this.numHashes = numHashes;
        // Calculate the number of bytes needed to store all bits
        const numBytes = Math.ceil(size / 8);  // Same as (size + 7) >> 3
        this.bitset = bitset || new Uint8Array(numBytes);
        
        // Validate bitset length if provided
        if (bitset && bitset.length !== numBytes) {
            console.error('Warning: Provided bitset length does not match expected size', {
                provided: bitset.length,
                expected: numBytes
            });
        }
    }

    /**
     * djb2 hash algoritması kullanarak string için hash değeri üretir
     * @param {string} str Hash'lenecek string
     * @returns {number} Hash değeri
     * @private
     */
    _djb2Hash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            // hash * 33 + c
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash >>> 0; // Keep 32-bit unsigned
        }
        return hash;
    }

    _getIndexes(value) {
        const indexes = [];
        value = value.toLowerCase();
        
        for (let i = 0; i < this.numHashes; i++) {
            const hashStr = `${i}${value}`;
            const fullHash = this._djb2Hash(hashStr);
            const index = fullHash % this.size;
            indexes.push(index);
        }
        return indexes;
    }

    /**
     * Bloom Filter'a yeni bir eleman ekler
     * @param {string} str Eklenecek string
     */
    add(value) {
        const indexes = this._getIndexes(value);
        for (const index of indexes) {
            const byteIndex = index >> 3;  // Divide by 8
            const bitIndex = index & 7;    // Modulo 8
            this.bitset[byteIndex] |= (1 << bitIndex);
        }
    }

    /**
     * Verilen string'in Bloom Filter'da olup olmadığını kontrol eder
     * @param {string} str Kontrol edilecek string
     * @returns {boolean} String filter'da varsa true, yoksa false
     */
    contains(value) {
        const indexes = this._getIndexes(value);
        let foundCount = 0;
        
        for (const index of indexes) {
            const byteIndex = index >> 3;
            const bitIndex = index & 7;
            const bitValue = !!(this.bitset[byteIndex] & (1 << bitIndex));
            
            if (!bitValue) {
                return false;
            }
            foundCount++;
        }
        
        return true;
    }

    // Load bloom filter data from JSON
    static async loadFromJson(jsonPath = '/wordle/bloom_data.json') {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load Bloom Filter data: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Extract parameters from JSON
            const { size, nbHashes, bitset } = data;
            
            // Convert base64 to Uint8Array in the browser
            // First decode base64 to binary string
            const binaryStr = atob(bitset.data);
            
            // Convert binary string to byte array
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            
            // Create new filter
            const filter = new BloomFilter(size, nbHashes, bytes);

            return filter;
        } catch (error) {
            console.error('Error loading bloom filter:', error);
            throw error;
        }
    }

    /**
     * JSON dosyasından Bloom Filter'ı yükler ve başlatır
     * @returns {Promise<BloomFilter>} Oluşturulan Bloom Filter nesnesi
     * @static
     */
    static async initialize() {
        return await BloomFilter.loadFromJson('/wordle/bloom_data.json');
    }

    static async createFromWordlist(csvPath) {
        try {
            // Fetch the CSV file
            const response = await fetch(csvPath);
            if (!response.ok) {
                throw new Error(`Failed to load wordlist: ${response.statusText}`);
            }

            const text = await response.text();
            const words = text.split('\n').filter(word => word.trim());

            // Create a new BloomFilter with optimal size
            // Using the same parameters as in Go implementation
            const size = 81708;  // m value
            const numHashes = 10; // k value
            const filter = new BloomFilter(size, numHashes);

            // Add all words to the filter
            words.forEach(word => filter.add(word.trim()));

            return filter;
        } catch (error) {
            console.error('Error creating Bloom Filter:', error);
            throw error;
        }
    }

}

// Singleton instance for global access
let bloomFilterInstance = null;

// Modified getBloomFilter to use initialize
export async function getBloomFilter() {
    if (!bloomFilterInstance) {
        bloomFilterInstance = await BloomFilter.initialize();
    }
    return bloomFilterInstance;
}

export async function checkWord(word) {
    const filter = await getBloomFilter();
    return filter.contains(word);
}

export default BloomFilter;
