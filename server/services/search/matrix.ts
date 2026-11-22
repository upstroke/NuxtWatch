/** Evaluates the currently supported title paths without interpreting or executing. */
import type { SearchCriteria } from '@lib/schemas/search-criteria';

export type SearchPath = 'multi' | 'movie' | 'tv';
export type SearchObstacle =
  | 'title_required'
  | 'media_scope_not_covered'
  | 'year_not_supported';

type SearchCapability = {
  path: SearchPath;
  mediaType: SearchCriteria['mediaType'];
  supportsYear: boolean;
};

const capabilities: readonly SearchCapability[] = [
  { path: 'multi', mediaType: 'all', supportsYear: false },
  { path: 'movie', mediaType: 'movie', supportsYear: true },
  { path: 'tv', mediaType: 'tv', supportsYear: true },
];

export type SearchPathEvaluation = {
  path: SearchPath;
  obstacles: SearchObstacle[];
};

/** Exact scope coverage deliberately excludes merging lists and post-filtering. */
export function evaluateSearchPaths(criteria: SearchCriteria): SearchPathEvaluation[] {
  const current = { ...criteria };
  return capabilities.map((capability) => {
    const obstacles: SearchObstacle[] = [];
    if (!current.title?.trim()) obstacles.push('title_required');
    if (capability.mediaType !== current.mediaType) {
      obstacles.push('media_scope_not_covered');
    }
    if (current.year !== undefined && !capability.supportsYear) {
      obstacles.push('year_not_supported');
    }
    return { path: capability.path, obstacles };
  });
}
