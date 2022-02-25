const { EventEmitter, errorMonitor } = require('events');
const StatusToInProgressListener = require('./StatusToInProgressListener')

class IssueStatusEventEmitter extends EventEmitter {}

const statusToInProgressListener = new StatusToInProgressListener();
const issueStatusEventEmitter = new IssueStatusEventEmitter();

issueStatusEventEmitter.on(errorMonitor, (err) => {
    console.error(err);
});

issueStatusEventEmitter.on('statusChanged:inProgress', (requestPayload) => {
    console.log('statusChanged:inProgress event occurred!');
    statusToInProgressListener.react(requestPayload);
});

module.exports.issueStatusEventEmitter = issueStatusEventEmitter;
