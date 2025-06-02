// Generate Bloom Filter data from wordlist.csv
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BloomFilter {
    constructor(size, numHashes) {
        this.size = size;
        this.numHashes = numHashes;
        this.bitset = new Uint8Array((size + 7) >> 3);
    }

    // djb2 hash function
    _djb2Hash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash >>> 0;
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
            const byteIndex = index >> 3;
            const bitIndex = index & 7;
            this.bitset[byteIndex] |= (1 << bitIndex);
        }
    }

    // Function to test words
    testWord(word) {
        const indexes = this._getIndexes(word);
        console.log(`Testing word "${word}":`);
        console.log('Hash indexes:', indexes);
        
        for (const index of indexes) {
            const byteIndex = index >> 3;
            const bitIndex = index & 7;
            const bit = !!(this.bitset[byteIndex] & (1 << bitIndex));
            if (!bit) {
                console.log(`  Not found - missing bit at: byte=${byteIndex}, bit=${bitIndex}, index=${index}`);
                return false;
            }
        }
        console.log('  Word found - all bits set');
        return true;
    }
}

async function generateBloomFilter() {
    try {
        // Read wordlist.txt
        const wordlistPath = path.join(__dirname, '..', 'data', 'wordlist.txt');
        console.log('Reading wordlist from:', wordlistPath);
        
        const textContent = await fs.readFile(wordlistPath, 'utf8');
        const words = textContent.split('\n').filter(word => word.trim());

        // Create Bloom Filter with same parameters as Go implementation
        const size = 81708;  // m value
        const numHashes = 10; // k value
        const filter = new BloomFilter(size, numHashes);

        // Add all words
        console.log('Adding words to Bloom Filter...');
        for (const word of words) {
            const trimmedWord = word.trim().toLowerCase();
            if (trimmedWord) {
                filter.add(trimmedWord);
            }
        }

        // Test some known words
        const testWords = ['elmas', 'kalem', 'kitap', 'araba', 'xxxxx'];
        console.log('\nTesting words:');
        for (const word of testWords) {
            filter.testWord(word);
        }

        // Calculate expected size and validate
        const expectedBytes = Math.ceil(filter.size / 8);
        console.log('Bitset stats:', {
            length: filter.bitset.length,
            expectedBytes,
            match: filter.bitset.length === expectedBytes
        });
        
        // Convert Uint8Array to base64
        const base64Data = Buffer.from(filter.bitset).toString('base64');
        
        // Log conversion details
        console.log('Bloom Filter conversion:', {
            bitsetLength: filter.bitset.length,
            base64Length: base64Data.length,
            firstByte: filter.bitset[0].toString(16),
            sampleBits: Array.from(filter.bitset.slice(0, 4)).map(b => b.toString(2).padStart(8, '0'))
        });

        // Create JSON data
        const data = {
            type: 'BloomFilter',
            size: filter.size,
            nbHashes: filter.numHashes,
            bitset: {
                type: 'Uint8Array',
                data: base64Data
            }
        };

        // Save to JSON file
        const outputPath = path.join(__dirname, '..', 'wordle-ui', 'bloom_data.json');
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        
        console.log(`\nSuccessfully created bloom_data.json`);
        console.log(`Total words processed: ${words.length}`);
        console.log(`Filter size: ${size} bits`);
        console.log(`Number of hash functions: ${numHashes}`);
        console.log(`Output file: ${outputPath}`);

    } catch (error) {
        console.error('Error generating Bloom Filter:', error);
        process.exit(1);
    }
}

generateBloomFilter();
