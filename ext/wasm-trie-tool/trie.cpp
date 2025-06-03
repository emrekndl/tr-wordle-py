#include "trie.h"
#define UTF8_ACCEPT 0
#define UTF8_REJECT 1
#include "utf8.h"
#include <cstring>
#include <iostream>
#include <memory>
#include <unordered_map>
#include <vector>

// # include "utf8.h"
// TODO: pull this utf8 from github
// curl -O https://raw.githubusercontent.com/sheredom/utf8.h/master/utf8


using namespace std;

// Trie veri yapısının düğüm sınıfı
struct Node {
  bool end = false; // Bir kelimenin bittiğini işaretler
  unordered_map<utf8_int32_t, unique_ptr<Node>>
      next; // Her karakterin sonraki düğümünü tutar
};

// Trie'nin kök düğümü
static unique_ptr<Node> root;

// Kelime listesinden Trie yapısını oluşturur
extern "C" void init_trie(const char **words, int count) {
  // Yeni bir kök düğüm oluştur
  root = make_unique<Node>();
  cout << "Initializing trie with " << count << " words" << endl;

  // Her kelime için Trie'ye ekleme yap
  for (int i = 0; i < count; i++) {
    const char *w = words[i];
    Node *current = root.get();

    // UTF-8 string üzerinde karakter karakter işlem yap
    const utf8_int8_t *it = (const utf8_int8_t *)w; // Kelimenin başlangıcı
    const utf8_int8_t *end = it + strlen(w);        // Kelimenin sonu

    // Kelimeyi karakter karakter işle
    while (it < end) {
      utf8_int32_t c; // Unicode karakter değeri
      it = (const utf8_int8_t *)utf8codepoint(
          it, &c); // Bir sonraki UTF-8 karakteri oku

      // Eğer karakter için düğüm yoksa yeni düğüm oluştur
      if (!current->next[c]) {
        current->next[c] = make_unique<Node>();
      }
      current = current->next[c].get();
    }
    current->end = true; // Kelimenin bittiğini işaretle
  }
  cout << "Trie initialization complete" << endl;
}

// Verilen kelimenin Trie yapısında olup olmadığını kontrol eder
extern "C" bool trie_contains(const char *word) {
  if (!root)
    return false; // Trie boşsa false dön

  Node *current = root.get();
  cout << "Searching for word: " << word << endl;

  // UTF-8 string üzerinde karakter karakter işlem yap
  const utf8_int8_t *it = (const utf8_int8_t *)word; // Kelimenin başlangıcı
  const utf8_int8_t *end = it + strlen(word);        // Kelimenin sonu

  // Kelimeyi karakter karakter kontrol et
  while (it < end) {
    utf8_int32_t c; // Unicode karakter değeri
    it = (const utf8_int8_t *)utf8codepoint(
        it, &c); // Bir sonraki UTF-8 karakteri oku

    // Karakter Trie'de var mı kontrol et
    auto next_it = current->next.find(c);
    if (next_it == current->next.end()) {
      // Karakter bulunamadıysa debug bilgisi yazdır ve false dön
      utf8_int8_t buf[8];
      utf8_int8_t *p = buf;
      p = utf8catcodepoint(p, c, sizeof(buf));
      *p = '\0';
      cout << "Character '" << buf << "' not found in trie" << endl;
      return false;
    }
    current = next_it->second.get();
  }

  // Kelime bulundu mu kontrol et
  cout << "Word " << (current->end ? "found" : "not found as complete word")
       << endl;
  return current->end; // Kelimenin tam olarak bitip bitmediğini kontrol et
}

// Binary dosyadan kelime listesini okuyup Trie yapısını oluşturur
extern "C" void init_trie_from_bin() {
  // Binary dosyayı aç
  FILE *bin_file = fopen("words.dat", "rb");
  if (bin_file == NULL) {
    cout << "words.dat not found!" << endl;
    exit(-1);
  }

  // Kelime sayısını oku (ilk 4 byte)
  uint32_t word_count;
  fread(&word_count, sizeof(uint32_t), 1, bin_file);
  cout << "Reading " << word_count << " words from binary file" << endl;

  // Tüm kelimeleri oku
  vector<string> words;
  for (uint32_t i = 0; i < word_count; i++) {
    // Kelime uzunluğunu oku (1 byte)
    uint8_t len;
    fread(&len, 1, 1, bin_file);

    // Kelimeyi oku
    vector<char> word_buffer(len + 1);
    fread(word_buffer.data(), 1, len, bin_file);
    word_buffer[len] = '\0'; // String sonunu işaretle

    words.push_back(word_buffer.data());
    if (i < 10) {
      cout << "Read word: " << word_buffer.data() << endl;
    }
  }
  fclose(bin_file);

  // Okunan kelimelerden Trie yapısını oluştur
  vector<const char *> word_ptrs;
  for (const auto &word : words) {
    word_ptrs.push_back(word.c_str());
  }
  init_trie(word_ptrs.data(), word_ptrs.size());
}
