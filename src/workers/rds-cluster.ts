"use strict";

import {Tagger, Tags, register, AwsApiConfig} from "./base";

class RDSTagger extends Tagger {

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : "RDS",
            awsApiVersion  : "2014-10-31"
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ResourceName: this.config.resourceArn
        };
        return this.getAws().awsFunction.listTagsForResource(params).promise()
            .then((data) => {
                return Tagger._akvToMap(data["TagList"]);
            });
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ResourceName: this.config.resourceArn,
            Tags: Tagger._kvMapToArray(tags)
        };

        return this.getAws().awsFunction.addTagsToResource(params).promise();
    };

    protected async _serviceDeleteTags(tagKeys : string[]) {
        let params = {
            ResourceName: this.config.resourceArn,
            TagKeys: tagKeys
        };

        return this.getAws().awsFunction.removeTagsFromResource(params).promise();
    }
}

register(RDSTagger, "rds", "cluster");