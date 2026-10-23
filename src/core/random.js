export const rand = (a, b) => a + Math.random() * (b - a);
/** Roughly bell-shaped value in [-1, 1]. */
export const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
