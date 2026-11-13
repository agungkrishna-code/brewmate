/** SQL fragments reused by the journal, bean and grinder services. */

/** Sum of every non-null rating column (alias `r` = brew_session_ratings). */
export const RATING_SUM =
  '(COALESCE(r.acidity, 0) + COALESCE(r.sweetness, 0) + COALESCE(r.bitterness, 0) + COALESCE(r.body, 0) + COALESCE(r.clarity, 0) + COALESCE(r.aftertaste, 0))';

/** Number of rated categories (alias `r` = brew_session_ratings). */
export const RATING_COUNT =
  '((r.acidity IS NOT NULL) + (r.sweetness IS NOT NULL) + (r.bitterness IS NOT NULL) + (r.body IS NOT NULL) + (r.clarity IS NOT NULL) + (r.aftertaste IS NOT NULL))';

/** Average rating for a joined ratings row, or NULL when nothing was rated. */
export const RATING_AVG = `ROUND(${RATING_SUM} * 1.0 / NULLIF(${RATING_COUNT}, 0), 2)`;
