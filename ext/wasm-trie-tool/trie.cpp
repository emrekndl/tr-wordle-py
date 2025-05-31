#include "trie.h"
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
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

static vector<string> load_words(const string &path) {
  vector<string> words;
  ifstream file(path);
  string line;

  while (getline(file, line)) {
    istringstream ss(line);
    string w;
    while (getline(ss, w, ',')) {
      if (!w.empty()) {
        words.push_back(w);
      }
    }
  }
  return words;
}

int main(int argc, char *argv[]) {
  if (argc < 2) {
    cerr << "Usage: " << argv[0] << " word_list.csv\n";
    return 1;
  }

  auto vec = load_words(argv[1]);
  vector<const char *> c_words;
  c_words.reserve(vec.size());

  for (auto &w : vec) {
    c_words.push_back(w.c_str());
  }

  init_trie(c_words.data(), int(c_words.size()));

  string query;
  cout << "Search word: ";
  while (cin >> query) {
    cout << query << " -> " << (trie_contains(query.c_str()) ? "Yes" : "No")
         << "\n";
  }

  return 0;
}
