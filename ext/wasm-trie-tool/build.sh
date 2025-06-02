#!/usr/bin/env bash

set -e

# CSV dosyasındaki boşlukları temizleyip null byte ile ayır
cat wordlist.csv | tr -d ' ' | tr ',' '\0' > words.bin

emcc trie.cpp \
  -O3 \
  --embed-file words.bin \
  -s WASM=1 \
  -s FORCE_FILESYSTEM=1 \
  -s EXPORTED_FUNCTIONS="['_malloc','_free','_trie_contains','_init_trie','_init_trie_from_bin']" \
  -s EXPORTED_RUNTIME_METHODS="['cwrap','UTF8ToString','stringToUTF8']" \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -o trie.js

# # WASM dosyasını build et
# emcc trie.cpp \
#   -O3 \
#   --embed-file words.bin \
#   -s WASM=1 \
#   -s FORCE_FILESYSTEM=1 \
#   -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_trie_contains', '_init_trie_from_bin']" \
#   -s EXPORTED_RUNTIME_METHODS="['cwrap', 'getValue', 'setValue', 'UTF8ToString', 'stringToUTF8']" \
#   -o trie.js

# -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap','ccall', getValue']
# emcc trie.c -o trie.js -s MODULARIZE=1 -s EXPORT_ES6=0 -s 'EXPORTED_FUNCTIONS=["_malloc","_free","_trie_contains","_init_trie_from_bin"]' -s 'EXPORTED_RUNTIME_METHODS=["cwrap","getValue","setValue","UTF8ToString","stringToUTF8"]'

