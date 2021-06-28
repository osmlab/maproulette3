import format from "date-fns/format";
import _uniqueId from "lodash/uniqueId";
import _cloneDeep from "lodash/cloneDeep";
import _clone from "lodash/clone";
import _set from "lodash/set";
import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import _isArray from "lodash/isArray";
import _omit from "lodash/omit";
import _fromPairs from "lodash/fromPairs";
import _map from "lodash/map";
import _isFinite from "lodash/isFinite";
import _isUndefined from "lodash/isUndefined";
import _findIndex from "lodash/findIndex";
import _split from "lodash/split";
import messages from "./Messages";

import { fromLatLngBounds } from "../MapBounds/MapBounds";
import { CHALLENGE_LOCATION_WITHIN_MAPBOUNDS } from "../Challenge/ChallengeLocation/ChallengeLocation";
import { REVIEW_STATUS_NOT_SET } from "../Task/TaskReview/TaskReviewStatus";

// redux actions
export const SET_SEARCH = "SET_SEARCH";
export const SET_COMPLETE_SEARCH = "SET_COMPLETE_SEARCH";
export const CLEAR_SEARCH = "CLEAR_SEARCH";
export const FETCHING_RESULTS = "FETCHING_RESULTS";
export const RECEIVED_RESULTS = "RECEIVED_RESULTS";

export const SET_SORT = "SET_SORT";
export const REMOVE_SORT = "REMOVE_SORT";

export const SET_PAGE = "SET_PAGE";
export const REMOVE_PAGE = "REMOVE_PAGE";

export const SET_FILTERS = "SET_FILTERS";
export const REMOVE_FILTERS = "REMOVE_FILTERS";
export const CLEAR_FILTERS = "CLEAR_FILTERS";

export const SET_CHALLENGE_SEARCH_MAP_BOUNDS =
  "SET_CHALLENGE_SEARCH_MAP_BOUNDS";
export const SET_CHALLENGE_BROWSE_MAP_BOUNDS =
  "SET_CHALLENGE_BROWSE_MAP_BOUNDS";
export const SET_TASK_MAP_BOUNDS = "SET_TASK_MAP_BOUNDS";
export const SET_CHALLENGE_OWNER_MAP_BOUNDS = "SET_CHALLENGE_OWNER_MAP_BOUNDS";
export const CLEAR_MAP_BOUNDS = "CLEAR_MAP_BOUNDS";

// Sort options
export const SORT_NAME = "name";
export const SORT_CREATED = "created";
export const SORT_OLDEST = "Created";
export const SORT_POPULARITY = "popularity";
export const SORT_COOPERATIVE_WORK = "cooperative_type";
export const SORT_DEFAULT = "default";
export const SORT_NEAR_COMPLETE = "near_complete";
export const SORT_NEAR_COMPLETE_NUM = "near_complete_num";
export const ALL_SORT_OPTIONS = [
  SORT_NAME,
  SORT_CREATED,
  SORT_OLDEST,
  SORT_POPULARITY,
  SORT_COOPERATIVE_WORK,
  SORT_DEFAULT,
  SORT_NEAR_COMPLETE,
  SORT_NEAR_COMPLETE_NUM,
];

// Default Results Per page
export const RESULTS_PER_PAGE = 50;

export const SortOptions = {
  name: SORT_NAME,
  created: SORT_CREATED,
  created_oldest: SORT_OLDEST,
  popular: SORT_POPULARITY,
  cooperativeWork: SORT_COOPERATIVE_WORK,
  default: SORT_DEFAULT,
  nearComplete: SORT_NEAR_COMPLETE,
  nearCompleteNum: SORT_NEAR_COMPLETE_NUM,
};

// Map for the search parameters expected by server
export const PARAMS_MAP = {
  reviewRequestedBy: "o",
  reviewedBy: "r",
  metaReviewedBy: "mr",
  completedBy: "m",
  challengeId: "cid",
  challenge: "cs",
  projectId: "pid",
  project: "ps",
  status: "tStatus",
  priority: "tp",
  priorities: "priorities",
  reviewStatus: "trStatus",
  metaReviewStatus: "mrStatus",
  id: "tid",
  difficulty: "cd",
  tags: "tt",
  excludeTasks: "tExcl",
};

/** Returns object containing localized labels  */
export const sortLabels = (intl) =>
  _fromPairs(
    _map(messages, (message, key) => [key, intl.formatMessage(message)])
  );

