const https = require('https');
const auth = require('../auth');

class IssueStatusUpdate {
    constructor() {
    }

    transitionIssue(issueKey, transitionConfiguration, callback) {
        // @see https://docs.atlassian.com/software/jira/docs/api/REST/7.11.0/#api/2/issue-doTransition
        let issueTransitionRequest = {
            transition: {
                id: transitionConfiguration.transitionId
            }
        };

        // additionalFields
        if (transitionConfiguration.additionalFields) {
            for (const additionalField of transitionConfiguration.additionalFields) {
                console.log('additionalField');
                console.log(additionalField);

                const additionalFieldName = additionalField.name;
                // TODO: support both JSON and yaml objects
                const additionalFieldValueObject = JSON.parse(additionalField.value)

                console.log('additionalFieldName');
                console.log(additionalFieldName);
                console.log('additionalFieldValueObject');
                console.log(additionalFieldValueObject);

                issueTransitionRequest[additionalFieldName] = additionalFieldValueObject;

                console.log('issueTransitionRequest');
                console.log(issueTransitionRequest);
            }
        }

        console.log('issueTransitionRequest');
        console.log(issueTransitionRequest);

        const authorizationHeader = auth.prepareAuthorizationHeader();
        const requestData = JSON.stringify(issueTransitionRequest);
        console.debug(requestData);
        const options = {
            hostname: auth.getJiraDns,
            port: auth.getJiraPort,
            path: '/rest/api/2/issue/' + issueKey + '/transitions',
            method: 'POST',
            headers: {
                'Authorization': authorizationHeader,
                'Content-Type': 'application/json',
                'Content-Length': requestData.length
            }
        }
        console.log(options);

        const req = https.request(options, res => {
            let responseData = '';
            res.on('data', function (chunk) {responseData += chunk;});
            res.on('end', function () {
                // responseData = JSON.stringify({
                //     id: "38077",
                //     key: "BS-2",
                //     self: "https://comtravo.atlassian.net/rest/api/2/issue/38077"
                // });
                console.log('res.statusCode');
                console.log(res.statusCode);

                let responseJson;

                if (Number(res.statusCode) !== 204) {
                    responseJson = JSON.parse(responseData);
                }

                if (res.statusCode > 299) {
                    console.log('IssueStatusUpdate error');
                    throw 'IssueStatusUpdate error: ' + responseData;
                }

                if (undefined !== callback && typeof callback === 'function') {
                    console.log('IssueStatusUpdate callback');
                    callback(responseJson);
                }
            });
        })

        req.on('error', error => {
            throw error.message;
        })

        req.write(requestData);
        req.end();
    }
}

module.exports = IssueStatusUpdate;
