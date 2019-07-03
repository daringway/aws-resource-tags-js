"use strict";

import { Tagger, register }  from "./base";

class DynamoDBTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "DynamoDB"; };
    protected _getAwsApiVersion() : string { return "2012-08-10"; };

    protected async _serviceGetTags() : Promise<object[]> {
        let params = {
            ResourceArn: this.config.resourceArn
        };
        return this.getAwsFunction().listTagsOfResource(params).promise()
            .then((data) => {
                return Tagger._akvToMap(data["Tags"]);
            });
    };

    protected async _serviceUpdateTags(tags) {
        let params = {
            ResourceArn: this.config.resourceArn,
            Tags: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().tagResource(params).promise();
    };

    protected async _serviceDeleteTags(tagList) {
        let params = {
            ResourceArn: this.config.resourceArn,
            TagKeys: tagList
        };
        return this.getAwsFunction().untagResource(params).promise();
    };
}

register(DynamoDBTagger, "dynamodb", "table");