/**
 * Parse the given raw query text that may include hashtags for keywords and
 * return a query object that contains separate fields for the tags and query
 * string, as well as easy access to the individual query and tag tokens.
 */
export const parseQueryString = function (rawQueryText) {
  const tagTokens = [];
  const queryTokens = [];

  if (_isEmpty(rawQueryText)) {
    return {
      tagTokens,
      tags: "",
      queryTokens,
      query: "",
      rawQueryText: "",
    };
  }

  const tokens = rawQueryText.split(/\s+/);
  for (let token of tokens) {
    if (token[0] === "#") {
      if (token.length > 1) {
        tagTokens.push(token.slice(1));
      }
    } else {
      queryTokens.push(token);
    }
  }

  return {
    tagTokens,
    tags: tagTokens.join(","),
    queryTokens,
    query: queryTokens.join(" "),
    rawQueryText,
  };
};

/**
 * Generates, from the given criteria, a search parameters string that the
 * server accepts for various API endpoints
 */
export const generateSearchParametersString = (
  filters,
  boundingBox,
  savedChallengesOnly,
  excludeOtherReviewers,
  queryString,
  invertFields = {},
  excludeTasks
) => {
  const searchParameters = {};
  const invf = [];

  if (filters.reviewRequestedBy) {
    searchParameters[PARAMS_MAP.reviewRequestedBy] = filters.reviewRequestedBy;
    if (invertFields.reviewRequestedBy) {
      invf.push(PARAMS_MAP.reviewRequestedBy);
    }
  }
  if (filters.reviewedBy) {
    searchParameters[PARAMS_MAP.reviewedBy] = filters.reviewedBy;
    if (invertFields.reviewedBy) {
      invf.push(PARAMS_MAP.reviewedBy);
    }
  }
  if (filters.metaReviewedBy) {
    searchParameters[PARAMS_MAP.metaReviewedBy] = filters.metaReviewedBy;
    if (invertFields.metaReviewedBy) {
      invf.push(PARAMS_MAP.metaReviewedBy);
    }
  }
  if (filters.completedBy) {
    searchParameters[PARAMS_MAP.completedBy] = filters.completedBy;
    if (invertFields.completedBy) {
      invf.push(PARAMS_MAP.completedBy);
    }
  }

  if (filters.challengeId) {
    searchParameters.cid = !_isArray(filters.challengeId)
      ? filters.challengeId
      : (searchParameters[PARAMS_MAP.challengeId] =
          filters.challengeId.join(","));

    if (invertFields.challenge) {
      invf.push(PARAMS_MAP.challengeId);
    }
  } else if (filters.challenge || filters.challengeName) {
    searchParameters[PARAMS_MAP.challenge] =
      filters.challenge || filters.challengeName;
    if (invertFields.challenge) {
      invf.push(PARAMS_MAP.challenge);
    }
  }

  if (filters.projectId) {
    searchParameters[PARAMS_MAP.projectId] = filters.projectId;
    if (invertFields.project) {
      invf.push(PARAMS_MAP.projectId);
    }
  } else if (filters.project) {
    searchParameters[PARAMS_MAP.project] = filters.project;
    if (invertFields.project) {
      invf.push(PARAMS_MAP.project);
    }
  }
  if (!_isUndefined(filters.status) && filters.status !== "all") {
    if (Array.isArray(filters.status)) {
      searchParameters[PARAMS_MAP.status] = filters.status.join(",");
    } else {
      searchParameters[PARAMS_MAP.status] = filters.status;
    }
    if (invertFields.status) {
      invf.push(PARAMS_MAP.status);
    }
  }
  if (!_isUndefined(filters.priority) && filters.priority !== "all") {
    searchParameters[PARAMS_MAP.priority] = filters.priority;
    if (invertFields.priority) {
      invf.push(PARAMS_MAP.priority);
    }
  }
  if (!_isUndefined(filters.priorities) && filters.priorities !== "all") {
    if (Array.isArray(filters.priorities)) {
      searchParameters[PARAMS_MAP.priorities] = filters.priorities.join(",");
    } else {
      searchParameters[PARAMS_MAP.priorities] = filters.priorities;
    }
    if (invertFields.priorities) {
      invf.push(PARAMS_MAP.priorities);
    }
  }
  if (!_isUndefined(filters.reviewStatus) && filters.reviewStatus !== "all") {
    if (Array.isArray(filters.reviewStatus)) {
      searchParameters[PARAMS_MAP.reviewStatus] =
        filters.reviewStatus.join(",");
    } else {
      searchParameters[PARAMS_MAP.reviewStatus] = filters.reviewStatus;
    }
    if (invertFields.reviewStatus) {
      invf.push(PARAMS_MAP.reviewStatus);
    }
  }
  if (
    !_isUndefined(filters.metaReviewStatus) &&
    filters.metaReviewStatus !== "all"
  ) {
    if (Array.isArray(filters.metaReviewStatus)) {
      let metaReviewStatuses = _clone(filters.metaReviewStatus);
      const reviewStatus = Array.isArray(filters.reviewStatus)
        ? filters.reviewStatus
        : _split(filters.reviewStatus, ",");

      if (
        _findIndex(
          reviewStatus,
          (x) => x.toString() === REVIEW_STATUS_NOT_SET.toString()
        ) > -1
      ) {
        // If we are searching for tasks that have no associated review requests
        // than we should also ask for those when applying the metaReviewStatus filter as well.
        metaReviewStatuses = filters.metaReviewStatus.concat(
          REVIEW_STATUS_NOT_SET
        );
      }
      searchParameters[PARAMS_MAP.metaReviewStatus] =
        metaReviewStatuses.join(",");
    } else {
      searchParameters[PARAMS_MAP.metaReviewStatus] = filters.metaReviewStatus;
    }
    if (invertFields.metaReviewStatus) {
      invf.push(PARAMS_MAP.metaReviewStatus);
    }
  }
  if (filters.reviewedAt) {
    searchParameters.startDate = format(filters.reviewedAt, "YYYY-MM-DD");
    searchParameters.endDate = format(filters.reviewedAt, "YYYY-MM-DD");
  }

  if (filters.id) {
    searchParameters[PARAMS_MAP.id] = filters.id;
  }

  if (_isFinite(filters.difficulty)) {
    searchParameters[PARAMS_MAP.difficulty] = filters.difficulty;
  }

  if (boundingBox) {
    // If we are searching within map bounds we need to ensure the parent
    // challenge is also within those bounds
    if (filters.location === CHALLENGE_LOCATION_WITHIN_MAPBOUNDS) {
      if (_isArray(boundingBox)) {
        searchParameters.bb = boundingBox.join(",");
      } else {
        searchParameters.bb = boundingBox;
      }
    } else {
      //tbb =>  [left, bottom, right, top]  W/S/E/N
      if (_isArray(boundingBox)) {
        searchParameters.tbb = boundingBox.join(",");
      } else {
        searchParameters.tbb = boundingBox;
      }
    }
  }

  if (savedChallengesOnly) {
    searchParameters.onlySaved = savedChallengesOnly;
  }

  if (excludeOtherReviewers) {
    searchParameters.excludeOtherReviewers = excludeOtherReviewers;
  }

  if (queryString || filters.keywords) {
    const queryParts = parseQueryString(queryString);

    // Keywords/tags can come from both the the query and the filter, so we need to
    // combine them into a single keywords array.
    const keywords = queryParts.tagTokens.concat(
      _isArray(filters.keywords) ? filters.keywords : []
    );

    if (keywords.length > 0) {
      searchParameters.ct = keywords.join(",");
    }

    if (queryParts.query.length > 0) {
      searchParameters[PARAMS_MAP.challenge] = queryParts.query;
    }
  }

  if (filters.tags) {
    searchParameters[PARAMS_MAP.tags] = filters.tags.trim();
  }

  if (excludeTasks && excludeTasks.length > 0) {
    searchParameters[PARAMS_MAP.excludeTasks] = excludeTasks.join(",");
  }

  searchParameters.invf = invf.join(",");

  return searchParameters;
};

