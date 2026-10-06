/**
 * Where the locator draws its numbered guess markers (PUB3-07). Close guesses
 * are the ones a player wants to see, and at the locator's scale (about 0.36
 * px per km on the mainland) a guess 13 km away sits under the answer's ring.
 * A marker that would overlap the answer or an earlier marker moves out along
 * a short leader line from its true point, which stays drawn as a dot, so the
 * map never claims a place the guess is not.
 */

export interface LocatorPoint {
  x: number;
  y: number;
}

export interface PlacedMarker {
  /** The guess's true point. */
  at: LocatorPoint;
  /** Where its numbered circle is drawn (equal to `at` when nothing was in the way). */
  label: LocatorPoint;
  moved: boolean;
}

/** Radius of a guess's numbered circle; the answer's ring is 11. */
export const GUESS_RADIUS = 8;
export const ANSWER_RADIUS = 11;
/** Clear space kept between two circles. */
const GAP = 2;
/** How far out a moved marker may go, and the turns tried at each distance (away from what it overlaps first). */
const RINGS = [20, 28, 36, 44, 54];
const TURNS = [0, 35, -35, 70, -70, 105, -105, 140, -140, 180];

const clear = (a: LocatorPoint, ra: number, b: LocatorPoint, rb: number) => Math.hypot(a.x - b.x, a.y - b.y) >= ra + rb + GAP;

/**
 * Places the guesses in order. `answer` (when the game is over) is fixed first,
 * so no guess hides under it; each later guess avoids the answer and every
 * marker already placed, and stays inside `width` × `height`.
 */
export function placeMarkers(points: LocatorPoint[], answer: LocatorPoint | null, width: number, height: number): PlacedMarker[] {
  const taken: Array<{ at: LocatorPoint; r: number }> = answer ? [{ at: answer, r: ANSWER_RADIUS }] : [];
  const inside = (p: LocatorPoint) => p.x >= GUESS_RADIUS && p.x <= width - GUESS_RADIUS && p.y >= GUESS_RADIUS && p.y <= height - GUESS_RADIUS;
  const free = (p: LocatorPoint) => inside(p) && taken.every(other => clear(p, GUESS_RADIUS, other.at, other.r));
  return points.map(at => {
    let label = at;
    if (!free(at)) {
      // Move away from the first circle in the way (or straight up when it sits exactly on it).
      const blocker = taken.find(other => !clear(at, GUESS_RADIUS, other.at, other.r));
      const away = blocker && (blocker.at.x !== at.x || blocker.at.y !== at.y)
        ? Math.atan2(at.y - blocker.at.y, at.x - blocker.at.x)
        : -Math.PI / 2;
      search: for (const ring of RINGS) {
        for (const turn of TURNS) {
          const angle = away + (turn * Math.PI) / 180;
          const candidate = { x: at.x + ring * Math.cos(angle), y: at.y + ring * Math.sin(angle) };
          if (free(candidate)) { label = candidate; break search; }
        }
      }
    }
    taken.push({ at: label, r: GUESS_RADIUS });
    return { at, label, moved: label !== at };
  });
}
