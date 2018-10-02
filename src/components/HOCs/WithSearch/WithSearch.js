import React, { Component } from 'react'
import { connect } from 'react-redux'
import _debounce from 'lodash/debounce'
import _get from 'lodash/get'
import _omit from 'lodash/omit'
import _isFunction from 'lodash/isFunction'
import _isEmpty from 'lodash/isEmpty'
import _isEqual from 'lodash/isEqual'
import { setSort, removeSort, clearSort,
         setFilters, removeFilters, clearFilters,
         setSearch, clearSearch,
         setChallengeSearchMapBounds, setChallengeBrowseMapBounds,
         setTaskMapBounds, setChallengeOwnerMapBounds,
         performSearch } from '../../../services/Search/Search'
import { SORT_NAME, SORT_CREATED } from '../../../services/Search/Search'

import { userLocation } from '../../../services/User/User'
import { addError } from '../../../services/Error/Error'
import AppErrors from '../../../services/Error/AppErrors'
import { toLatLngBounds, DEFAULT_MAP_BOUNDS }
       from '../../../services/MapBounds/MapBounds'
import { CHALLENGE_LOCATION_WITHIN_MAPBOUNDS }
  from '../../../services/Challenge/ChallengeLocation/ChallengeLocation'


/**
 * WithSearch passes down search criteria from the redux
 * store to the wrapped component, and also provides functions for altering and
 * removing search criteria. It works with the Search service to provide wrapped components
 * with the named search query text as well as functions for updating and
 * clearing the query text, the sort parameters, and the filters.
 *
 * > Note that WithSearch does not provide any search results, only
 * > facilities for managing the search criteria itself.
 *
 * @author [Kelli Rotstan](https://github.com/krotstan)
 *
 * @see See WithSearchResults for a HOC that provides results for a named search
 *
 * @param {WrappedComponent} WrappedComponent - The component to wrap
 * @param {string} searchGroup - The group name of the search criteria to work with
 * @param {function} searchFunction - which function to call when performing a search
 */
const WithSearch = (WrappedComponent, searchGroup, searchFunction) =>
  connect(
    (state) => mapStateToProps(state, searchGroup),
    (state, ownProps) => mapDispatchToProps(state, ownProps, searchGroup)
  )(_WithSearch(WrappedComponent, searchGroup, searchFunction), searchGroup)


export const _WithSearch = function(WrappedComponent, searchGroup, searchFunction) {
   return class extends Component {
    setSearch = query => this.props.setSearch(query, searchGroup)
    clearSearch = () => this.props.clearSearch(searchGroup)

    componentDidUpdate(prevProps) {
      // do nothing if no search function is given
      if (!searchFunction) {
        return
      }

      let prevSearch = _omit(_get(prevProps, `currentSearch.${searchGroup}`), ['meta'])
      let currentSearch = _omit(_get(this.props, `currentSearch.${searchGroup}`), ['meta'])

      if (_get(this.props, 'searchFilters.location') !== CHALLENGE_LOCATION_WITHIN_MAPBOUNDS) {
        currentSearch = _omit(currentSearch, 'mapBounds')
        prevSearch = _omit(prevSearch, 'mapBounds')
      }

      if (!_isEqual(prevSearch, currentSearch)) {
        debouncedFetch(this.props, searchFunction)
      }
    }

    render() {
       // Merge our search query in with others in case there are multiple
       // searches in play.
       const searchQueries =
         Object.assign({}, _get(this.props, 'searchQueries', {}), {
           [searchGroup]: {
             searchQuery: _get(this.props, `currentSearch.${searchGroup}`),
             setSearch: this.setSearch,
             clearSearch: this.clearSearch,
           }
       })

       return (
          <WrappedComponent searchGroup={searchGroup}
                            searchQueries={searchQueries}
                            searchFunction={searchFunction}
                            {...searchQueries[searchGroup]}
                            {..._omit(this.props, ['searchQueries',
                                                   'setSearch', 'clearSearch',
                                                   'performSearch',
                                                   'searchFunction'])} />
       )
     }
   }
}

const debouncedFetch = _debounce((props, searchFunction) =>
    props.performSearch(props.searchCriteria, searchFunction), 1000, {leading: true})

