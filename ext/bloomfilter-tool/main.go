package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
)

func readFile(filename string) []string {

	var wordList []string
	file, err := os.Open(filename)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		// fmt.Println(scanner.Text())
		wordList = append(wordList, scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	return wordList
}

func main() {

	//////////////
	// BloomFilter
	//////////////
	// n = ceil(m / (-k / log(1 - exp(log(p) / k))))
	// p = pow(1 - exp(-k / (m / n)), k)
	// m = ceil((n * log(p)) / log(1 / pow(2, log(2))));
	// k = round((m / n) * log(2));
	//
	// n = 5683		-- number of items
	// p = 0.001	-- probability of false positives
	// k = 10		-- number of hash functions
	// m = 81708	-- number of the bits in the filter(or a size with KB, KiB, MB, Mb, GiB...)

	m := 81708 // size
	k := 10    // hash func size
	bf := NewBloomFilter(m, k)

	// wordllist := readFile("../../data/wordlist.txt")

	bf.AddWordList(wordllist)

	bf.Add("bloom")
	bf.Add("filter")

	fmt.Println("türki", bf.Contains("türki"))
	fmt.Println("dünya", bf.Contains("dünya"))
	fmt.Println("defer", bf.Contains("defer"))
	fmt.Println("bloom", bf.Contains("bloom"))
	fmt.Println("xqdmw", bf.Contains("xqdmw"))
	fmt.Println("filter", bf.Contains("filer"))

	// err := bf.ExportToJSON("bloom_data.json", k)
	// if err != nil {
	// 	log.Fatal(err)
	// }
}
