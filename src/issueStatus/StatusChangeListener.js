const Configuration = require('./Configuration');
const IssueStatusUpdate = require('./IssueStatusUpdate');

class StatusChangeListener {
    constructor() {
        this.configuration = new Configuration();
    }

    isStatusWatched(event) {
        const eventStatusId = this.getEventStatusToId(event);
        const projectConfig = this.configuration.forProject(event.issue.fields.project.key);
        const watchStatusChange = projectConfig.watchStatusChange;
        console.log('watchStatusChange')
        console.log(watchStatusChange)
        console.log('isStatusWatched')
        console.log(watchStatusChange.includes(eventStatusId))

        return watchStatusChange.includes(eventStatusId);
    }

    getEventStatusFromId(event) {
        let statusId = null;

        const changelogItems = event.changelog.items;
        for (const changeRecord of changelogItems) {
            if (changeRecord.field === 'status') {
                statusId = changeRecord.from;
                break;
            }
        }

        return Number(statusId);
    }

    getEventStatusToId(event) {
        let statusId = null;

        const changelogItems = event.changelog.items;
        for (const changeRecord of changelogItems) {
            if (changeRecord.field === 'status') {
                statusId = changeRecord.to;
                break;
            }
        }

        return Number(statusId);
    }

    performTicketTransition(issueKey, transitionConfiguration, callback) {
        console.debug('Updating ' + issueKey + ' with transitionId: ' + transitionConfiguration.transitionId);
        let issueStatusUpdate = new IssueStatusUpdate();
        issueStatusUpdate.transitionIssue(issueKey, transitionConfiguration, callback);
    }

    /**
     * @param {event} event
     * @param {function|null} callback
     * @return {void}
     */
    react(event, callback) {
        if (!this.configuration.supports(event.issue.fields.project.key)) {
            console.debug('Unsupported project');
            return;
        }

        const sourceProjectKey = event.issue.fields.project.key;
        const sourceProjectConfig = this.configuration.forProject(sourceProjectKey);

        console.debug('Supported project (BUGS)');
        console.debug('Config for BUGS:');
        console.debug(sourceProjectConfig);

        if (!this.isStatusWatched(event)) {
            console.debug('isStatusWatched NOT');
            throw 'Unsupported status';
        }

        const issueLinks = event.issue.fields.issuelinks;
        const statusFrom = this.getEventStatusFromId(event);
        const statusTo = this.getEventStatusToId(event);

        for (const issueLink of issueLinks) {
            // get related ticket from project
            const relatedIssueKey = issueLink.inwardIssue.key;
            // get project key of related ticket
            const relatedProjectKey = relatedIssueKey.split('-')[0];

            if (!this.configuration.supportsUpdate(sourceProjectKey, relatedProjectKey)) {
                continue;
            }

            //TODO: check if ticket has jira-echo label

            // get matching transitionConfiguration
            const transitionConfiguration = this.configuration.getTransitionConfiguration(sourceProjectKey, relatedProjectKey, statusFrom, statusTo);
            console.log('transitionConfiguration');
            console.log(transitionConfiguration);

            //TODO error if transitionConfiguration is null

            // get status id of target status from configuration
            console.log('transitionId');
            console.log(transitionConfiguration.transitionId);

            this.performTicketTransition(relatedIssueKey, transitionConfiguration, callback)
        }
    }
}

module.exports = StatusChangeListener;