// redux action creators
export const setCompleteSearch = function (searchName, searchObject) {
  return {
    type: SET_COMPLETE_SEARCH,
    searchName,
    searchObject,
  };
};

export const setSearch = function (searchName, query) {
  return {
    type: SET_SEARCH,
    searchName,
    query,
  };
};

export const clearSearch = function (searchName) {
  return {
    type: CLEAR_SEARCH,
    searchName,
  };
};

export const setSort = function (searchName, sortCriteria) {
  return {
    type: SET_SORT,
    searchName,
    sortCriteria,
  };
};

export const removeSort = function (searchName, criteriaNames) {
  return {
    type: REMOVE_SORT,
    searchName,
    criteriaNames,
  };
};

export const setPage = function (searchName, page) {
  return {
    type: SET_PAGE,
    searchName,
    page,
  };
};

export const removePage = function (searchName) {
  return {
    type: REMOVE_PAGE,
    searchName,
  };
};

export const setFilters = function (searchName, filterCriteria) {
  return {
    type: SET_FILTERS,
    searchName,
    filterCriteria,
  };
};

export const removeFilters = function (searchName, criteriaNames) {
  return {
    type: REMOVE_FILTERS,
    searchName,
    criteriaNames,
  };
};

export const clearFilters = function (searchName) {
  return {
    type: CLEAR_FILTERS,
    searchName,
  };
};

