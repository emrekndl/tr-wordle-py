#include "trie.h"
// #include <cstddef>
#include <cstring>
#include <fstream>
#include <iostream>
#include <memory>
// #include <sstream>
// #include <string>
#include <unordered_map>
#include <vector>

using namespace std;


struct Node {
  bool end = false;
  unordered_map<char, unique_ptr<Node>> next;
};

static unique_ptr<Node> root;


extern "C" void init_trie(const char **words, int count) {
  root = make_unique<Node>();

  for (int i = 0; i < count; i++) {
    // to_lower(words[i]);
    const char *w = words[i];
    Node *current = root.get();

    for (int j = 0; w[j]; j++) {
      char c = w[j];
      if (!current->next[c]) {
        current->next[c] = make_unique<Node>();
      }
      current = current->next[c].get();
    }
    current->end = true;
  }
}

extern "C" bool trie_contains(const char *word) {
  Node *current = root.get();
  // to_lower(word);
  for (int i = 0; word[i]; i++) {
    char c = word[i];
    auto it = current->next.find(c);
    if (it == current->next.end()) {
      return false;
    }
    current = it->second.get();
  }
  return current->end;
}



extern "C" void init_trie_from_bin() {
  FILE* bin_file = fopen("words.dat", "rb");
  if (bin_file == NULL) {
      std::cout << "Not found!";
      exit(-1);
  }
  char *data[5];
  fread(&data,sizeof(char), 5, bin_file);
  std::cout << data;

  // ifstream file("words.dat", ios::binary);
  // vector<char> buffer((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());

  // vector<const char*> wordPtrs;
  // char* ptr = buffer.data();
  // while (ptr < buffer.data() + buffer.size()) {
  //   wordPtrs.push_back(ptr);
  //   ptr += strlen(ptr) + 1;
  // }
  //
  // init_trie(wordPtrs.data(), wordPtrs.size());
}

// static string trim(const string &s) {
//   size_t b = 0, e = s.size();
//   while (b < e && (s[b] == ' ' || s[b] == '\t' || s[b] == '\r' || s[b] == '\n'))
//     ++b;
//   while (e > b && (s[e - 1] == ' ' || s[e - 1] == '\t' || s[e - 1] == '\r' ||
//                    s[e - 1] == '\n'))
//     --e;
//   return s.substr(b, e - b);
// }

// static vector<string> load_words(const string &path) {
//   vector<string> words;
//   ifstream file(path);
//   string line;
//   if (!file.is_open()) {
//     cerr << "File opening error! " << path << "\n";
//     return words;
//   }
//
//   while (getline(file, line)) {
//     istringstream ss(line);
//     string w;
//     while (getline(ss, w, ',')) {
//       w = trim(w);
//       if (!w.empty()) {
//         words.push_back(w);
//       }
//     }
//   }
//   return words;
// }


int main(int argc, char *argv[]) {
    
  init_trie_from_bin();

  // string query;
  // cout << "Search word: ";
  // while (cin >> query) {
  //   cout << query << " -> " << (trie_contains(query.c_str()) ? "Yes" : "No")
  //        << "\n";
  //   cout << "Search word: ";
  // }

  return 0;
}
