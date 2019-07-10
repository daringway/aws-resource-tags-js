"use strict";

import { Tagger, Tags, register }  from "./base";

class ElasticSearchTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "ES"; };
    protected _getAwsApiVersion () : string { return "2015-01-01"; };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ARN: this.config.resourceArn
        };
        let data = await this.getAwsFunction().listTags(params).promise();
        return Tagger._akvToMap(data["TagList"]);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ARN: this.config.resourceArn,
            TagList: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().addTags(params).promise();
    };

    protected async _serviceDeleteTags(tagKeys : string[]) {
        let params = {
            ARN: this.config.resourceArn,
            TagKeys: tagKeys
        };
        return this.getAwsFunction().removeTags(params).promise();
    }
}

register(ElasticSearchTagger, "es", "domain");