/**
 * Set the given bounds of the challenge search map in the redux store as the current
 * bounds. If the bounds are being altered programatically in direct response
 * to a user action (as opposed to just panning or zooming around the map),
 * then set fromUserAction to true.
 *
 * @param bounds - either a LatLngBounds instance or an array of
 *       [west, south, east, north]
 *
 * @param {boolean} [fromUserAction=false] set to true to indicate the
 *        bounds were modified programatically in response to a user
 *        action, false if the bounds are simply being altered in response
 *        to normal panning and zooming.
 */
export const setChallengeSearchMapBounds = function (
  searchName,
  bounds,
  fromUserAction = false
) {
  return {
    type: SET_CHALLENGE_SEARCH_MAP_BOUNDS,
    searchName,
    bounds: fromLatLngBounds(bounds),
    fromUserAction,
  };
};

/**
 * Set the given bounds of the task map in the redux store as the current
 * bounds. If the bounds are being altered programatically in direct response
 * to a user action (as opposed to just panning or zooming around the map),
 * then set fromUserAction to true.
 *
 * @param bounds - either a LatLngBounds instance or an array of
 *       [west, south, east, north]
 *
 * @param {boolean} [fromUserAction=false] set to true to indicate the
 *        bounds were modified programatically in response to a user
 *        action, false if the bounds are simply being altered in response
 *        to normal panning and zooming.
 */
export const setTaskMapBounds = function (
  searchName,
  taskId,
  bounds,
  zoom,
  fromUserAction = false
) {
  return {
    type: SET_TASK_MAP_BOUNDS,
    searchName,
    taskId,
    bounds: fromLatLngBounds(bounds),
    zoom,
    fromUserAction,
  };
};

/**
 * Update the redux store with the given bounds of a challenge-owner map.
 *
 * @param bounds - either a LatLngBounds instance or an array of
 *       [west, south, east, north]
 */
export const setChallengeOwnerMapBounds = function (
  searchName,
  challengeId,
  bounds,
  zoom
) {
  return {
    type: SET_CHALLENGE_OWNER_MAP_BOUNDS,
    searchName,
    challengeId,
    bounds: fromLatLngBounds(bounds),
    zoom,
  };
};

/**
 * Remove from the redux store with the bounds associated with the given search name
 */
export const clearMapBounds = function (searchName) {
  return {
    type: CLEAR_MAP_BOUNDS,
    searchName,
  };
};

// The fetchId is used to help keep track of the latest
// fetch request.
export const fetchingResults = function (searchName, fetchId) {
  return {
    type: FETCHING_RESULTS,
    searchName,
    fetchId,
  };
};

// The fetchId is used to help keep track of multiple
// simultaneous fetches.
export const receivedResults = function (searchName, fetchId) {
  return {
    type: RECEIVED_RESULTS,
    searchName,
    fetchId,
    timestamp: new Date().getTime(),
  };
};

// async action creators
export const performSearch = function (
  searchName,
  query,
  asyncSearchAction,
  props
) {
  return function (dispatch) {
    const fetchId = _uniqueId();
    if (!query || query.length < 2) {
      return null;
    }

    const resultsPerPage = _get(query, "page.resultsPerPage");
    const actionToDo = asyncSearchAction(query, resultsPerPage, props);

    if (actionToDo) {
      dispatch(fetchingResults(searchName, fetchId));
      return dispatch(actionToDo)
        .then(() => dispatch(receivedResults(searchName, fetchId)))
        .catch((error) => {
          // 404 indicates no results.
          if (error.response && error.response.status === 404) {
            dispatch(receivedResults(searchName, fetchId));
          }
        });
    }
  };
};

