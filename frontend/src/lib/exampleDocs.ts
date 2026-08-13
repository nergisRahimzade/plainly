const SEED_IDS_KEY = "plainly_example_doc_ids";

/** Ids of previously-seeded example documents, tracked locally so re-adding
 * them can clean up the old ones first instead of piling up duplicates. */
export function getStoredExampleIds(): string[] {
  try {
    const raw = localStorage.getItem(SEED_IDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setStoredExampleIds(ids: string[]): void {
  localStorage.setItem(SEED_IDS_KEY, JSON.stringify(ids));
}
