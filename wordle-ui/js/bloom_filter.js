class BloomFilter {
    constructor(size, numHashes, bitset) {
        this.size = size;
        this.numHashes = numHashes;
        this.bitset = bitset || new Uint8Array((size + 7) >> 3);
    }

    // djb2 hash - simple, fast and well-distributed hash function
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

    add(value) {
        const indexes = this._getIndexes(value);
        for (const index of indexes) {
            const byteIndex = index >> 3;  // Divide by 8
            const bitIndex = index & 7;    // Modulo 8
            this.bitset[byteIndex] |= (1 << bitIndex);
        }
    }

    contains(value) {
        const indexes = this._getIndexes(value);
        for (const index of indexes) {
            const byteIndex = index >> 3;
            const bitIndex = index & 7;
            if (!(this.bitset[byteIndex] & (1 << bitIndex))) {
                return false;
            }
        }
        return true;
    }

    // Load bloom filter data from JSON
    static async loadFromJson(jsonPath = '/bloom_data.json') {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load Bloom Filter data: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Extract parameters from JSON
            const { size, nbHashes, bitset } = data;
            
            // Convert base64/binary string data to Uint8Array
            const binaryString = atob(bitset.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return new BloomFilter(size, nbHashes, bytes);
        } catch (error) {
            console.error('Error loading bloom filter:', error);
            throw error;
        }
    }

    // Load the pre-computed bloom filter data
    static async initialize() {
        return await BloomFilter.loadFromJson('bloom_data.json');
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

    // Add method to save filter data as JSON
    // async savgToJson(filename = 'bloom_data.json') {
    //     // Convert bitset to base64 string
    //     const bytes = this.bitset;
    //     let binary = '';
    //     for (let i = 0; i < bytes.length; i++) {
    //         binary += String.fromCharCode(bytes[i]);
    //     }
    //     const base64Data = btoa(binary);
    //
    //     const data = {
    //         type: 'BloomFilter',
    //         size: this.size,
    //         nbHashes: this.numHashes,
    //         bitset: {
    //             type: 'Uint8Array',
    //             data: base64Data
    //         }
    //     };
    //
    //     // Save to file using fetch POST
    //     const response = await fetch('/api/save_bloom_filter', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify(data)
    //     });
    //
    //     if (!response.ok) {
    //         throw new Error(`Failed to save Bloom Filter: ${response.statusText}`);
    //     }
    //
    //     return data;
    // }
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
