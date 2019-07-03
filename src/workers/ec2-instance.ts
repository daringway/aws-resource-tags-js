'use strict';

import { Tagger, register }  from "./base";

export default class Ec2InstanceTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'EC2'; };
    protected _getAwsApiVersion () : string { return '2016-11-15'; };

    protected async _serviceGetTags() : Promise<object> {
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
        let data = await this.getAwsFunction().describeTags(params).promise()
        return this._akvToMap(data['Tags']);
    };

    protected async _serviceUpdateTags(tags) {
        let params = {
            Resources: [
                this.config.resourceId
            ],
            Tags: this._kvMapToArray(tags)
        };
        return this.getAwsFunction().createTags(params).promise();
    }

    protected async _serviceDeleteTags(tagList) {
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