// Simple test for weather minimums evaluation
const { WeatherMinimumsService } = require('./lib/services/weatherMinimums');

console.log('🧪 Testing Weather Minimums Evaluation\n');

// Test weather data with poor conditions
const testWeather = {
  location: 'Test Location',
  timestamp: new Date().toISOString(),
  visibility: 2.5, // Poor visibility (below VFR minimums)
  windSpeed: 25,   // High wind (exceeds most minimums)
  windGust: 35,
  temperature: 15,
  conditions: 'Light Rain',
  isSafe: true,
  violatedMinimums: []
};

// Test different training levels
const trainingLevels = ['student-pilot', 'private-pilot', 'instrument-rated'];

trainingLevels.forEach(level => {
  console.log(`\nTesting ${level} minimums:`);

  try {
    const evaluation = WeatherMinimumsService.evaluateWeatherSafety(testWeather, level);

    console.log(`  🛡️ Safe for flight: ${evaluation.isSafe ? 'YES' : 'NO'}`);

    if (!evaluation.isSafe) {
      console.log(`  ⚠️ Violations: ${evaluation.violatedMinimums.join(', ')}`);
      console.log(`  💡 Recommendations: ${evaluation.recommendations.join(', ')}`);
    }

    console.log(`  📊 Evaluated minimums:`);
    console.log(`    - Visibility: ${evaluation.evaluatedMinimums.visibility.actual}/${evaluation.evaluatedMinimums.visibility.required} miles`);
    console.log(`    - Ceiling: ${evaluation.evaluatedMinimums.ceiling.actual}/${evaluation.evaluatedMinimums.ceiling.required} ft`);
    console.log(`    - Wind: ${evaluation.evaluatedMinimums.windSpeed.actual}/${evaluation.evaluatedMinimums.windSpeed.required} kts`);
    console.log(`    - Crosswind: ${evaluation.evaluatedMinimums.crosswind.actual}/${evaluation.evaluatedMinimums.crosswind.required} kts`);

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
});

console.log('\n🏁 Weather Minimums Test Complete!');