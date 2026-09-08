/**
 * Levels Campaign Structure (50 Progressive Levels)
 * From beginner mental shortcuts to 50th grandmaster championship.
 * Includes 5 Epic Boss Battles: Levels 10, 20, 30, 40, and 50.
 */

export const LEVELS_DATA = [
  {
    "level": 1,
    "title": "Friendly Numbers",
    "subtitle": "Rounding to Nearest 10",
    "description": "Learn to round numbers and borrow to make quick 10s.",
    "trickIds": [
      "friendly_numbers"
    ],
    "questionCount": 8,
    "timePerQuestion": 15,
    "passingScore": 5,
    "starsThreshold": {
      "one": 5,
      "two": 7,
      "three": 8
    },
    "difficulty": "Novice"
  },
  {
    "level": 2,
    "title": "Complement to 100",
    "subtitle": "Vedic 100 - N",
    "description": "Subtract every digit from 9, last digit from 10.",
    "trickIds": [
      "comp_100"
    ],
    "questionCount": 8,
    "timePerQuestion": 15,
    "passingScore": 5,
    "starsThreshold": {
      "one": 5,
      "two": 7,
      "three": 8
    },
    "difficulty": "Novice"
  },
  {
    "level": 3,
    "title": "Multiplication by 5",
    "subtitle": "Halve & Multiply by 10",
    "description": "Cut the number in half and add a zero.",
    "trickIds": [
      "mult_ending_5"
    ],
    "questionCount": 8,
    "timePerQuestion": 14,
    "passingScore": 5,
    "starsThreshold": {
      "one": 5,
      "two": 7,
      "three": 8
    },
    "difficulty": "Novice"
  },
  {
    "level": 4,
    "title": "Division by 4",
    "subtitle": "Halve Twice",
    "description": "Divide by 2, then divide by 2 again.",
    "trickIds": [
      "div_4"
    ],
    "questionCount": 8,
    "timePerQuestion": 14,
    "passingScore": 5,
    "starsThreshold": {
      "one": 5,
      "two": 7,
      "three": 8
    },
    "difficulty": "Novice"
  },
  {
    "level": 5,
    "title": "Division by 5",
    "subtitle": "Double & Divide by 10",
    "description": "Double the number and shift decimal point left.",
    "trickIds": [
      "div_5"
    ],
    "questionCount": 10,
    "timePerQuestion": 14,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Novice"
  },
  {
    "level": 6,
    "title": "Multiplication by 11",
    "subtitle": "Split and Sum Rule",
    "description": "Vedic magic trick: put the sum of digits in the middle.",
    "trickIds": [
      "mult_11"
    ],
    "questionCount": 10,
    "timePerQuestion": 14,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Novice"
  },
  {
    "level": 7,
    "title": "Squares Ending in 5",
    "subtitle": "Tens × (Tens + 1) + 25",
    "description": "Square 15², 25², 35², 45²... in under 2 seconds!",
    "trickIds": [
      "square_ending_5"
    ],
    "questionCount": 10,
    "timePerQuestion": 13,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Novice"
  },
  {
    "level": 8,
    "title": "Divide by 50",
    "subtitle": "Double & Divide by 100",
    "description": "Double the number and drop two zeros.",
    "trickIds": [
      "div_50"
    ],
    "questionCount": 10,
    "timePerQuestion": 13,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Novice"
  },
  {
    "level": 9,
    "title": "Twin Multiplier ×101",
    "subtitle": "Repeat the Digits",
    "description": "43 × 101 = 4343. Instant 2-digit repetition.",
    "trickIds": [
      "mult_101"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Novice"
  },
  {
    "level": 10,
    "title": "Speed Mix: Novice Exam",
    "subtitle": "Foundations Milestone",
    "description": "Test covering Complements, ×5, ÷4, ÷5, ×11, and Ending-5 Squares.",
    "trickIds": [
      "friendly_numbers",
      "comp_100",
      "mult_ending_5",
      "div_4",
      "div_5",
      "mult_11",
      "square_ending_5"
    ],
    "questionCount": 12,
    "timePerQuestion": 12,
    "passingScore": 8,
    "starsThreshold": {
      "one": 8,
      "two": 10,
      "three": 12
    },
    "difficulty": "Novice",
    "isBoss": true,
    "bossName": "Calculon the Stone Golem",
    "bossTitle": "Novice Gatekeeper",
    "bossAvatar": "🗿",
    "bossHp": 12,
    "bossCoinBounty": 250,
    "bossColor": "#84cc16"
  },
  {
    "level": 11,
    "title": "Multiplication by 9",
    "subtitle": "Base 10 Subtraction",
    "description": "Multiply by 10 and subtract the original number.",
    "trickIds": [
      "mult_9"
    ],
    "questionCount": 10,
    "timePerQuestion": 13,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 12,
    "title": "Percentages: 10% & 1%",
    "subtitle": "Building Blocks",
    "description": "Find 10% and 1% by shifting decimal points.",
    "trickIds": [
      "pct_10_rule"
    ],
    "questionCount": 10,
    "timePerQuestion": 13,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 13,
    "title": "Multiplication by 15",
    "subtitle": "Number + Half × 10",
    "description": "Add half of the number to itself, then multiply by 10.",
    "trickIds": [
      "mult_15"
    ],
    "questionCount": 10,
    "timePerQuestion": 13,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 14,
    "title": "Complement to 1000",
    "subtitle": "3-Digit Vedic Subtraction",
    "description": "1000 - ABC: all from 9, last from 10.",
    "trickIds": [
      "comp_1000"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 15,
    "title": "Multiply by 25",
    "subtitle": "Quarter and Multiply by 100",
    "description": "Divide by 4 and attach two zeros.",
    "trickIds": [
      "mult_25"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 16,
    "title": "Double and Halve I",
    "subtitle": "Even × 15 / 35",
    "description": "Cut the even number in half and double the 5 number.",
    "trickIds": [
      "mult_double_halve"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 17,
    "title": "Division by 25",
    "subtitle": "Multiply by 4 & ÷100",
    "description": "Double the number twice, then divide by 100.",
    "trickIds": [
      "div_25"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 18,
    "title": "Squares Mastery: Ending in 5",
    "subtitle": "Speed Drill",
    "description": "Master fast squares from 15² to 95² under pressure.",
    "trickIds": [
      "square_ending_5"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 19,
    "title": "Multiply by 99",
    "subtitle": "Base 100 Subtraction",
    "description": "Multiply by 100 and subtract the number once.",
    "trickIds": [
      "mult_9"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Apprentice"
  },
  {
    "level": 20,
    "title": "Speed Mix: Apprentice Exam",
    "subtitle": "Phase 2 Milestone",
    "description": "Fast combination of ×15, ×25, ÷25, 1000 Complements, and ×99.",
    "trickIds": [
      "mult_15",
      "mult_25",
      "div_25",
      "comp_1000",
      "mult_9",
      "mult_double_halve"
    ],
    "questionCount": 12,
    "timePerQuestion": 12,
    "passingScore": 8,
    "starsThreshold": {
      "one": 8,
      "two": 10,
      "three": 12
    },
    "difficulty": "Apprentice",
    "isBoss": true,
    "bossName": "Vedic Dragon Hydra",
    "bossTitle": "Apprentice Overlord",
    "bossAvatar": "🐉",
    "bossHp": 14,
    "bossCoinBounty": 500,
    "bossColor": "#f97316"
  },
  {
    "level": 21,
    "title": "Reversible Percentages",
    "subtitle": "X% of Y = Y% of X",
    "description": "Swap percentage and base for lightning calculation.",
    "trickIds": [
      "pct_reversible"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 22,
    "title": "Midpoints Product (d=1)",
    "subtitle": "M² - 1 Shortcut",
    "description": "19 × 21 = 20² - 1 = 399. Consecutive odd/even numbers.",
    "trickIds": [
      "diff_of_squares"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 23,
    "title": "Units Sum to 10 (Part 1)",
    "subtitle": "Vedic Sutra Rule",
    "description": "Same tens, units sum to 10: T × (T+1) and U1 × U2.",
    "trickIds": [
      "mult_same_tens_sum_10"
    ],
    "questionCount": 10,
    "timePerQuestion": 12,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 24,
    "title": "Double and Halve II",
    "subtitle": "Higher Even Numbers",
    "description": "24 × 35 = 12 × 70 = 840. Effortless 2-digit multiplication.",
    "trickIds": [
      "mult_double_halve"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 25,
    "title": "Midpoints Product (d=2)",
    "subtitle": "M² - 4 Shortcut",
    "description": "28 × 32 = 30² - 4 = 896.",
    "trickIds": [
      "diff_of_squares"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 26,
    "title": "Fast Division Trio",
    "subtitle": "÷4, ÷5, ÷25 Mixed",
    "description": "Select the right doubling/halving shortcut instantly.",
    "trickIds": [
      "div_4",
      "div_5",
      "div_25"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 27,
    "title": "Vedic ×11 & ×101 Speed",
    "subtitle": "Digit Expansion",
    "description": "Combine split-and-sum with double repetition.",
    "trickIds": [
      "mult_11",
      "mult_101"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 28,
    "title": "Units Sum to 10 (Part 2)",
    "subtitle": "Higher Tens",
    "description": "64 × 66, 73 × 77, 82 × 88 at top speed.",
    "trickIds": [
      "mult_same_tens_sum_10"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 29,
    "title": "Midpoints Product (d=3)",
    "subtitle": "M² - 9 Shortcut",
    "description": "37 × 43 = 40² - 9 = 1591.",
    "trickIds": [
      "diff_of_squares"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Intermediate"
  },
  {
    "level": 30,
    "title": "Speed Mix: Intermediate Exam",
    "subtitle": "Phase 3 Milestone",
    "description": "Comprehensive test of Vedic Sutras, Midpoints, and Percentages.",
    "trickIds": [
      "pct_reversible",
      "diff_of_squares",
      "mult_same_tens_sum_10",
      "mult_double_halve",
      "div_25"
    ],
    "questionCount": 12,
    "timePerQuestion": 11,
    "passingScore": 8,
    "starsThreshold": {
      "one": 8,
      "two": 10,
      "three": 12
    },
    "difficulty": "Intermediate",
    "isBoss": true,
    "bossName": "Cyber Math Minotaur",
    "bossTitle": "Intermediate Titan",
    "bossAvatar": "🤖",
    "bossHp": 15,
    "bossCoinBounty": 750,
    "bossColor": "#06b6d4"
  },
  {
    "level": 31,
    "title": "Squares Near 50 (Above)",
    "subtitle": "51² to 56²",
    "description": "25 + d & d² (e.g. 53²: 25+3=28, 3²=09 -> 2809).",
    "trickIds": [
      "square_near_50"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 32,
    "title": "Squares Near 50 (Below)",
    "subtitle": "46² to 49²",
    "description": "25 - d & d² (e.g. 48²: 25-2=23, 2²=04 -> 2304).",
    "trickIds": [
      "square_near_50"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 33,
    "title": "Squares Near 100 (Below)",
    "subtitle": "92² to 99²",
    "description": "N - d & d² (e.g. 96²: 96-4=92, 4²=16 -> 9216).",
    "trickIds": [
      "square_near_100"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 34,
    "title": "Squares Near 100 (Above)",
    "subtitle": "102² to 107²",
    "description": "N + d & d² (e.g. 104²: 104+4=108, 4²=16 -> 10816).",
    "trickIds": [
      "square_near_100"
    ],
    "questionCount": 10,
    "timePerQuestion": 11,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 35,
    "title": "Squares Clash: 50 vs 100",
    "subtitle": "Base Switching",
    "description": "Rapid identification of whether to use Base 50 or Base 100.",
    "trickIds": [
      "square_near_50",
      "square_near_100"
    ],
    "questionCount": 10,
    "timePerQuestion": 10,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 36,
    "title": "Vedic Units Sum 10 Sprint",
    "subtitle": "High Velocity",
    "description": "Rapid solve of 35×35, 52×58, 71×79 in seconds.",
    "trickIds": [
      "mult_same_tens_sum_10",
      "square_ending_5"
    ],
    "questionCount": 10,
    "timePerQuestion": 10,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 37,
    "title": "Advanced Multiply: ×15 & ×25",
    "subtitle": "Mental Quarter & Halving",
    "description": "Alternate between ×15 and ×25 at lightning pace.",
    "trickIds": [
      "mult_15",
      "mult_25"
    ],
    "questionCount": 10,
    "timePerQuestion": 10,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 38,
    "title": "Complements Blitz (100 & 1000)",
    "subtitle": "Instant Subtraction",
    "description": "All from 9, last from 10 at high velocity.",
    "trickIds": [
      "comp_100",
      "comp_1000"
    ],
    "questionCount": 10,
    "timePerQuestion": 10,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 39,
    "title": "Percentages Precision",
    "subtitle": "Reversible & Decimals",
    "description": "36% of 50, 50% of 74, 20% of 480 under time limit.",
    "trickIds": [
      "pct_10_rule",
      "pct_reversible"
    ],
    "questionCount": 10,
    "timePerQuestion": 10,
    "passingScore": 7,
    "starsThreshold": {
      "one": 7,
      "two": 9,
      "three": 10
    },
    "difficulty": "Advanced"
  },
  {
    "level": 40,
    "title": "Speed Mix: Advanced Exam",
    "subtitle": "Phase 4 Milestone",
    "description": "Squares near 50/100, Midpoints, and Vedic Sutras combined.",
    "trickIds": [
      "square_near_50",
      "square_near_100",
      "diff_of_squares",
      "mult_same_tens_sum_10",
      "mult_15"
    ],
    "questionCount": 14,
    "timePerQuestion": 10,
    "passingScore": 10,
    "starsThreshold": {
      "one": 10,
      "two": 12,
      "three": 14
    },
    "difficulty": "Advanced",
    "isBoss": true,
    "bossName": "Archmage Number-Lord",
    "bossTitle": "Advanced Sorcerer",
    "bossAvatar": "🧙‍♂️",
    "bossHp": 16,
    "bossCoinBounty": 1000,
    "bossColor": "#8b5cf6"
  },
  {
    "level": 41,
    "title": "Grandmaster: ×11 & ×101 Rush",
    "subtitle": "Sub-9 Second Speedrun",
    "description": "Lightning digit manipulation under 9 seconds per question.",
    "trickIds": [
      "mult_11",
      "mult_101"
    ],
    "questionCount": 12,
    "timePerQuestion": 9,
    "passingScore": 9,
    "starsThreshold": {
      "one": 9,
      "two": 11,
      "three": 12
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 42,
    "title": "Grandmaster: Squares Arena",
    "subtitle": "Ending 5, Near 50, Near 100",
    "description": "Every square shortcut combined with zero hesitation.",
    "trickIds": [
      "square_ending_5",
      "square_near_50",
      "square_near_100"
    ],
    "questionCount": 12,
    "timePerQuestion": 9,
    "passingScore": 9,
    "starsThreshold": {
      "one": 9,
      "two": 11,
      "three": 12
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 43,
    "title": "Grandmaster: Division Rush",
    "subtitle": "÷4, ÷5, ÷25, ÷50",
    "description": "Rapid-fire mental division at grandmaster speed.",
    "trickIds": [
      "div_4",
      "div_5",
      "div_25",
      "div_50"
    ],
    "questionCount": 12,
    "timePerQuestion": 9,
    "passingScore": 9,
    "starsThreshold": {
      "one": 9,
      "two": 11,
      "three": 12
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 44,
    "title": "Grandmaster: Vedic Multipliers",
    "subtitle": "Units Sum 10 & Midpoints",
    "description": "Vedic Sutra calculation in 8.5 seconds.",
    "trickIds": [
      "mult_same_tens_sum_10",
      "diff_of_squares",
      "mult_double_halve"
    ],
    "questionCount": 12,
    "timePerQuestion": 9,
    "passingScore": 9,
    "starsThreshold": {
      "one": 9,
      "two": 11,
      "three": 12
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 45,
    "title": "Grandmaster: Percentages Vortex",
    "subtitle": "Instant Swaps & Rules",
    "description": "Master fast percentages with zero scratch paper.",
    "trickIds": [
      "pct_10_rule",
      "pct_reversible"
    ],
    "questionCount": 12,
    "timePerQuestion": 8,
    "passingScore": 9,
    "starsThreshold": {
      "one": 9,
      "two": 11,
      "three": 12
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 46,
    "title": "Grandmaster: High-Speed Subtraction",
    "subtitle": "100 & 1000 Vedic Complements",
    "description": "Lightning subtraction in 8 seconds flat.",
    "trickIds": [
      "comp_100",
      "comp_1000",
      "friendly_numbers"
    ],
    "questionCount": 12,
    "timePerQuestion": 8,
    "passingScore": 9,
    "starsThreshold": {
      "one": 9,
      "two": 11,
      "three": 12
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 47,
    "title": "Grandmaster: Power Mix A",
    "subtitle": "8-Second Super Brain",
    "description": "Multiplication, Squares, and Division under extreme countdown.",
    "trickIds": [
      "mult_25",
      "mult_15",
      "square_near_50",
      "div_25",
      "mult_11"
    ],
    "questionCount": 14,
    "timePerQuestion": 8,
    "passingScore": 11,
    "starsThreshold": {
      "one": 11,
      "two": 13,
      "three": 14
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 48,
    "title": "Grandmaster: Power Mix B",
    "subtitle": "Vedic Master Speedrun",
    "description": "Squares near 100, Midpoints, Reversible % under 8 seconds.",
    "trickIds": [
      "square_near_100",
      "diff_of_squares",
      "pct_reversible",
      "mult_same_tens_sum_10"
    ],
    "questionCount": 14,
    "timePerQuestion": 8,
    "passingScore": 11,
    "starsThreshold": {
      "one": 11,
      "two": 13,
      "three": 14
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 49,
    "title": "Penultimate Crucible",
    "subtitle": "All 20+ Tricks Random Fire",
    "description": "The hardest randomized test before the championship.",
    "trickIds": [
      "mult_11",
      "mult_ending_5",
      "mult_25",
      "mult_9",
      "mult_15",
      "mult_101",
      "mult_double_halve",
      "mult_same_tens_sum_10",
      "square_ending_5",
      "square_near_50",
      "square_near_100",
      "diff_of_squares",
      "div_4",
      "div_5",
      "div_25",
      "div_50",
      "pct_10_rule",
      "pct_reversible",
      "comp_100",
      "comp_1000"
    ],
    "questionCount": 15,
    "timePerQuestion": 8,
    "passingScore": 12,
    "starsThreshold": {
      "one": 12,
      "two": 14,
      "three": 15
    },
    "difficulty": "Grandmaster"
  },
  {
    "level": 50,
    "title": "Grandmaster Championship 👑",
    "subtitle": "The Ultimate 50th Level Finale",
    "description": "Earn 3 stars on Level 50 to claim the title of Supreme Mental Calculator!",
    "trickIds": [
      "mult_11",
      "mult_ending_5",
      "mult_25",
      "mult_9",
      "mult_15",
      "mult_101",
      "mult_double_halve",
      "mult_same_tens_sum_10",
      "square_ending_5",
      "square_near_50",
      "square_near_100",
      "diff_of_squares",
      "div_4",
      "div_5",
      "div_25",
      "div_50",
      "pct_10_rule",
      "pct_reversible",
      "comp_100",
      "comp_1000"
    ],
    "questionCount": 20,
    "timePerQuestion": 7.5,
    "passingScore": 16,
    "starsThreshold": {
      "one": 16,
      "two": 18,
      "three": 20
    },
    "difficulty": "Grandmaster",
    "isBoss": true,
    "bossName": "Infinite Ramanujan Titan",
    "bossTitle": "The Supreme Grandmaster 👑",
    "bossAvatar": "👑",
    "bossHp": 20,
    "bossCoinBounty": 2500,
    "bossColor": "#ec4899"
  }
];
