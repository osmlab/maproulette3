import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, FormattedTime, FormattedDate, injectIntl }
       from 'react-intl'
import parse from 'date-fns/parse'
import isAfter from 'date-fns/is_after'
import _map from 'lodash/map'
import _compact from 'lodash/compact'
import _isEmpty from 'lodash/isEmpty'
import _sortBy from 'lodash/sortBy'
import _find from 'lodash/find'
import _get from 'lodash/get'
import AsMappableTask
       from '../../interactions/Task/AsMappableTask'
import AsIdentifiableFeature
       from '../../interactions/TaskFeature/AsIdentifiableFeature'
import { mapColors } from '../../interactions/User/AsEndUser'
import Dropdown from '../Dropdown/Dropdown'
import SvgSymbol from '../SvgSymbol/SvgSymbol'
import BusySpinner from '../BusySpinner/BusySpinner'
import messages from './Messages'

const OSM_SERVER = process.env.REACT_APP_OSM_SERVER

const OSMElementHistory = props => {
  const [selectedFeatureId, setSelectedFeatureId] = useState(null)
  const [history, setHistory] = useState(null)
  const [fetchingElement, setFetchingElement] = useState(null)

  const { task, fetchOSMElementHistory } = props
  const taskId = task.id
  const geometries = AsMappableTask(task).normalizedGeometries()
  const featureIds = geometries ? _compact(_map(
    geometries.features,
    f => AsIdentifiableFeature(f).normalizedTypeAndId(true, '/')
  )) : null

  useEffect(() => {
    const activeFeatureId = selectedFeatureId ? selectedFeatureId : featureIds[0]

    // If we're already fetching data for the active feature, nothing to do
    if (fetchingElement === activeFeatureId) {
      return
    }

    if (!_isEmpty(history)) {
      if (_isEmpty(featureIds)) {
        // Clear history since no feature ids for this task
        setHistory(null)
        return
      }
      else if (`${history[0].type}/${history[0].id}` === activeFeatureId) {
        // We already have history for this feature, so nothing to do
        return
      }
    }
    else if (_isEmpty(featureIds)) {
      // No features to fetch, so nothing to do
      return
    }

    setFetchingElement(activeFeatureId)
    fetchOSMElementHistory(activeFeatureId, true).then(historyEntries => {
      // Sort history entries by version, reversing to get descending order
      setHistory(_sortBy(historyEntries, 'version').reverse())
      setFetchingElement(null)
    })
  }, [taskId, selectedFeatureId, featureIds, history, fetchingElement, fetchOSMElementHistory])

  if (fetchingElement) {
    return (
      <div className="mr-flex mr-justify-center mr-items-center mr-w-full mr-h-full">
        <BusySpinner />
      </div>
    )
  }

  if (!history) {
    return (
      <FormattedMessage {...messages.noOSMElements} />
    )
  }

  const activeFeatureId = selectedFeatureId ? selectedFeatureId : featureIds[0]
  const featureProperties = AsMappableTask(task).propertiesForOSMFeature(activeFeatureId)
  const featureChangeset =
    featureProperties.osmVersion || featureProperties.last_edit_changeset
  const sourceDate = _get(task, 'parent.dataOriginDate')

  const entries = _map(history, entry =>
    <HistoryEntry
      key={`${entry.type}/${entry.id}-${entry.version}`}
      {...entry}
      featureChangeset={featureChangeset}
      sourceDate={sourceDate}
      intl={props.intl}
    />
  )

  return (
    <div className="mr-mr-4">
      {!featureChangeset && !sourceDate &&
       <div className="mr-text-red-light mr-mb-4">
         <FormattedMessage {...messages.undeterminedVersion} />
       </div>
      }

      <div class="mr-flex mr-justify-between mr-links-green-lighter mr-mb-4">
        <FeatureSelectionDropdown
          featureIds={featureIds}
          selectedFeatureId={activeFeatureId}
          selectFeatureId={setSelectedFeatureId}
        />
        <a
          className="mr-button mr-button--xsmall"
          href={`${OSM_SERVER}/${activeFeatureId}/history`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FormattedMessage {...messages.viewOSMLabel} />
        </a>
      </div>

      <ol>
        {entries}
      </ol>
    </div>
  )
}

OSMElementHistory.propTypes = {
  task: PropTypes.object,
  fetchOSMElementHistory: PropTypes.func.isRequired,
}

const HistoryEntry = props => {
  const timestamp = parse(props.timestamp)
  const sourceDate = props.sourceDate ? parse(props.sourceDate) : new Date()
  const changesetComment = _find(
    _get(props, 'changeset.tag', []),
    tag => tag.k === "comment"
  )

  const isRecent =
    (props.featureChangeset && props.featureChangeset < props.version) ||
    isAfter(timestamp, sourceDate)

  return (
    <li className="mr-mb-4 mr-text-white mr-text-sm">
      <div className="mr-flex mr-justify-between mr-text-xs mr-font-bold mr-mb-1">
        <div>
          <FormattedTime
            value={timestamp}
            hour='2-digit'
            minute='2-digit'
          />, <FormattedDate
            value={timestamp}
            year='numeric'
            month='long'
            day='2-digit'
          />
        </div>
        <div className="mr-text-pink">
          <FormattedMessage {...messages.versionLabel} values={{version: props.version}} />
        </div>
      </div>

      <div className="mr-rounded-sm mr-p-2 mr-bg-black-15 mr-relative">
        {isRecent &&
          <SvgSymbol
            sym="recent-change-icon"
            viewBox="0 0 26 26"
            className="mr-fill-gold mr-w-6 mr-h-6 mr-absolute mr-top-0 mr-right-0 mr-mt-1 mr-mr-1"
            title={props.intl.formatMessage(messages.recentChangeTooltip)}
          />
        }
        <div
          className="mr-mb-2"
          style={{color: mapColors(props.user)}}
        >
          {props.user}
        </div>
        <div className="mr-flex">
          <SvgSymbol
            sym="comments-icon"
            viewBox="0 0 20 20"
            className="mr-fill-current mr-flex-shrink-0 mr-w-4 mr-h-4 mr-mt-1 mr-mr-2"
          />
          <div>
            {changesetComment ?
             changesetComment.v :
             <span className="mr-text-grey-light">
               <FormattedMessage {...messages.noComment} />
             </span>
            }
          </div>
        </div>
      </div>
    </li>
  )
}

const FeatureSelectionDropdown = props => {
  const menuItems =
    _map(props.featureIds, featureId => (
      <li key={featureId}>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a onClick={() => props.selectFeatureId(featureId)}>
          {featureId}
        </a>
      </li>
    ))

  if (menuItems.length === 0) {
    return null
  }

  return (
    <Dropdown
      {...props}
      className="mr-dropdown"
      dropdownButton={dropdown => (
        <React.Fragment>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a className="mr-flex" onClick={dropdown.toggleDropdownVisible}>
            <div className="mr-mr-2">
              {props.selectedFeatureId}
            </div>
            <SvgSymbol
              sym="icon-cheveron-down"
              viewBox="0 0 20 20"
              className="mr-fill-current mr-w-5 mr-h-5"
            />
          </a>
        </React.Fragment>
      )}
      dropdownContent={dropdown =>
        <ol className="mr-list-dropdown">
          {menuItems}
        </ol>
      }
    />
  )
}

export default injectIntl(OSMElementHistory)