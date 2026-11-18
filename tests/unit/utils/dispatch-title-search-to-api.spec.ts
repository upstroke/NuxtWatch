import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchTitleSearchToApi } from '../../../app/utils/dispatch-title-search-to-api';

const observedProposal = {
  status: 'ready',
  changes: [{ field: 'title', operation: 'set', value: 'The Matrix' }],
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('$fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dispatchTitleSearchToApi', () => {
  // Statement coverage: posts the validated criteria and returns the API response.
  it('posts only the validated search criteria and returns the response', async () => {
    const response = {
      page: 1,
      totalPages: 1,
      totalResults: 1,
      results: [{ id: 1, mediaType: 'movie', title: 'The Matrix' }],
    };
    fetchMock.mockResolvedValue(response);

    const outcome = await dispatchTitleSearchToApi(observedProposal);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/search/title', {
      method: 'POST',
      body: { title: 'The Matrix' },
    });
    expect(outcome).toEqual({
      status: 'dispatched',
      criteria: { title: 'The Matrix' },
      result: response,
    });
  });

  // Branch coverage: skips the HTTP request for invalid or non-ready proposals.
  it.each([
    {
      label: 'a blank title',
      proposal: {
        status: 'ready',
        changes: [{ field: 'title', operation: 'set', value: '   ' }],
      },
    },
    {
      label: 'more than one change',
      proposal: {
        status: 'ready',
        changes: [
          ...observedProposal.changes,
          { field: 'title', operation: 'set', value: 'The Matrix Reloaded' },
        ],
      },
    },
    {
      label: 'a proposal requiring clarification',
      proposal: {
        status: 'clarification_required',
        changes: observedProposal.changes,
      },
    },
  ])('does not call the API for $label', async ({ proposal }) => {
    const outcome = await dispatchTitleSearchToApi(proposal);

    expect(outcome).toEqual({ status: 'not-dispatched' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