// redux reducers
export const currentSearch = function (state = {}, action) {
  let mergedState = null;

  switch (action.type) {
    case SET_COMPLETE_SEARCH:
      mergedState = _cloneDeep(state);
      _set(mergedState, action.searchName, action.searchObject);
      return mergedState;
    case SET_SEARCH:
      mergedState = _cloneDeep(state);
      _set(mergedState, `${action.searchName}.query`, action.query);
      _set(mergedState, `${action.searchName}.page`, null);
      return mergedState;
    case CLEAR_SEARCH:
      mergedState = _cloneDeep(state);
      _set(mergedState, `${action.searchName}.query`, null);
      _set(mergedState, `${action.searchName}.page`, null);
      return mergedState;
    case FETCHING_RESULTS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.meta.fetchingResults`,
        action.fetchId
      );
      return mergedState;
    case RECEIVED_RESULTS:
      // If the fetchId of the action doesn't match the latest fetchId in the
      // state, ignore this action since we're still fetching other results.
      if (
        action.fetchId !==
        _get(state, `${action.searchName}.meta.fetchingResults`)
      ) {
        return state;
      } else {
        mergedState = _cloneDeep(state);
        _set(mergedState, `${action.searchName}.meta.fetchingResults`, null);
        _set(
          mergedState,
          `${action.searchName}.meta.receivedAt`,
          action.timestamp
        );
        return mergedState;
      }
    case SET_SORT:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.sort`,
        Object.assign(
          {},
          _get(state, `${action.searchName}.sort`),
          action.sortCriteria
        )
      );
      _set(mergedState, `${action.searchName}.page`, null);
      return mergedState;

    case REMOVE_SORT:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.sort`,
        Object.assign(
          {},
          _omit(_get(state, `${action.searchName}.sort`), action.criteriaNames)
        )
      );
      _set(mergedState, `${action.searchName}.page`, null);
      return mergedState;

    case SET_PAGE:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.page`,
        Object.assign({}, _get(state, `${action.searchName}.page`), action.page)
      );
      return mergedState;

    case REMOVE_PAGE:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.page`,
        Object.assign({}, _omit(_get(state, `${action.searchName}.page`)))
      );
      return mergedState;

    case SET_FILTERS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.filters`,
        Object.assign(
          {},
          _get(state, `${action.searchName}.filters`),
          action.filterCriteria
        )
      );
      _set(mergedState, `${action.searchName}.page`, null);
      return mergedState;

    case REMOVE_FILTERS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.filters`,
        Object.assign(
          {},
          _omit(
            _get(state, `${action.searchName}.filters`),
            action.criteriaNames
          )
        )
      );
      _set(mergedState, `${action.searchName}.page`, null);
      return mergedState;

    case CLEAR_FILTERS:
      return Object.assign({}, _omit(state, `${action.searchName}.filters`));

    case SET_CHALLENGE_SEARCH_MAP_BOUNDS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.mapBounds`,
        Object.assign({}, _get(state, `${action.searchName}.mapBounds`), {
          bounds: action.bounds,
          fromUserAction: action.fromUserAction,
        })
      );
      return mergedState;

    case SET_CHALLENGE_BROWSE_MAP_BOUNDS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.mapBounds`,
        Object.assign({}, _get(state, `${action.searchName}.mapBounds`), {
          challengeId: action.challengeId,
          bounds: action.bounds,
          zoom: action.zoom,
        })
      );
      return mergedState;

    case SET_TASK_MAP_BOUNDS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.mapBounds`,
        Object.assign({}, _get(state, `${action.searchName}.mapBounds`), {
          taskId: action.taskId,
          bounds: action.bounds,
          zoom: action.zoom,
          fromUserAction: action.fromUserAction,
        })
      );
      return mergedState;

    case SET_CHALLENGE_OWNER_MAP_BOUNDS:
      mergedState = _cloneDeep(state);
      _set(
        mergedState,
        `${action.searchName}.mapBounds`,
        Object.assign({}, _get(state, `${action.searchName}.mapBounds`), {
          challengeId: action.challengeId,
          bounds: action.bounds,
          zoom: action.zoom,
          updatedAt: Date.now(),
        })
      );
      return mergedState;

    case CLEAR_MAP_BOUNDS:
      return Object.assign({}, _omit(state, `${action.searchName}.mapBounds`));

    default:
      return state;
  }
};
