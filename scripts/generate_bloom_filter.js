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
}

async function generateBloomFilter() {
    try {
        // Read wordlist.csv
        const wordlistPath = path.join(__dirname, '..', 'data', 'wordlist.csv');
        const csvContent = await fs.readFile(wordlistPath, 'utf8');
        const words = csvContent.split('\n').filter(word => word.trim());

        // Create Bloom Filter with same parameters as Go implementation
        const size = 81708;  // m value
        const numHashes = 10; // k value
        const filter = new BloomFilter(size, numHashes);

        // Add all words
        console.log('Adding words to Bloom Filter...');
        words.forEach(word => filter.add(word.trim()));

        // Convert bitset to base64
        let binary = '';
        for (let i = 0; i < filter.bitset.length; i++) {
            binary += String.fromCharCode(filter.bitset[i]);
        }
        const base64Data = Buffer.from(binary).toString('base64');

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
        
        console.log('Successfully created bloom_data.json');
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
