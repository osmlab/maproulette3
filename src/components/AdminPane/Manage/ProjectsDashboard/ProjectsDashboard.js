import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import {
  generateWidgetId,
  WidgetDataTarget,
  widgetDescriptor,
} from "../../../../services/Widget/Widget";
import {
  projectPassesFilters,
  defaultProjectFilters,
} from "../../../../services/Widget/ProjectFilter/ProjectFilter";
import WithManageableProjects from "../../HOCs/WithManageableProjects/WithManageableProjects";
import WithPinned from "../../HOCs/WithPinned/WithPinned";
import WithWidgetWorkspaces from "../../../HOCs/WithWidgetWorkspaces/WithWidgetWorkspaces";
import WithDashboardEntityFilter from "../../HOCs/WithDashboardEntityFilter/WithDashboardEntityFilter";
import WidgetWorkspace from "../../../WidgetWorkspace/WidgetWorkspace";
import ProjectFilterGroup from "../ProjectFilterGroup/ProjectFilterGroup";
import BusySpinner from "../../../BusySpinner/BusySpinner";
import manageMessages from "../Messages";
import messages from "./Messages";
import "./ProjectsDashboard.scss";
import Endpoint from "../../../../services/Server/Endpoint";
import { defaultRoutes as api } from "../../../../services/Server/Server";

// The name of this dashboard.
const DASHBOARD_NAME = "projects";

export const defaultDashboardSetup = function () {
  return {
    dataModelVersion: 2,
    name: DASHBOARD_NAME,
    id: generateWidgetId(),
    label: "Projects",
    filters: defaultProjectFilters(),
    widgets: [
      widgetDescriptor("ProjectAboutWidget"),
      widgetDescriptor("ProjectListWidget"),
    ],
    permanentWidgets: [
      // Cannot be removed from workspace
      "ProjectListWidget",
    ],
    layout: [
      { i: generateWidgetId(), x: 0, y: 0, w: 3, h: 18 },
      { i: generateWidgetId(), x: 3, y: 0, w: 9, h: 18 },
    ],
  };
};

const onClick = () => {
  const payload = [
    {
      id: -1,
      parent: 3676,
      name: "986527279945353057",
      geometries: {
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-110.9853284, 29.1030518],
                [-110.9848107, 29.1031104],
              ],
            },
            properties: {
              atlasIdentifier: "83891326000070",
              confidence: "3775.4499662215862",
              highwayTag: "TERTIARY",
              isPostprocessed: "0.0",
              maxCountRatio: "0.9999602606898744",
              predictedDirection: "TWO_WAY_TO_ONE_WAY_SAME_DIRECTION",
              predictionBasis: "PROBE",
              predictionScore: "1.0",
              totalTraceCount: "25164",
              zahlIdentifier: "756842252812164411",
            },
          },
        ],
      },
    },
    {
      id: -1,
      parent: 3676,
      name: "991030879501420943",
      geometries: {
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-89.657866, 21.2873282],
                [-89.6590262, 21.2872123],
              ],
            },
            properties: {
              atlasIdentifier: "42752183000003",
              confidence: "97.443400621118",
              highwayTag: "RESIDENTIAL",
              isPostprocessed: "0.0",
              maxCountRatio: "0.9922360248447205",
              predictedDirection: "TWO_WAY_TO_ONE_WAY_SAME_DIRECTION",
              predictionBasis: "PROBE",
              predictionScore: "1.0",
              totalTraceCount: "644",
              zahlIdentifier: "774856651435945423",
            },
          },
        ],
      },
    },
    {
      id: -1,
      parent: 3676,
      name: "986527279945353319",
      geometries: {
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-100.1577816, 21.1000818],
                [-100.1575623, 21.1005833],
              ],
            },
            properties: {
              atlasIdentifier: "205148184000001",
              confidence: "16.59190476190476",
              highwayTag: "RESIDENTIAL",
              isPostprocessed: "0.0",
              maxCountRatio: "0.9904761904761905",
              predictedDirection: "TWO_WAY_TO_ONE_WAY_SAME_DIRECTION",
              predictionBasis: "PROBE",
              predictionScore: "1.0",
              totalTraceCount: "105",
              zahlIdentifier: "761345852639813062",
            },
          },
        ],
      },
    },
  ];

  return new Endpoint(api.tasks.batchUpload, {
    json: payload,
  })
    .execute()
    .then((normalizedResults) => {
      debugger;
    })
    .catch((error) => {
      debugger;
    });
};

export class ProjectsDashboard extends Component {
  render() {
    if (!this.props.projects) {
      return <BusySpinner />;
    }

    const pageHeader = (
      <div className="admin__manage__header admin__manage__header--flush">
        <nav className="breadcrumb" aria-label="breadcrumbs">
          <ul>
            <li className="nav-title is-active">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a aria-current="page">
                <FormattedMessage {...manageMessages.manageHeader} />
              </a>
            </li>
          </ul>
        </nav>
        <button onClick={onClick} style={{ marginBottom: 10 }}>
          hello
        </button>
        <div className="admin__manage__controls mr-flex">
          <Link
            to={"/admin/projects/new"}
            className="mr-button mr-button--dark mr-button--small mr-mr-4"
          >
            <FormattedMessage {...messages.newProject} />
          </Link>
        </div>
      </div>
    );

    return (
      <div className="admin__manage projects-dashboard">
        <WidgetWorkspace
          {...this.props}
          lightMode={false}
          darkMode
          className="mr-mt-4 mr-cards-inverse"
          workspaceEyebrow={pageHeader}
          filterComponent={ProjectFilterGroup}
        />
      </div>
    );
  }
}

ProjectsDashboard.propTypes = {
  /** All manageable projects */
  projects: PropTypes.array.isRequired,
  /** The projects to be actually be displayed */
  filteredProjects: PropTypes.array,
  /** True if projects are currently being fetched from the server */
  loadingProjects: PropTypes.bool,
};

ProjectsDashboard.defaultProps = {
  loadingProjects: false,
};

export default WithWidgetWorkspaces(
  WithManageableProjects(
    WithDashboardEntityFilter(
      WithPinned(ProjectsDashboard),
      "project",
      "projects",
      "pinnedProjects",
      "filteredProjects",
      projectPassesFilters
    ),
    true // include challenges
  ),
  WidgetDataTarget.projects,
  DASHBOARD_NAME,
  defaultDashboardSetup
);
