'use strict';

import {Tagger, Tags, register, AwsApiConfig} from './base';

export default class Ec2InstanceTagger extends Tagger {

    protected state : string = null;

    protected getAwsApiConfig(): AwsApiConfig {
        return {
            awsLibraryName : 'EC2',
            awsApiVersion  : '2016-11-15'
        };
    };

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            Filters: [
                {
                    Name: 'resource-id',
                    Values: [
                        this.config.resourceId
                    ]
                }
            ]
        };
        let data = await this.getAwsFunction().describeTags(params).promise();
        return Tagger._akvToMap(data['Tags']);
    };

    protected async _serviceUpdateTags(tags : Tags) {
        let params = {
            Resources: [
                this.config.resourceId
            ],
            Tags: Tagger._kvMapToArray(tags)
        };
        return this.getAwsFunction().createTags(params).promise();
    };

    async isTaggableState(): Promise<boolean> {
        if (this.state == null) {
            let params = {
                InstanceIds: [
                    this.config.resourceId
                ]
            };
            try {
                await this.getAws().throttleFunction();
                let data = await this.getAwsFunction().describeInstances(params).promise();
                this.state = data['Reservations'][0]['Instances'][0]['State']['Name'];
            } catch(err) {
                throw err;
            }

        }
        return ['running', 'stopping', 'stopped', 'pending'].includes(this.state)
    }

    protected async _serviceDeleteTags(tagList : string[]) {
        let params = {
            Resources: [
                this.config.resourceId
            ],
            Tags: Tagger._keyListToListMap(tagList)
        };
        return this.getAwsFunction().deleteTags(params).promise();
    };
}

register(Ec2InstanceTagger, 'ec2', 'instance');