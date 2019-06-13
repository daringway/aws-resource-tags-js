'use strict';

function getTaggerByArn(resourceArn) {
    let service = resourceArn.split(':')[2];
    let region = resourceArn.split(':')[3];
    let accountId = resourceArn.split(':')[4];
    let resourceType = null;
    let resourceId = null;

    if (['lambda'].indexOf(service) >= 0) {
        resourceType = resourceArn.split(':')[5];
        resourceId = resourceArn.split(':')[6];
    }  else if (['ec2', 'subnet', 'cloudfront'].indexOf(service) >= 0 ) {
        let resource = resourceArn.split(':')[5];
        resourceType = resource.split('/')[0];
        resourceId = resource.split('/')[1];
    }

    let Tagger = require('./workers/' + service + '-' + resourceType);
    return new Tagger(resourceArn, service, region, accountId, resourceType, resourceId);
}

module.exports = { getTaggerByArn };
