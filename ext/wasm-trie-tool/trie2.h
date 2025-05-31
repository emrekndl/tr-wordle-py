#ifndef TRIE2_H
#define TRIE2_H

#include <string>
#include <vector>
#include <memory>
#include <unordered_map>

// Birden fazla kelimeyi doğrudan vector<string> ile alır
class Trie {
public:
    // Kelime listesini alıp trie ağacını kurar
    void init(const std::vector<std::string>& words);
    // Bir kelimenin içerilip içermediğini döner
    bool contains(const std::string& word) const;

private:
    struct Node {
        bool end = false;
        std::unordered_map<char, std::unique_ptr<Node>> next;
    };

    // Kök düğüm
    std::unique_ptr<Node> root;
};

#endif
