'use strict';

import {Tagger, Tags, register, AwsApiConfig} from './base';


export default class EmrClusterTagger extends Tagger {


    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'EMR',
            awsApiVersion  : '2009-03-31',
            rateLimit   : 125,
            rateIncrease : 125,
            maxRateLimit : 2500
        };
    };

    private   state : string = null;

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            ClusterId: this.config.resourceId
        };
        let data = await this.getAwsFunction().describeCluster(params).promise();

        this.state = data['Cluster']['Status']['State'];

        return Tagger._akvToMap(data['Cluster']['Tags']);
    };

    public async isTaggableState() : Promise<boolean> {
        if (this.state == null) {
            await this.getAws().throttleFunction();
            await this._serviceGetTags();
        }
        if ( this.state.startsWith('TERM')) {
            return false;
        }
        return true;
    }

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            ResourceId: this.config.resourceId,
            Tags: Tagger._kvMapToArray(tags)
        };
        try {
            await this.getAwsFunction().addTags(params).promise();
            return;
        } catch (err) {
            if ( err.message === 'Tags cannot be modified on terminated clusters.') {
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
        return this.getAwsFunction().removeTags(params).promise();
    }
}

register(EmrClusterTagger, 'elasticmapreduce', 'cluster');