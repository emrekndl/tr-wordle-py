package main

import (
	"fmt"
	"hash/fnv"
)

type BloomFilter struct {
	bitset    []bool
	size      int
	hashFuncs []func(string) int
}

func NewBloomFilter(size int, numHashes int) *BloomFilter {
	hashFuncs := make([]func(string) int, numHashes)
	// for i := 0; i < numHashes; i++ {
	for i := range numHashes {
		hashFuncs[i] = func(seed int) func(string) int {
			return func(data string) int {
				h := fnv.New32()
				h.Write(fmt.Appendf(nil, "%d%s", seed, data))
				// h.Write([]byte(fmt.Sprintf("%d%s", seed, data)))

				return int(h.Sum32()) % size

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
	for _, hashFunc := range bf.hashFuncs {
		index := hashFunc(item)
		bf.bitset[index] = true
	}
}

func (bf *BloomFilter) Contains(item string) bool {
	for _, hashFunc := range bf.hashFuncs {
		index := hashFunc(item)
		if !bf.bitset[index] {
			return false
		}
	}
	return true
}

func main() {
	bf := NewBloomFilter(5701, 10)

	bf.Add("TÜRK")
	bf.Add("Kurt")

	fmt.Println("TÜRK", bf.Contains("TÜRK"))
	fmt.Println("Merhaba", bf.Contains("Merhaba"))
	fmt.Println("Dünya", bf.Contains("Dünya"))
}
