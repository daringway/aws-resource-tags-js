"use strict";

import { Tagger, Tags, register }  from "./base";

class DynamoDBTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "DynamoDB"; };
    protected _getAwsApiVersion() : string { return "2012-08-10"; };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ResourceArn: this.config.resourceArn
        };
        let data = await this.getAwsFunction().listTagsOfResource(params).promise();
        return Tagger._akvToMap(data["Tags"]);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ResourceArn: this.config.resourceArn,
            Tags: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().tagResource(params).promise();
    };

    protected async _serviceDeleteTags(tagList : string[]) {
        let params = {
            ResourceArn: this.config.resourceArn,
            TagKeys: tagList
        };
        return this.getAwsFunction().untagResource(params).promise();
    };
}

register(DynamoDBTagger, "dynamodb", "table");