export const mapStateToProps = (state, searchGroup) => {
  return {
    currentSearch: _get(state, 'currentSearch'),
    searchCriteria: _get(state, `currentSearch.${searchGroup}`),
    searchFilters: _get(state, `currentSearch.${searchGroup}.filters`, {}),
    searchSort: _get(state, `currentSearch.${searchGroup}.sort`, {}),
    mapBounds: convertBounds(_get(state, `currentSearch.${searchGroup}.mapBounds`,
                                  {bounds: DEFAULT_MAP_BOUNDS})),
  }
}

export const mapDispatchToProps = (dispatch, ownProps, searchGroup) => ({
  performSearch: (query, searchFunction) => {
    return dispatch(performSearch(searchGroup, query, searchFunction))
  },

  setSearch: (query, searchName) => {
    dispatch(setSearch(searchName, query))

    // If multiple WithSearch HOCs are chained, invoke parent searches
    // as well. The assumption is that they are configured to search
    // different entities (e.g. one searches projects and the other
    // searches challenges)
    if (_isFunction(ownProps.setSearch)) {
      ownProps.setSearch(query, searchName)
    }
  },

  clearSearch: searchName => {
    dispatch(clearSearch(searchName))

    // If multiple WithSearch HOCs are chained, pass it up
    if (_isFunction(ownProps.clearSearch)) {
      ownProps.clearSearch(searchName)
    }
  },

  setSearchSort: sortCriteria => {
      const sortBy = _get(sortCriteria, 'sortBy')
      let sort = null

      switch(sortBy) {
        case SORT_NAME:
          sort = {sortBy, direction: 'desc'}
          break
        case SORT_CREATED:
          sort = {sortBy, direction: 'asc'}
          break
        default:
          sort = {sortBy: null, direction: null}
          break
      }

      dispatch(setSort(searchGroup, sort))
    },

  removeSearchSort:
    criteriaNames => dispatch(removeSort(searchGroup, criteriaNames)),

  clearSearchSort: () => dispatch(clearSort(searchGroup)),

  setSearchFilters:
    filterCriteria => {
      dispatch(setFilters(searchGroup, filterCriteria))
    },

  removeSearchFilters:
    criteriaNames => dispatch(removeFilters(searchGroup, criteriaNames)),

  setKeywordFilter: keywords => {
    dispatch(setFilters(searchGroup, {keywords}))
  },

  clearSearchFilters: () => dispatch(clearFilters(searchGroup)),

  setChallengeSearchMapBounds: (bounds, zoom, fromUserAction=false) => {
    dispatch(setChallengeSearchMapBounds(searchGroup, bounds, fromUserAction))
  },

  setChallengeBrowseMapBounds: (challengeId, bounds, zoom) => {
    dispatch(setChallengeBrowseMapBounds(searchGroup, challengeId, bounds, zoom))
  },

  setChallengeOwnerMapBounds: (challengeId, bounds, zoom) => {
    dispatch(setChallengeOwnerMapBounds(searchGroup, challengeId, bounds, zoom))
  },

  setTaskMapBounds: (taskId, bounds, zoom, fromUserAction=false) => {
    dispatch(setTaskMapBounds(searchGroup, taskId, bounds, zoom, fromUserAction))
  },

  locateMapToUser: user => {
    const userCenterpoint = userLocation(user)

    if (!_isEmpty(userCenterpoint)) {
      const nearbyLongitude = parseFloat(process.env.REACT_APP_NEARBY_LONGITUDE_LENGTH)
      const nearbyLatitude = parseFloat(process.env.REACT_APP_NEARBY_LATITUDE_LENGTH)

      const userBounds = [
        userCenterpoint.longitude - (nearbyLongitude / 2.0),
        userCenterpoint.latitude - (nearbyLatitude / 2.0),
        userCenterpoint.longitude + (nearbyLongitude / 2.0),
        userCenterpoint.latitude + (nearbyLatitude / 2.0)
      ]

      dispatch(setChallengeSearchMapBounds(searchGroup, userBounds, true))
    }
    else {
      dispatch(addError(AppErrors.user.missingHomeLocation))
    }
  },
})

const convertBounds = boundsObject => {
  if (_isEmpty(boundsObject) || _isEmpty(boundsObject.bounds)) {
    return boundsObject
  }

  return Object.assign(
    {},
    boundsObject,
    {bounds: toLatLngBounds(boundsObject.bounds)},
  )
}

export default WithSearch