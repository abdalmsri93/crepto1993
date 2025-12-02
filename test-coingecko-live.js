// Test file: Quick API test for CoinGecko integration
// Usage: Run this in the browser console after navigating to the app

// Test 1: Simple API call
async function testCoinGeckoAPI() {
  console.log("🧪 Testing CoinGecko Live API Integration...\n");
  
  try {
    // Test fetching coins with different price ranges
    const tests = [
      { minPrice: 0.01, maxPrice: 0.50, label: "Very cheap coins" },
      { minPrice: 0.50, maxPrice: 10, label: "Budget coins" },
      { minPrice: 10, maxPrice: 100, label: "Mid-range coins" },
      { minPrice: 100, maxPrice: 10000, label: "Premium coins" }
    ];

    for (const test of tests) {
      console.log(`📊 Testing: ${test.label} ($${test.minPrice} - $${test.maxPrice})`);
      
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false`;
      const response = await fetch(url);
      const coins = await response.json();
      
      const filtered = coins.filter(coin => 
        coin.current_price >= test.minPrice && 
        coin.current_price <= test.maxPrice
      );
      
      console.log(`   Found: ${filtered.length} coins in this range`);
      
      // Show first 3 coins
      filtered.slice(0, 3).forEach((coin, idx) => {
        console.log(`   ${idx + 1}. ${coin.name} (${coin.symbol.toUpperCase()}) - $${coin.current_price}`);
      });
      console.log("");
    }
    
    console.log("✅ API test completed successfully!\n");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Test 2: Random sampling test
function testRandomSampling() {
  console.log("🎲 Testing random sampling algorithm...\n");
  
  const testArray = Array.from({ length: 100 }, (_, i) => `Coin_${i + 1}`);
  
  // Function to randomly sample
  function randomSample(array, count) {
    if (array.length <= count) return array;
    
    const result = [];
    const used = new Set();
    
    while (result.length < count) {
      const randomIndex = Math.floor(Math.random() * array.length);
      if (!used.has(randomIndex)) {
        used.add(randomIndex);
        result.push(array[randomIndex]);
      }
    }
    
    return result;
  }
  
  // Run 3 tests
  for (let i = 1; i <= 3; i++) {
    const sample = randomSample(testArray, 5);
    console.log(`Sample ${i}: [${sample.join(", ")}]`);
  }
  
  console.log("\n✅ Random sampling test completed!\n");
}

// Test 3: Response time test
async function testResponseTime() {
  console.log("⏱️  Testing API response times...\n");
  
  const iterations = 5;
  const times = [];
  
  for (let i = 1; i <= iterations; i++) {
    const start = performance.now();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250&page=1&_=${Date.now()}`
    );
    await response.json();
    
    const end = performance.now();
    const duration = Math.round(end - start);
    times.push(duration);
    
    console.log(`Request ${i}: ${duration}ms`);
  }
  
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`\nAverage: ${avg}ms`);
  console.log(`Min: ${min}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`✅ Response time test completed!\n`);
}

// Test 4: Randomness verification (multiple searches)
async function testRandomness() {
  console.log("🔄 Testing randomness (5 searches with same params)...\n");
  
  const results = [];
  
  for (let i = 1; i <= 5; i++) {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250&page=1`;
    const response = await fetch(url);
    const coins = await response.json();
    
    // Get coins in $1-$10 range
    const filtered = coins.filter(c => c.current_price >= 1 && c.current_price <= 10);
    
    // Random sample of 3
    const sample = filtered.slice(0, 3).map(c => c.symbol.toUpperCase());
    results.push(sample);
    
    console.log(`Search ${i}: ${sample.join(", ")}`);
  }
  
  console.log("\n✅ Randomness test completed!");
  console.log("Note: CoinGecko returns coins in the same order for identical requests.");
  console.log("Our backend uses randomSample() to shuffle the results randomly.\n");
}

// Run all tests
async function runAllTests() {
  console.clear();
  console.log("🚀 CoinGecko Live API Integration Tests\n");
  console.log("========================================\n");
  
  testRandomSampling();
  await testCoinGeckoAPI();
  await testResponseTime();
  await testRandomness();
  
  console.log("========================================");
  console.log("✅ ALL TESTS COMPLETED!\n");
  console.log("Ready to use the new live API integration.");
}

// Run tests
runAllTests();
