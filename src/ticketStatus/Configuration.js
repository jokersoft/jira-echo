const yaml = require('js-yaml');
const fs   = require('fs');
const DEFAULT_CONFIGURATION_FILE = 'status-configuration.yaml';
const DEFAULT_CONFIGURATION_FILE_ENCODING = 'utf8';

class Configuration {
    constructor() {
        try {
            this.configuration = yaml.load(
                fs.readFileSync(DEFAULT_CONFIGURATION_FILE, DEFAULT_CONFIGURATION_FILE_ENCODING)
            );
        } catch (e) {
            console.error('Configuration parse error');
            console.error(e);
        }
    }

    /**
     * Checks we have a configuration for project
     * @param projectKey string
     * @returns {boolean}
     */
    supports(projectKey) {
        return this.configuration.hasOwnProperty(projectKey);
    }

    /**
     * Checks we have configuration also for target
     * @param sourceProjectKey string
     * @param targetProjectKey string
     * @returns {boolean}
     */
    supportsUpdate(sourceProjectKey, targetProjectKey) {
        const projectConfig = this.forProject(sourceProjectKey);

        return projectConfig.updateRelatedTicketStatus.hasOwnProperty(targetProjectKey);
    }

    forProject(projectKey) {
        let configuration = {};

        return this.configuration[projectKey];
    }

    get() {
        return this.configuration;
    }
}

module.exports = Configuration;
