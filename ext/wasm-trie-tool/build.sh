#!/usr/bin/env bash

set -e

# Convert wordlist to binary format
python3 - << EOF
import sys
import struct

def turkish_lower(text):
    text = text.replace('İ', 'i')
    text = text.replace('I', 'ı')
    return text.lower()

print("Reading wordlist.txt...")
with open('../../data/wordlist.txt', 'r', encoding='utf-8') as f:
    words = []
    for line in f:
        word = line.strip()
        if word:
            word = turkish_lower(word)
            words.append(word)
    
    print(f"Total words loaded: {len(words)}")
    print("First 10 words:", words[:10])

print("Writing binary file...")
with open('words.dat', 'wb') as f:
    # Önce kelime sayısını yaz (4 byte)
    f.write(struct.pack('<I', len(words)))
    
    for word in words:
        # Her kelimeyi UTF-8 olarak encode et
        word_bytes = word.encode('utf-8')
        # Kelime uzunluğunu yaz (1 byte)
        f.write(struct.pack('B', len(word_bytes)))
        # Kelimeyi yaz
        f.write(word_bytes)

print("Binary file created successfully!")
EOF

# Compile WASM module
emcc trie.cpp \
  -O3 \
  --embed-file words.dat \
  -s WASM=1 \
  -s FORCE_FILESYSTEM=1 \
  -s EXPORTED_FUNCTIONS="['_malloc','_free','_trie_contains','_init_trie','_init_trie_from_bin']" \
  -s EXPORTED_RUNTIME_METHODS="['cwrap','UTF8ToString','stringToUTF8']" \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -o trie.js


# -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap','ccall', getValue']
# emcc trie.c -o trie.js -s MODULARIZE=1 -s EXPORT_ES6=0 -s 'EXPORTED_FUNCTIONS=["_malloc","_free","_trie_contains","_init_trie_from_bin"]' -s 'EXPORTED_RUNTIME_METHODS=["cwrap","getValue","setValue","UTF8ToString","stringToUTF8"]'

