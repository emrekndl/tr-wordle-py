package main

import (
	"encoding/json"
	"fmt"
	"hash/fnv"
	"os"
	"strings"
)

type BloomFilter struct {
	bitset    []bool
	size      int
	hashFuncs []func(string) int
}

func NewBloomFilter(size int, numHashes int) *BloomFilter {
	hashFuncs := make([]func(string) int, numHashes)
	for i := 0; i < numHashes; i++ {
		hashFuncs[i] = func(seed int) func(string) int {
			return func(data string) int {
				h := fnv.New32a() // FNV-1a hash
				h.Write([]byte(fmt.Sprintf("%d%s", seed, data)))
				hash := int(h.Sum32()) % size
				return hash
			}
		}(i)
	}
	return &BloomFilter{
		bitset:    make([]bool, size),
		size:      size,
		hashFuncs: hashFuncs,
	}
}

func (bf *BloomFilter) Add(item string) {
	item = strings.ToLower(item)
	fmt.Printf("Adding item: %s\n", item)
	for i, hashFunc := range bf.hashFuncs {
		index := hashFunc(item)
		fmt.Printf("  Hash %d -> index: %d (byte: %d, bit: %d)\n",
			i, index, index/8, index%8)
		bf.bitset[index] = true
	}
}

func (bf *BloomFilter) Contains(item string) bool {
	item = strings.ToLower(item)
	fmt.Printf("Checking item: %s\n", item)
	for i, hashFunc := range bf.hashFuncs {
		index := hashFunc(item)
		fmt.Printf("  Hash %d -> index: %d (byte: %d, bit: %d) = %v\n",
			i, index, index/8, index%8, bf.bitset[index])
		if !bf.bitset[index] {
			return false
		}
	}
	return true
}

func (bf *BloomFilter) AddWordList(wordlist []string) {
	for _, word := range wordlist {
		bf.Add(strings.ToLower(word))
	}
}

// func convertToUint8(data []bool) uint8 {
// 	// convert bool to byte
// 	var result uint8
// 	for _, b := range data {
// 		result <<= 1
// 		if b {
// 			result |= 1
// 		}
// 	}
// 	return result
// }

func boolsToBytes(bools []bool) []byte {
	bytes := make([]byte, (len(bools)+7)/8)
	for i, b := range bools {
		if b {
			bytes[i/8] |= 1 << uint(i%8)
		}
	}
	return bytes
}

func (bf *BloomFilter) ExportToJSON(filename string, nbHashes int) error {
	exportData := map[string]interface{}{
		"type":     "BloomFilter",
		"size":     bf.size,
		"nbHashes": nbHashes,
		"bitset": map[string]interface{}{
			"type": "Uint8Array",
			"data": boolsToBytes(bf.bitset),
		},
	}

	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(exportData)
}
