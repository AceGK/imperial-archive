// The "§ I", "§ II", … numbering used by every table of contents (blog posts,
// studio pages, the FAQ) and the cards their entries link to.

const ROMAN: [number, string][] = [
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function toRoman(n: number) {
  let out = "";
  for (const [value, numeral] of ROMAN) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

/** The label for the nth section, counting from 1: sectionIndex(3) is "§ III" */
export const sectionIndex = (n: number) => `§ ${toRoman(n)}`;
