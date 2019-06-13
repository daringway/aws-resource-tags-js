'use strict';

const BaseWorker = require('./base');

module.exports = class Worker extends BaseWorker {
    constructor(...args) {
        super(...args, 'EC2', '2016-11-15');
    }

    serviceGetTags() {
        let params = {
            Filters: [
                {
                    Name: "resource-id",
                    Values: [
                        this.resourceId
                    ]
                }
            ]
        };
        return this.awsFunction.describeTags(params).promise()
            .then((data) => {
                return this.akvToMap(data['Tags']);
            });
    };

    serviceUpdateTags(tags) {
        let params = {
            Resources: [
                this.resourceId
            ],
            Tags: this.kvMapToArray(tags)
        };
        return this.awsFunction.createTags(params).promise()
            .then(() => {
                return ;
            });
    }

    serviceDeleteTags(tagList) {
        let params = {
            Resources: [
                this.resourceId
            ],
            Tags: this.keyListToListMap(tagList)
        }

        return this.awsFunction.deleteTags(params).promise()
            .then(() => {
                return ;
            });

    }
}

