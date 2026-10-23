/** Human history in 10 simple ages, counted from year 1 (the extinction of the other hominins)
 *  through the 1920s. Names are plain technology milestones any player can read at a glance.
 */
export const YEAR_FIRST = 1;
export const YEAR_LAST = 1920;

export const AGES = [
  { name: 'First Fires', start: 1, end: 192 },
  { name: 'Stone', start: 193, end: 384 },
  { name: 'Bronze', start: 385, end: 576 },
  { name: 'Iron', start: 577, end: 768 },
  { name: 'Sails', start: 769, end: 960 },
  { name: 'Powder', start: 961, end: 1152 },
  { name: 'Steam', start: 1153, end: 1344 },
  { name: 'Rails', start: 1345, end: 1536 },
  { name: 'Wires', start: 1537, end: 1728 },
  { name: 'Motors', start: 1729, end: 1920 },
];

/** { index: 1..10, name, start, end } for a given year. Clamps outside the range. */
export function ageForYear(year) {
  let age = AGES[0];
  for (const a of AGES) {
    if (year >= a.start && year <= a.end) { age = a; break; }
  }
  if (year > YEAR_LAST) age = AGES[AGES.length - 1];
  return { index: AGES.indexOf(age) + 1, ...age };
}
