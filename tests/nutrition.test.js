/**
 * Mock file for NutriSense business logic tests
 * In a real environment, you would extract the pure logic from app.js 
 * into a separate utility file to make it easily testable.
 * For this prototype, we're demonstrating the testing structure.
 */

// Simulated business logic functions (normally imported from a utils.js file)
function calculateDailyCalories(age, gender, activityLevel, goal) {
  let baseTarget = gender === 'male' ? 2500 : 2000;
  if (goal === 'Lose Weight') baseTarget -= 500;
  if (goal === 'Build Muscle') baseTarget += 300;
  // Simplified activity multiplier
  if (activityLevel > 3) baseTarget += 200;
  if (activityLevel < 3) baseTarget -= 200;
  return baseTarget;
}

function getHealthScoreColor(score) {
  if (score >= 8) return 'green';
  if (score >= 5) return 'amber';
  return 'red';
}

function calculateMacroPercentages(protein, carbs, fat) {
  const total = protein + carbs + fat || 1;
  return {
    proteinPct: Math.round((protein / total) * 100),
    carbsPct: Math.round((carbs / total) * 100),
    fatPct: Math.round((fat / total) * 100)
  };
}

describe("NutriSense Core Business Logic", () => {

  describe("Calorie Calculation", () => {
    test("calculates male baseline correctly", () => {
      expect(calculateDailyCalories(25, 'male', 3, 'Eat Healthier')).toBe(2500);
    });

    test("applies weight loss deficit", () => {
      expect(calculateDailyCalories(30, 'female', 3, 'Lose Weight')).toBe(1500);
    });

    test("applies muscle building surplus", () => {
      expect(calculateDailyCalories(22, 'male', 4, 'Build Muscle')).toBe(3000); // 2500 + 300 + 200
    });
  });

  describe("Health Score Logic", () => {
    test("score of 9 returns green", () => {
      expect(getHealthScoreColor(9)).toBe('green');
    });

    test("score of 6 returns amber", () => {
      expect(getHealthScoreColor(6)).toBe('amber');
    });

    test("score of 3 returns red", () => {
      expect(getHealthScoreColor(3)).toBe('red');
    });
  });

  describe("Macro Percentages", () => {
    test("calculates even split correctly", () => {
      const result = calculateMacroPercentages(30, 30, 30);
      expect(result.proteinPct).toBe(33); // 30/90
      expect(result.carbsPct).toBe(33);
      expect(result.fatPct).toBe(33);
    });

    test("handles zero values to prevent division by zero", () => {
      const result = calculateMacroPercentages(0, 0, 0);
      expect(result.proteinPct).toBe(0);
      expect(result.carbsPct).toBe(0);
      expect(result.fatPct).toBe(0);
    });
  });

});
