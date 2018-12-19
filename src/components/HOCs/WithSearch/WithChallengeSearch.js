import _get from 'lodash/get'
import _isUndefined from 'lodash/isUndefined'
import WithSearch from '../WithSearch/WithSearch'
import { extendedFind } from '../../../services/Challenge/Challenge'
import { ChallengeStatus } from '../../../services/Challenge/ChallengeStatus/ChallengeStatus'
import WithSearchRoute from '../WithSearchRoute/WithSearchRoute'

const SEARCH_GROUP = 'challenges'

/**
 * Adapts the query object passed from WithSearch to the object
 * expected by extendedFind functions
 */
const buildCriteria = query => {
  const sortCriteria = _get(query, "sort", {})
  const filters = _get(query, "filters", {})
  const queryString = _get(query, "query")
  const page = _get(query, "page.currentPage")
  let bounds = null

  if (filters && !_isUndefined(filters.location)) {
    bounds = _get(query, "mapBounds.bounds")
  }

  const challengeStatus = [ChallengeStatus.ready,
                           ChallengeStatus.partiallyLoaded,
                           ChallengeStatus.none,
                           ChallengeStatus.empty]

  return {searchQuery: queryString, filters, sortCriteria, bounds, page, challengeStatus}
}

const performChallengeSearch = (query, limit) => {
  return extendedFind(buildCriteria(query), limit)
}

export default (WrappedComponent) => {
  return WithSearch(WithSearchRoute(WrappedComponent, SEARCH_GROUP), SEARCH_GROUP, performChallengeSearch)
}
