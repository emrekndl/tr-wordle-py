#ifndef TRIE_H
#define TRIE_H

extern "C" {
// wasm access c-api (abi-application binary interface)
void init_trie(const char *words[], int count);
bool trie_contains(const char *word);
void init_trie_from_bin();
}
#endif
