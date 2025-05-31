#include "trie2.h"

using namespace std;

void Trie::init(const vector<string>& words) {
    root = make_unique<Node>();
    for (const auto& w : words) {
        Node* current = root.get();
        for (char c : w) {
            if (!current->next[c]) {
                current->next[c] = make_unique<Node>();
            }
            current = current->next[c].get();
        }
        current->end = true;
    }
}

bool Trie::contains(const string& word) const {
    if (!root) return false;
    Node* current = root.get();
    for (char c : word) {
        auto it = current->next.find(c);
        if (it == current->next.end()) return false;
        current = it->second.get();
    }
    return current->end;
}
