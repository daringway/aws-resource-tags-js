"use strict";

import { Tagger, Tags, register }  from "./base";

class CloudfrontDistributionTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "CloudFront"; };
    protected _getAwsApiVersion()  : string { return "2018-11-05"; };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            Resource: this.config.resourceArn
        };

        let aws = this.getAwsFunction();
        let data = await aws.listTagsForResource(params).promise();
        return Tagger._akvToMap(data["Tags"]["Items"]);
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

register(CloudfrontDistributionTagger, "cloudfront", "distribution");