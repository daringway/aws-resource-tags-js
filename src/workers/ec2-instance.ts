'use strict';

import { Tagger, register }  from "./base";

export default class Ec2InstanceTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'EC2'; };
    protected _getAwsApiVersion () : string { return '2016-11-15'; };


    protected _serviceGetTags() {
        let params = {
            Filters: [
                {
                    Name: "resource-id",
                    Values: [
                        this.config.resourceId
                    ]
                }
            ]
        };
        return this.getAwsFunction().describeTags(params).promise()
            .then((data) => {
                return this._akvToMap(data['Tags']);
            });
    };

    protected _serviceUpdateTags(tags) {
        let params = {
            Resources: [
                this.config.resourceId
            ],
            Tags: this._kvMapToArray(tags)
        };
        return this.getAwsFunction().createTags(params).promise();
    }

    protected _serviceDeleteTags(tagList) {
        let params = {
            Resources: [
                this.config.resourceId
            ],
            Tags: this._keyListToListMap(tagList)
        };

        return this.getAwsFunction().deleteTags(params).promise();
    }
};

register(Ec2InstanceTagger, 'ec2', 'instance');