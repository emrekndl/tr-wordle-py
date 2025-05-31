#!/usr/bin/env bash

# 1) Sadece WASM modülü gerekiyorsa
emcc trie.cpp \
     -O3 -s WASM=1 -s SIDE_MODULE=1 \
     -o trie.wasm

# 2) Emscripten ile JavaScript wrapper ve WASM üretimi
emcc trie.cpp \
    -O3 -s WASM=1 \
    -s EXPORTED_FUNCTIONS="['_init_trie','_trie_contains']" \
    -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap','getValue']" \
    -o trie.js

# Kullanım:
# ./build.sh
# node trie.js -- word_list.csv

