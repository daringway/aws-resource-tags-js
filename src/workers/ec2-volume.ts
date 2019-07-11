"use strict";

import {Tagger, Tags, register} from "./base";
import Ec2InstanceTagger  from "./ec2-instance";

class Ec2VolumeTagger extends Ec2InstanceTagger {

    protected async _serviceGetTags() : Promise<Tags> {
        let params = {
            Filters: [
                {
                    Name: "ec2-volume",
                    Values: [
                        this.config.resourceId
                    ]
                }
            ]
        };
        let data = await this.getAws().awsFunction.describeVolumes(params).promise();
        return Tagger._akvToMap(data["Volumes"][0]["Tags"]);

    };

    public async isTaggableState(): Promise<boolean> {
        if (this.state == null) {
            var params = { Filters: [
                {
                    Name: 'volume-id',
                    Values: [
                        this.config.resourceId
                    ]
                }
                ]
            };
            try {
                let data = await this.getAws().awsFunction.describeVolumes(params).promise();
                this.state = data["Volumes"][0]["State"];
            } catch(err) {
                throw err;
            }
        }
        return ["available", "in-use"].includes(this.state)
    }
}

register(Ec2VolumeTagger, "ec2", "volume");

