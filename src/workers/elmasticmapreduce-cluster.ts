"use strict";

import {Tagger, Tags, register, TaggerConfig, TaggerLimits} from "./base";

let emrLimits : TaggerLimits = {
    rateLimit   : 125,
    rateIncrease : 125,
    maxRateLimit : 2500
};

export default class EmrClusterTagger extends Tagger {

    protected _getAwsLibraryName() : string { return "EMR"; };
    protected _getAwsApiVersion () : string { return "2009-03-31"; };

    private   state : string = null;

    constructor(config : TaggerConfig) {
        super(config);
    }

    public getLimits() : TaggerLimits {
        return emrLimits;
    }

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ClusterId: this.config.resourceId
        };
        let data = await this.getAwsFunction().describeCluster(params).promise();

        this.state = data["Cluster"]["Status"]["State"];

        return Tagger._akvToMap(data["Cluster"]["Tags"]);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ResourceId: this.config.resourceId,
            Tags: Tagger._kvMapToArray(tags)
        };
        try {
            if (this.state == undefined) {
                await this._serviceGetTags();
            }
            if ( this.state.startsWith("TERM")) {
            //    Terminate so can not update tags.
            //    AWS doesn't like an attempt to update a tag that can not be updated.
                return;
            }
            await this.getAwsFunction().addTags(params).promise();
            return;
        } catch (err) {
            if ( err.message === "Tags cannot be modified on terminated clusters.") {
                return
            } else {
                throw err;
            }
        }
    };

    protected async _serviceDeleteTags(tagKeys : string[]) {
        let params = {
            ResourceId: this.config.resourceId,
            TagKeys: tagKeys
        };
        if (this.state == undefined) {
            await this._serviceGetTags();
        }
        if ( this.state.startsWith("TERM")) {
            //    Terminate so can not update tags.
            return;
        }
        return this.getAwsFunction().removeTags(params).promise();
    }
}

register(EmrClusterTagger, "elasticmapreduce", "cluster");