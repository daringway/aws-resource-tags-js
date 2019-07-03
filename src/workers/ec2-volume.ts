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
        let data = await this.getAwsFunction().describeVolumes(params).promise();
        return Tagger._akvToMap(data["Volumes"][0]["Tags"]);

    };
}

register(Ec2VolumeTagger, "ec2", "volume");

