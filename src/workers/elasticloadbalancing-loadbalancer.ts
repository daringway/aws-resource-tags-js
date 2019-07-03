"use strict";

import { Tagger, Tags, register }  from "./base";

class ELBTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "ELBv2"; };
    protected _getAwsApiVersion () : string { return "2015-12-01"; };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ResourceArns: [
                this.config.resourceArn
            ]
        };
        let data = await this.getAwsFunction().describeTags(params).promise();
        return Tagger._akvToMap(data["TagDescriptions"][0]["Tags"]);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ResourceArns: [
                this.config.resourceArn
            ],
            Tags: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().addTags(params).promise()
    }

    protected async _serviceDeleteTags(tagList : string[]) {
        let params = {
            ResourceArns: [
                this.config.resourceArn
            ],
            TagKeys: tagList
        };
        return this.getAwsFunction().removeTags(params).promise()
    }
}

register(ELBTagger, "elasticloadbalancing", "loadbalancer");