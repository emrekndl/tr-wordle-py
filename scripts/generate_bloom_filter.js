/**
 * Bu script bir kelime listesinden Bloom Filter veri yapısı oluşturur ve JSON olarak kaydeder.
 * Bloom Filter, bir elemanın bir kümenin üyesi olup olmadığını test etmek için kullanılan
 * alan açısından verimli olasılıksal bir veri yapısıdır. Yanlış pozitiflere sahip olabilir
 * ancak asla yanlış negatif vermez.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * BloomFilter sınıfı, bir elemanın bir kümenin üyesi olup olmadığını test etmek için
 * kullanılan alan açısından verimli olasılıksal bir veri yapısını uygular.
 */
class BloomFilter {
    /**
     * @param {number} size - Bit dizisinin boyutu (m)
     * @param {number} numHashes - Kullanılacak hash fonksiyonu sayısı (k)
     */
    constructor(size, numHashes) {
        this.size = size;
        this.numHashes = numHashes;
        // Verimli bit depolama için Uint8Array kullanımı (1 byte = 8 bit)
        this.bitset = new Uint8Array((size + 7) >> 3);
    }

    /**
     * djb2 hash fonksiyonunun uygulaması
     * Bu basit ve etkili bir kriptografik olmayan hash fonksiyonudur
     * @param {string} str - Hash'lenecek string
     * @returns {number} - Hesaplanan hash değeri
     */
    _djb2Hash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash >>> 0; // 32-bitlik işaretsiz tam sayıya dönüştür
        }
        return hash;
    }

    /**
     * Verilen bir girdi için k farklı hash değeri üretir
     * @param {string} value - Hash'lenecek girdi değeri
     * @returns {number[]} - Hash indekslerinin dizisi
     */
    _getIndexes(value) {
        const indexes = [];
        value = value.toLowerCase();
        
        // Değeri farklı öneklerle birleştirerek k farklı hash değeri üret
        for (let i = 0; i < this.numHashes; i++) {
            const hashStr = `${i}${value}`;
            const fullHash = this._djb2Hash(hashStr);
            const index = fullHash % this.size;
            indexes.push(index);
        }
        return indexes;
    }

    /**
     * Bloom Filter'a bir değer ekler
     * @param {string} value - Eklenecek değer
     */
    add(value) {
        const indexes = this._getIndexes(value);
        // Tüm hash pozisyonlarındaki bitleri ayarla
        for (const index of indexes) {
            const byteIndex = index >> 3;  // 8'e bölerek byte pozisyonunu bul
            const bitIndex = index & 7;    // 8'e göre modunu alarak byte içindeki bit pozisyonunu bul
            this.bitset[byteIndex] |= (1 << bitIndex);
        }
    }

    /**
     * Bir kelimenin kümede olup olmadığını test eder
     * @param {string} word - Test edilecek kelime
     * @returns {boolean} - Kelime kümede olabilir ise true, kesinlikle değilse false döner
     */
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

/**
 * Kelime listesinden Bloom Filter oluşturan ve web uygulaması tarafından
 * yüklenebilecek bir JSON dosyası olarak kaydeden ana fonksiyon
 */
async function generateBloomFilter() {
    try {
        // Kelime listesini data dizininden oku
        const wordlistPath = path.join(__dirname, '..', 'data', 'wordlist.txt');
        console.log('Reading wordlist from:', wordlistPath);
        
        const textContent = await fs.readFile(wordlistPath, 'utf8');
        const words = textContent.split('\n').filter(word => word.trim());

        // Bloom Filter'ı optimal parametrelerle başlat
        // size (m) = 81708 bit - istenen yanlış pozitif oranına göre seçildi
        // numHashes (k) = 10 - bu boyut ve beklenen eleman sayısı için optimal hash fonksiyonu sayısı
        const size = 81708;  // m değeri
        const numHashes = 10; // k değeri
        const filter = new BloomFilter(size, numHashes);

        // Add all words
        console.log('Adding words to Bloom Filter...');
        for (const word of words) {
            const trimmedWord = word.trim().toLowerCase();
            if (trimmedWord) {
                filter.add(trimmedWord);
            }
        }

        // Filtreyi bilinen kelimelerle test et
        const testWords = ['elmas', 'kalem', 'kitap', 'araba', 'xxxxx'];
        console.log('\nTesting words:');
        for (const word of testWords) {
            filter.testWord(word);
        }

        // Bitset boyutunu doğrula
        const expectedBytes = Math.ceil(filter.size / 8);
        console.log('Bitset stats:', {
            length: filter.bitset.length,
            expectedBytes,
            match: filter.bitset.length === expectedBytes
        });
        
        // İkili veriyi JSON depolama için base64'e dönüştür
        const base64Data = Buffer.from(filter.bitset).toString('base64');
        
        // Log conversion details
        console.log('Bloom Filter conversion:', {
            bitsetLength: filter.bitset.length,
            base64Length: base64Data.length,
            firstByte: filter.bitset[0].toString(16),
            sampleBits: Array.from(filter.bitset.slice(0, 4)).map(b => b.toString(2).padStart(8, '0'))
        });

        // Web uygulaması için JSON yapısını hazırla
        const data = {
            type: 'BloomFilter',
            size: filter.size,
            nbHashes: filter.numHashes,
            bitset: {
                type: 'Uint8Array',
                data: base64Data
            }
        };

        // Bloom Filter verisini JSON olarak kaydet
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
