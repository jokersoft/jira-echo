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

        return projectConfig.updateRelatedIssueStatus.hasOwnProperty(targetProjectKey);
    }

    getTransitionConfiguration(sourceProjectKey, targetProjectKey, statusFrom, statusTo) {
        let matchingConfig;
        const projectConfig = this.forProject(sourceProjectKey);
        const targetProjectConfig = projectConfig.updateRelatedIssueStatus[targetProjectKey]

        for (const config of targetProjectConfig) {
            console.log('config');
            console.log(config);
            if (config.originFromStatus === statusFrom && config.originToStatus === statusTo) {
                matchingConfig = config;
            }
        }

        console.log('matchingConfig');
        console.log(matchingConfig);
        return matchingConfig;
    }

    forProject(projectKey) {
        let configuration = {};

        return this.configuration[projectKey];
    }
}

module.exports = Configuration;
