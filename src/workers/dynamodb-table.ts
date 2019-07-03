'use strict';

import { Tagger, register }  from "./base";

class DynamoDBTagger extends Tagger {

    protected _getAwsLibraryName() : string { return 'DynamoDB'; };
    protected _getAwsApiVersion() : string { return '2012-08-10'; };

    protected _serviceGetTags() {
        let params = {
            ResourceArn: this.config.resourceArn
        };
        return this.getAwsFunction().listTagsOfResource(params).promise()
            .then((data) => {
                return this._akvToMap(data['Tags']);
            });
    };

    protected _serviceUpdateTags(tags) {
        let params = {
            ResourceArn: this.config.resourceArn,
            Tags: this._kvMapToArray(tags)
        };
        return this.getAwsFunction().tagResource(params).promise();
    }

    protected _serviceDeleteTags(tagList) {
        let params = {
            ResourceArn: this.config.resourceArn,
            TagKeys: tagList
        };
        return this.getAwsFunction().untagResource(params).promise();
    }
};

register(DynamoDBTagger, 'dynamodb', 'table');