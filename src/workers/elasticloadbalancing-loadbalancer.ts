'use strict';

import { Tagger, register }  from "./base";

class ELBTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'ELBv2'; };
    protected _getAwsApiVersion () : string { return '2015-12-01'; };

    protected async _serviceGetTags() : Promise<object> {
        let params = {
            ResourceArns: [
                this.config.resourceArn
            ]
        };
        return this.getAwsFunction().describeTags(params).promise()
            .then((data) => {
                return this._akvToMap(data['TagDescriptions'][0]['Tags']);
            });
    };

    protected async _serviceUpdateTags(tags) {
        let params = {
            ResourceArns: [
                this.config.resourceArn
            ],
            Tags: this._kvMapToArray(tags)
        };
        return this.getAwsFunction().addTags(params).promise()
    }

    protected async _serviceDeleteTags(tagList) {
        let params = {
            ResourceArns: [
                this.config.resourceArn
            ],
            TagKeys: tagList
        };
        return this.getAwsFunction().removeTags(params).promise()

    }
};

register(ELBTagger, 'elasticloadbalancing', 'loadbalancer');