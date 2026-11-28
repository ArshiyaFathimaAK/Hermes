/** Shared springs, so everything that moves feels the same. Reduced motion is respected. */
export const springs = {
  /** Settling after a drag or a tap. */
  settle: { damping: 26, stiffness: 320, mass: 0.8 },
  /** Keeping up with a finger. */
  follow: { damping: 32, stiffness: 520, mass: 0.6 },
} as const;
