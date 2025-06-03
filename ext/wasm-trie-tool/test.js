// Import the WASM module
import initModule from './trie.js';

// Türkçe karakterler için özel lowercase fonksiyonu
function turkishToLower(text) {
    return text
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .toLowerCase();
}

async function testTrie() {
    try {
        // Initialize the WASM module
        const Module = await initModule();
        
        // Create function wrappers
        const initTrieFromBin = Module.cwrap('init_trie_from_bin', null, []);
        const trieContains = Module.cwrap('trie_contains', 'boolean', ['string']);
        
        // Initialize trie from binary file
        console.log('Initializing trie from binary file...');
        initTrieFromBin();
        
        // Test some words
        const testWords = ['dünya', 'world', 'türki', 'ışık', 'elmas', 'asdfg'];
        
        for (const word of testWords) {
            const searchWord = turkishToLower(word);
            const exists = trieContains(searchWord);
            console.log(`Word "${word}" (searching as "${searchWord}") ${exists ? 'exists' : 'does not exist'} in the trie`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testTrie();
