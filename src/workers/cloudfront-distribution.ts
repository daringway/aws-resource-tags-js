'use strict';

import { Tagger, Tags, register, AwsApiConfig }  from './base';

class CloudfrontDistributionTagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'CloudFront',
            awsApiVersion  : '2018-11-05'
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            Resource: this.config.resourceArn
        };

        let aws = this.getAws().awsFunction;
        let data = await aws.listTagsForResource(params).promise();
        return Tagger._akvToMap(data['Tags']['Items']);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            Resource: this.config.resourceArn,
            Tags: {
                Items: Tagger._kvMapToArray(tags),
            }
        };
        return this.getAwsFunction().tagResource(params).promise();
    };

    protected async _serviceDeleteTags(tags : string[]) {
        let params = {
            Resource: this.config.resourceArn,
            TagKeys: {
                Items: tags
            }
        };
        return this.getAwsFunction().untagResource(params).promise();
    };
}

register(CloudfrontDistributionTagger, 'cloudfront', 'distribution');