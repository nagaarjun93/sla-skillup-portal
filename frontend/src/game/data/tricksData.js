/**
 * Mental Math Tricks Knowledge Base
 * 15+ rich shortcut tricks across Multiplication, Division, Squares, Percentages, and Addition/Subtraction.
 */

export const TRICK_CATEGORIES = [
  'All',
  'Multiplication',
  'Division',
  'Squares & Cubes',
  'Percentages',
  'Addition & Subtraction',
];

export const TRICKS_DATA = [
  // --- MULTIPLICATION ---
  {
    id: 'mult_11',
    title: 'Multiply by 11',
    category: 'Multiplication',
    badge: '×11',
    difficulty: 'Easy',
    summary: 'Split the digits and insert their sum in the center.',
    rule: 'To multiply any 2-digit number by 11, add the two digits together and put the result between them. If the sum is 10 or more, carry over 1 to the left digit.',
    steps: [
      'Take the first digit as the hundreds place.',
      'Add the two digits together for the tens place.',
      'Take the second digit as the units place.',
      'If the sum >= 10, carry 1 to the first digit.',
    ],
    example: {
      question: '53 × 11',
      steps: ['First digit: 5', 'Middle digit: 5 + 3 = 8', 'Last digit: 3', 'Result: 583'],
      answer: 583,
    },
    generate: () => {
      const num = Math.floor(Math.random() * 80) + 12; // 12 to 91
      return {
        prompt: `${num} × 11`,
        num1: num,
        num2: 11,
        op: '×',
        answer: num * 11,
        hint: `Split ${num}: ${Math.floor(num / 10)} and ${num % 10}. Add them (${Math.floor(num / 10)} + ${num % 10} = ${Math.floor(num / 10) + (num % 10)}) and place in middle!`,
      };
    },
  },

  {
    id: 'mult_ending_5',
    title: 'Multiply by 5',
    category: 'Multiplication',
    badge: '×5',
    difficulty: 'Easy',
    summary: 'Multiply by 10 and divide by 2 (or halve then multiply by 10).',
    rule: 'Since 5 = 10 ÷ 2, simply cut the number in half and append 0 (or multiply by 10). If the number is odd, halve it with .5 and drop the decimal point.',
    steps: [
      'Divide the number by 2.',
      'Multiply the result by 10.',
    ],
    example: {
      question: '68 × 5',
      steps: ['Halve 68 = 34', 'Multiply by 10 = 340', 'Result: 340'],
      answer: 340,
    },
    generate: () => {
      const num = Math.floor(Math.random() * 90) + 12;
      return {
        prompt: `${num} × 5`,
        num1: num,
        num2: 5,
        op: '×',
        answer: num * 5,
        hint: `Halve ${num} (${num / 2}) then multiply by 10!`,
      };
    },
  },

  {
    id: 'mult_25',
    title: 'Multiply by 25',
    category: 'Multiplication',
    badge: '×25',
    difficulty: 'Medium',
    summary: 'Divide by 4 and multiply by 100.',
    rule: 'Because 25 = 100 ÷ 4, divide the number by 4 (halve it twice) and add two zeros (or shift the decimal two places right).',
    steps: [
      'Divide the number by 4 (halve it twice).',
      'Multiply by 100 (add two zeros or place remainder as 25, 50, 75).',
    ],
    example: {
      question: '48 × 25',
      steps: ['48 ÷ 4 = 12', '12 × 100 = 1200', 'Result: 1200'],
      answer: 1200,
    },
    generate: () => {
      const mults = [12, 16, 20, 24, 28, 32, 36, 44, 48, 52, 64, 72, 84, 96, 14, 18, 22, 26];
      const num = mults[Math.floor(Math.random() * mults.length)];
      return {
        prompt: `${num} × 25`,
        num1: num,
        num2: 25,
        op: '×',
        answer: num * 25,
        hint: `Divide ${num} by 4 (${num / 4}) then multiply by 100!`,
      };
    },
  },

  {
    id: 'mult_9',
    title: 'Multiply by 9 or 99',
    category: 'Multiplication',
    badge: '×9/99',
    difficulty: 'Medium',
    summary: 'Multiply by 10 (or 100) and subtract the original number.',
    rule: '9 = 10 - 1 and 99 = 100 - 1. Multiply by 10 or 100 (just add 0 or 00), then subtract the original number.',
    steps: [
      'For ×9: Add 0, then subtract original number (N × 10 - N).',
      'For ×99: Add 00, then subtract original number (N × 100 - N).',
    ],
    example: {
      question: '46 × 9',
      steps: ['46 × 10 = 460', '460 - 46 = 414', 'Result: 414'],
      answer: 414,
    },
    generate: () => {
      const is99 = Math.random() > 0.6;
      if (is99) {
        const num = Math.floor(Math.random() * 40) + 11;
        return {
          prompt: `${num} × 99`,
          num1: num,
          num2: 99,
          op: '×',
          answer: num * 99,
          hint: `${num} × 100 = ${num * 100}. Now subtract ${num} (${num * 100} - ${num})!`,
        };
      } else {
        const num = Math.floor(Math.random() * 70) + 12;
        return {
          prompt: `${num} × 9`,
          num1: num,
          num2: 9,
          op: '×',
          answer: num * 9,
          hint: `${num} × 10 = ${num * 10}. Now subtract ${num} (${num * 10} - ${num})!`,
        };
      }
    },
  },

  {
    id: 'mult_double_halve',
    title: 'Double and Halve',
    category: 'Multiplication',
    badge: '2×/½',
    difficulty: 'Medium',
    summary: 'Double one number and halve the other to simplify.',
    rule: 'When multiplying an even number with a number ending in 5 (like 15, 25, 35, 45), double the 5-number to make it a multiple of 10, and cut the even number in half.',
    steps: [
      'Double the number ending in 5 (e.g. 15 × 2 = 30).',
      'Halve the even number (e.g. 24 ÷ 2 = 12).',
      'Multiply the simplified pair (12 × 30 = 360).',
    ],
    example: {
      question: '16 × 15',
      steps: ['Halve 16 -> 8', 'Double 15 -> 30', '8 × 30 = 240', 'Result: 240'],
      answer: 240,
    },
    generate: () => {
      const evens = [12, 14, 16, 18, 22, 24, 26, 28, 32];
      const fives = [15, 35, 45];
      const even = evens[Math.floor(Math.random() * evens.length)];
      const five = fives[Math.floor(Math.random() * fives.length)];
      return {
        prompt: `${even} × ${five}`,
        num1: even,
        num2: five,
        op: '×',
        answer: even * five,
        hint: `Halve ${even} (= ${even / 2}) and double ${five} (= ${five * 2}). Then calculate ${even / 2} × ${five * 2}!`,
      };
    },
  },

  // --- SQUARES & CUBES ---
  {
    id: 'square_ending_5',
    title: 'Square Numbers Ending in 5',
    category: 'Squares & Cubes',
    badge: 'N5²',
    difficulty: 'Easy',
    summary: 'Multiply the tens digit by (tens + 1) and attach 25.',
    rule: 'Any number ending in 5 when squared always ends in 25. The preceding digits are simply the tens digit N multiplied by (N + 1).',
    steps: [
      'Take the tens digit N.',
      'Multiply N by (N + 1).',
      'Attach 25 to the end.',
    ],
    example: {
      question: '65²',
      steps: ['Tens digit: 6', '6 × (6 + 1) = 6 × 7 = 42', 'Attach 25: 4225', 'Result: 4225'],
      answer: 4225,
    },
    generate: () => {
      const candidates = [15, 25, 35, 45, 55, 65, 75, 85, 95];
      const num = candidates[Math.floor(Math.random() * candidates.length)];
      const tens = Math.floor(num / 10);
      return {
        prompt: `${num}²`,
        num1: num,
        num2: num,
        op: '²',
        answer: num * num,
        hint: `Tens digit is ${tens}. Compute ${tens} × ${tens + 1} = ${tens * (tens + 1)}, then attach 25 at the end!`,
      };
    },
  },

  {
    id: 'square_near_50',
    title: 'Squares Near 50',
    category: 'Squares & Cubes',
    badge: '50±d²',
    difficulty: 'Hard',
    summary: 'Add/subtract difference from 25, then attach difference squared.',
    rule: 'For a number N close to 50 with difference d = N - 50: The first two digits are 25 + d. The last two digits are d² (formatted with 2 digits).',
    steps: [
      'Find difference d = N - 50.',
      'First two digits = 25 + d.',
      'Last two digits = d² (e.g. 3² = 09).',
    ],
    example: {
      question: '53²',
      steps: ['d = 53 - 50 = +3', 'First part: 25 + 3 = 28', 'Second part: 3² = 09', 'Result: 2809'],
      answer: 2809,
    },
    generate: () => {
      const nums = [46, 47, 48, 49, 51, 52, 53, 54, 56];
      const num = nums[Math.floor(Math.random() * nums.length)];
      const d = num - 50;
      return {
        prompt: `${num}²`,
        num1: num,
        num2: num,
        op: '²',
        answer: num * num,
        hint: `Diff from 50 is ${d}. First part = 25 + (${d}) = ${25 + d}. Second part = ${Math.abs(d)}² = ${String(d * d).padStart(2, '0')}.`,
      };
    },
  },

  {
    id: 'diff_of_squares',
    title: 'Product with Common Midpoint',
    category: 'Squares & Cubes',
    badge: 'a² - b²',
    difficulty: 'Medium',
    summary: '(M - d) × (M + d) = M² - d²',
    rule: 'When two numbers have the same midpoint M, their product is the midpoint squared minus the difference squared: (M - d)(M + d) = M² - d².',
    steps: [
      'Find the midpoint M between the two numbers.',
      'Find the difference d = number - M.',
      'Calculate M² - d².',
    ],
    example: {
      question: '28 × 32',
      steps: ['Midpoint M = 30, distance d = 2', '30² - 2² = 900 - 4 = 896', 'Result: 896'],
      answer: 896,
    },
    generate: () => {
      const midpoints = [20, 30, 40, 50, 60];
      const M = midpoints[Math.floor(Math.random() * midpoints.length)];
      const d = Math.floor(Math.random() * 3) + 1;
      const num1 = M - d;
      const num2 = M + d;
      return {
        prompt: `${num1} × ${num2}`,
        num1,
        num2,
        op: '×',
        answer: num1 * num2,
        hint: `Midpoint is ${M} with distance ±${d}. Calculate ${M}² - ${d}² = ${M * M} - ${d * d}!`,
      };
    },
  },

  // --- DIVISION ---
  {
    id: 'div_5',
    title: 'Divide by 5',
    category: 'Division',
    badge: '÷5',
    difficulty: 'Easy',
    summary: 'Double the number and divide by 10 (shift decimal left).',
    rule: 'Since dividing by 5 is equivalent to dividing by 10 and multiplying by 2: Double the number, then divide by 10 (or move the decimal 1 position to the left).',
    steps: [
      'Multiply the number by 2 (double it).',
      'Divide by 10 (drop the zero or shift decimal left).',
    ],
    example: {
      question: '145 ÷ 5',
      steps: ['145 × 2 = 290', '290 ÷ 10 = 29', 'Result: 29'],
      answer: 29,
    },
    generate: () => {
      const factor = Math.floor(Math.random() * 70) + 14;
      const num = factor * 5;
      return {
        prompt: `${num} ÷ 5`,
        num1: num,
        num2: 5,
        op: '÷',
        answer: factor,
        hint: `Double ${num} (= ${num * 2}) then divide by 10!`,
      };
    },
  },

  {
    id: 'div_25',
    title: 'Divide by 25',
    category: 'Division',
    badge: '÷25',
    difficulty: 'Medium',
    summary: 'Multiply by 4 and divide by 100.',
    rule: 'Dividing by 25 is multiplying by 4 and dividing by 100. Double the number twice, then shift decimal two places left.',
    steps: [
      'Multiply by 4 (double twice).',
      'Divide by 100.',
    ],
    example: {
      question: '325 ÷ 25',
      steps: ['325 × 4 = 1300', '1300 ÷ 100 = 13', 'Result: 13'],
      answer: 13,
    },
    generate: () => {
      const factor = Math.floor(Math.random() * 35) + 6;
      const num = factor * 25;
      return {
        prompt: `${num} ÷ 25`,
        num1: num,
        num2: 25,
        op: '÷',
        answer: factor,
        hint: `Multiply ${num} by 4 (= ${num * 4}) and divide by 100!`,
      };
    },
  },

  {
    id: 'div_50',
    title: 'Divide by 50',
    category: 'Division',
    badge: '÷50',
    difficulty: 'Easy',
    summary: 'Double the number and divide by 100.',
    rule: 'Dividing by 50 is multiplying by 2 and dividing by 100. Simply double the number and drop two zeros.',
    steps: [
      'Multiply the number by 2.',
      'Divide by 100.',
    ],
    example: {
      question: '650 ÷ 50',
      steps: ['650 × 2 = 1300', '1300 ÷ 100 = 13', 'Result: 13'],
      answer: 13,
    },
    generate: () => {
      const factor = Math.floor(Math.random() * 40) + 8;
      const num = factor * 50;
      return {
        prompt: `${num} ÷ 50`,
        num1: num,
        num2: 50,
        op: '÷',
        answer: factor,
        hint: `Double ${num} (= ${num * 2}) and divide by 100!`,
      };
    },
  },

  // --- PERCENTAGES ---
  {
    id: 'pct_10_rule',
    title: '10% and 1% Building Blocks',
    category: 'Percentages',
    badge: '10%/1%',
    difficulty: 'Easy',
    summary: 'Find 10% by shifting 1 decimal left, 1% by 2 decimals.',
    rule: 'Any percentage can be built from 10% and 1%. For 20%, double 10%. For 30%, triple 10%. For 5%, halve 10%.',
    steps: [
      '10% of N = N ÷ 10.',
      '1% of N = N ÷ 100.',
      'Combine: 20% = 2 × 10%, 15% = 10% + 5%.',
    ],
    example: {
      question: '20% of 450',
      steps: ['10% of 450 = 45', '20% = 2 × 45 = 90', 'Result: 90'],
      answer: 90,
    },
    generate: () => {
      const pcts = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      const pct = pcts[Math.floor(Math.random() * pcts.length)];
      const num = (Math.floor(Math.random() * 30) + 4) * 10;
      return {
        prompt: `${pct}% of ${num}`,
        num1: pct,
        num2: num,
        op: '%',
        answer: (pct * num) / 100,
        hint: `10% of ${num} is ${num / 10}. Multiply by ${pct / 10}!`,
      };
    },
  },

  {
    id: 'pct_reversible',
    title: 'Reversible Percentages',
    category: 'Percentages',
    badge: 'X% of Y',
    difficulty: 'Medium',
    summary: 'X% of Y = Y% of X. Swap them to make it easy!',
    rule: 'Percentage multiplication is commutative: X% of Y = Y% of X. If calculating 16% of 50 sounds hard, calculate 50% of 16 instead!',
    steps: [
      'Swap the percentage and the number.',
      'Calculate the simpler percentage.',
    ],
    example: {
      question: '18% of 50',
      steps: ['Swap to: 50% of 18', '50% is half of 18 = 9', 'Result: 9'],
      answer: 9,
    },
    generate: () => {
      const easyPcts = [25, 50, 75];
      const easyPct = easyPcts[Math.floor(Math.random() * easyPcts.length)];
      const num = (Math.floor(Math.random() * 15) + 2) * 4;
      return {
        prompt: `${num}% of ${easyPct}`,
        num1: num,
        num2: easyPct,
        op: '%',
        answer: (num * easyPct) / 100,
        hint: `Swap it! ${num}% of ${easyPct} = ${easyPct}% of ${num}. ${easyPct}% of ${num} is much easier to calculate!`,
      };
    },
  },

  // --- ADDITION & SUBTRACTION ---
  {
    id: 'comp_100',
    title: 'Complement to 100 or 1000',
    category: 'Addition & Subtraction',
    badge: '100-N',
    difficulty: 'Easy',
    summary: '"All from 9, last from 10" Vedic Math rule.',
    rule: 'To subtract any number from 100, 1000, or 10000: subtract every digit from 9, and subtract the last (rightmost non-zero) digit from 10.',
    steps: [
      'Subtract first digit from 9.',
      'Subtract last digit from 10.',
    ],
    example: {
      question: '100 - 67',
      steps: ['9 - 6 = 3', '10 - 7 = 3', 'Result: 33'],
      answer: 33,
    },
    generate: () => {
      const num = Math.floor(Math.random() * 85) + 12;
      return {
        prompt: `100 - ${num}`,
        num1: 100,
        num2: num,
        op: '-',
        answer: 100 - num,
        hint: `Subtract first digit ${Math.floor(num / 10)} from 9, and last digit ${num % 10} from 10!`,
      };
    },
  },

  {
    id: 'friendly_numbers',
    title: 'Friendly Numbers Addition',
    category: 'Addition & Subtraction',
    badge: 'A + B',
    difficulty: 'Easy',
    summary: 'Borrow to make a clean multiple of 10 first.',
    rule: 'When adding numbers like 48 + 35, borrow 2 from 35 and add it to 48 to make 50. Then calculate 50 + 33 = 83.',
    steps: [
      'Identify how much the first number needs to reach the next 10.',
      'Borrow that amount from the second number.',
      'Add the rounded 10s and remaining number.',
    ],
    example: {
      question: '58 + 37',
      steps: ['58 needs 2 to make 60', 'Borrow 2 from 37 -> 35 left', '60 + 35 = 95', 'Result: 95'],
      answer: 95,
    },
    generate: () => {
      const tens = (Math.floor(Math.random() * 6) + 2) * 10;
      const num1 = tens + (Math.random() > 0.5 ? 8 : 9);
      const num2 = Math.floor(Math.random() * 50) + 15;
      return {
        prompt: `${num1} + ${num2}`,
        num1,
        num2,
        op: '+',
        answer: num1 + num2,
        hint: `Round ${num1} up to ${tens + 10} by taking ${tens + 10 - num1} from ${num2}!`,
      };
    },
  },

  {
    id: 'mult_101',
    title: 'Multiply by 101',
    category: 'Multiplication',
    badge: '×101',
    difficulty: 'Easy',
    summary: 'Any 2-digit number multiplied by 101 repeats itself (AB × 101 = ABAB).',
    rule: 'When multiplying any 2-digit number AB by 101, the result is simply AB written twice: ABAB.',
    steps: [
      'Take the 2-digit number.',
      'Write it twice side by side.',
    ],
    example: {
      question: '43 × 101',
      steps: ['Number is 43', 'Repeat it twice: 4343', 'Result: 4343'],
      answer: 4343,
    },
    generate: () => {
      const num = Math.floor(Math.random() * 88) + 11;
      return {
        prompt: `${num} × 101`,
        num1: num,
        num2: 101,
        op: '×',
        answer: num * 101,
        hint: `Multiply by 101 repeats the 2 digits: ${num}${num}!`,
      };
    },
  },

  {
    id: 'mult_15',
    title: 'Multiply by 15',
    category: 'Multiplication',
    badge: '×15',
    difficulty: 'Medium',
    summary: 'Add half of the number to itself, then multiply by 10.',
    rule: '15 = 10 + 5. Since 5 is half of 10, calculate: (N + N/2) × 10.',
    steps: [
      'Find half of the number (N / 2).',
      'Add it to the original number (N + N / 2).',
      'Multiply by 10 (add a zero).',
    ],
    example: {
      question: '46 × 15',
      steps: ['Half of 46 = 23', '46 + 23 = 69', '69 × 10 = 690', 'Result: 690'],
      answer: 690,
    },
    generate: () => {
      const num = (Math.floor(Math.random() * 40) + 12) * 2;
      return {
        prompt: `${num} × 15`,
        num1: num,
        num2: 15,
        op: '×',
        answer: num * 15,
        hint: `Half of ${num} is ${num / 2}. ${num} + ${num / 2} = ${num + num / 2}. Multiply by 10!`,
      };
    },
  },

  {
    id: 'mult_same_tens_sum_10',
    title: 'Same Tens, Units Sum to 10',
    category: 'Multiplication',
    badge: 'T_U10',
    difficulty: 'Hard',
    summary: 'Multiply Tens × (Tens + 1), and Units × Units.',
    rule: 'For two 2-digit numbers with the same tens digit T and units summing to 10: First part is T × (T + 1). Second part is U1 × U2 (written as 2 digits).',
    steps: [
      'Verify tens are identical and units sum to 10.',
      'First part = Tens × (Tens + 1).',
      'Last two digits = Unit1 × Unit2.',
    ],
    example: {
      question: '43 × 47',
      steps: ['Tens is 4: 4 × 5 = 20', 'Units: 3 × 7 = 21', 'Join: 2021', 'Result: 2021'],
      answer: 2021,
    },
    generate: () => {
      const tens = Math.floor(Math.random() * 8) + 2;
      const u1 = Math.floor(Math.random() * 8) + 1;
      const u2 = 10 - u1;
      const num1 = tens * 10 + u1;
      const num2 = tens * 10 + u2;
      return {
        prompt: `${num1} × ${num2}`,
        num1,
        num2,
        op: '×',
        answer: num1 * num2,
        hint: `Tens: ${tens} × ${tens + 1} = ${tens * (tens + 1)}. Units: ${u1} × ${u2} = ${String(u1 * u2).padStart(2, '0')}. Put together!`,
      };
    },
  },

  {
    id: 'square_near_100',
    title: 'Squares Near 100',
    category: 'Squares & Cubes',
    badge: '100±d²',
    difficulty: 'Hard',
    summary: 'Add difference to number, then attach difference squared.',
    rule: 'For number N close to 100 with difference d = N - 100: First part = N + d. Last two digits = d².',
    steps: [
      'Find difference d = N - 100.',
      'First part = N + d.',
      'Last two digits = d² (2 digits).',
    ],
    example: {
      question: '96²',
      steps: ['d = 96 - 100 = -4', 'First part: 96 + (-4) = 92', 'Second part: (-4)² = 16', 'Result: 9216'],
      answer: 9216,
    },
    generate: () => {
      const candidates = [92, 93, 94, 96, 97, 98, 99, 102, 103, 104, 105, 106, 107];
      const num = candidates[Math.floor(Math.random() * candidates.length)];
      const d = num - 100;
      return {
        prompt: `${num}²`,
        num1: num,
        num2: num,
        op: '²',
        answer: num * num,
        hint: `Diff is ${d}. First part = ${num} + (${d}) = ${num + d}. Second part = ${Math.abs(d)}² = ${String(d * d).padStart(2, '0')}.`,
      };
    },
  },

  {
    id: 'div_4',
    title: 'Divide by 4',
    category: 'Division',
    badge: '÷4',
    difficulty: 'Easy',
    summary: 'Halve the number twice.',
    rule: 'Dividing by 4 is the same as dividing by 2, then dividing by 2 again.',
    steps: [
      'Divide by 2 (first half).',
      'Divide by 2 again (second half).',
    ],
    example: {
      question: '136 ÷ 4',
      steps: ['136 ÷ 2 = 68', '68 ÷ 2 = 34', 'Result: 34'],
      answer: 34,
    },
    generate: () => {
      const factor = Math.floor(Math.random() * 80) + 12;
      const num = factor * 4;
      return {
        prompt: `${num} ÷ 4`,
        num1: num,
        num2: 4,
        op: '÷',
        answer: factor,
        hint: `Halve ${num} (= ${num / 2}), then halve again!`,
      };
    },
  },

  {
    id: 'comp_1000',
    title: 'Complement to 1000',
    category: 'Addition & Subtraction',
    badge: '1000-N',
    difficulty: 'Medium',
    summary: 'Vedic: First two digits from 9, last digit from 10.',
    rule: 'To subtract a 3-digit number from 1000: subtract hundreds and tens digits from 9, and units digit from 10.',
    steps: [
      'Hundreds digit: 9 - h.',
      'Tens digit: 9 - t.',
      'Units digit: 10 - u.',
    ],
    example: {
      question: '1000 - 467',
      steps: ['9 - 4 = 5', '9 - 6 = 3', '10 - 7 = 3', 'Result: 533'],
      answer: 533,
    },
    generate: () => {
      const num = Math.floor(Math.random() * 850) + 120;
      return {
        prompt: `1000 - ${num}`,
        num1: 1000,
        num2: num,
        op: '-',
        answer: 1000 - num,
        hint: `All from 9, last from 10! Subtract digits of ${num} from 9, 9, 10!`,
      };
    },
  },
];

