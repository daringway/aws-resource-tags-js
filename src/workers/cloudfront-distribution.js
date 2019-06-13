'use strict';

const BaseWorker = require('./base');

module.exports = class Worker extends BaseWorker {
    constructor(...args) {
        super(...args, 'CloudFront', '2018-11-05');
    }

    serviceGetTags() {
        let params = {
            Resource: this.arn
        };

        return this.awsFunction.listTagsForResource(params).promise()
            .then((data) => {
                return this.akvToMap(data['Tags']['Items']);
            });
    };

    serviceUpdateTags(tags) {
        let params = {
            Resource: this.arn,
            Tags: {
                Items: this.kvMapToArray(tags),
            }
        };

        return this.awsFunction.tagResource(params).promise()
            .then((data) => {
                return;
            });
    };

    serviceDeleteTags(tags) {
        let params = {
            Resource: this.arn,
            TagKeys: {
                Items: tags
            }
        };

        return this.awsFunction.untagResource(params).promise()
            .then((data) => {
                return;
            });
    }

}

