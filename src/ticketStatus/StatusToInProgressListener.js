const Configuration = require('./Configuration');

class StatusToInProgressListener {
    constructor() {
        this.configuration = new Configuration();
    }

    isStatusWatched(event) {
        return this.getEventStatusNameFromConfiguration(event) !== null;
    }

    getEventStatusId(event) {
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

    getEventStatusNameFromConfiguration(event) {
        let eventStatusName = null;

        const eventStatusId = this.getEventStatusId(event);
        const projectConfig = this.configuration.forProject(event.issue.fields.project.key);
        const watchStatusChange = projectConfig.watchStatusChange;

        Object.keys(watchStatusChange).forEach(function(name) {
            const statusChangeId = Number(watchStatusChange[name]);

            if (statusChangeId === eventStatusId) {
                eventStatusName = name;
            }
        });

        return eventStatusName;
    }

    updateRelatedTicketStatus(relatedIssueKey, statusTo) {
        console.debug('Updating ' + relatedIssueKey + ' ticket status: ' + statusTo);

        return;
    }

    /**
     * @param {StatusToInProgressEvent} event
     * @param {function} callback
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
            return;
        }

        const issueLinks = event.issue.fields.issuelinks;
        const statusTo = this.getEventStatusNameFromConfiguration(event);

        // foreach
        // - updateRelatedTicketStatus project
        //   - try get related ticket from project
        //   - try get configuration for project statusName
        //   - update related ticket status with project statusName id
        for (const issueLink of issueLinks) {
            const relatedIssueKey = issueLink.inwardIssue.key;
            const relatedProjectKey = relatedIssueKey.split('-')[0];

            if (!this.configuration.supportsUpdate(sourceProjectKey, relatedProjectKey)) {
                continue;
            }

            this.updateRelatedTicketStatus(relatedIssueKey, statusTo);
        }

        if (undefined !== callback && typeof callback === 'function') {
            console.log('calling the callback');
            callback(event);
        }
    }
}

module.exports = StatusToInProgressListener;
