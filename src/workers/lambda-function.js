'use strict';

const BaseWorker = require('./base');

module.exports = class Worker extends BaseWorker {
    constructor(...args) {
        super(...args, 'Lambda', '2015-03-31');
    }

    serviceGetTags() {
        let params = {
            Resource: this.arn
        };
        
        return this.awsFunction.listTags(params).promise()
            .then(function(data) {
                return data['Tags'];
        });
    };

    serviceUpdateTags(tags) {
        let params = {
            Resource: this.arn,
            Tags: tags
        };

        return this.awsFunction.tagResource(params).promise()
            .then(function() {
                return ;
            });
    };

    serviceDeleteTags(tags) {
        let params = {
            Resource: this.arn,
            TagKeys: tags
        };

        return this.awsFunction.untagResource(params).promise()
            .then(function() {
                return ;
            });
    }
}

