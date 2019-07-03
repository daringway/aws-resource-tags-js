'use strict';

import { Tagger, register }  from "./base";

class CloudfrontDistributionTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'CloudFront'; };
    protected _getAwsApiVersion()  : string { return '2018-11-05'; };


    protected async _serviceGetTags() : Promise<object> {
        let params = {
            Resource: this.config.resourceArn
        };

        let aws = this.getAwsFunction();
        return aws.listTagsForResource(params).promise()
            .then((data) => {
                return this._akvToMap(data['Tags']['Items']);
            });
    };

    protected async _serviceUpdateTags(tags) {
        let params = {
            Resource: this.config.resourceArn,
            Tags: {
                Items: this._kvMapToArray(tags),
            }
        };

        return this.getAwsFunction().tagResource(params).promise()
            .then((data) => {
                return;
            });
    };

    protected async _serviceDeleteTags(tags) {
        let params = {
            Resource: this.config.resourceArn,
            TagKeys: {
                Items: tags
            }
        };

        return this.getAwsFunction().untagResource(params).promise()
            .then((data) => {
                return;
            });
    }
};

register(CloudfrontDistributionTagger, 'cloudfront', 'distribution');