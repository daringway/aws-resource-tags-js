"use strict";

import * as AWS from "aws-sdk";

// Don't implement elasticloadbalancing-loadbalancer as there is now way to tell V1 from V2 in ARN.

export interface TaggerConfig {
    readonly resourceArn : string,
             region      : string,
    readonly accountId   : string,
    readonly resourceId  : string
}

export interface AboutTagger {
    readonly taggerClass    : typeof Tagger,
    readonly service        : string,
    readonly resourceType   : string,
}

export interface TaggerLimits {
    rateLimit         : number,
    rateIncrease?     : number,
    maxRetries?       : number,
    maxRateLimit?     : number,
    throttleFunction? : any
}

// let throttleRetry = require("promise-ratelimit")(50);
let defaultMaxRetries = 25;
let defaultRateIncrease = 25;
let defaultMaxRateLimit = 2000;

let baseLimits : TaggerLimits = {
    rateLimit   : 0
};

export interface Tags {
    [key: string]: string
}

let taggers: Record<string, AboutTagger> = {};

export function register(taggerClass   : typeof Tagger,
                         service       : string,
                         resourceType  : string = undefined) {

    let config : AboutTagger = {
        taggerClass  : taggerClass,
        service      : service,
        resourceType : resourceType
    };

    if (config.service && config.resourceType) {
        taggers[config.service + "-" + config.resourceType] = config;
    } else if (config.service) {
        taggers[config.service] = config;
    } else {
        taggers["default"] = config;
    }
}

function getTaggerClass(service, resourceType) : typeof Tagger {
    if ( service + "-" + resourceType in taggers) {
        return taggers[service + "-" + resourceType].taggerClass;
    } else if ( service in taggers) {
        return taggers[service].taggerClass;
    } else {
        return taggers["default"].taggerClass;
    }
}

export function getWorkerInstance(resourceArn : string,
                                  service : string,
                                  region : string,
                                  accountId : string,
                                  resourceType : string,
                                  resourceId : string ) : Tagger | null {

    if ( ["cloudformation", "events"].includes(service) ) {
        return null;
    }
    // if (("elasticloadbalancing" === service) && (resourceType === "loadbalancer")) {
    // //    Classic load balancer not support
    //     return null;
    // }

    let taggerClass = getTaggerClass(service, resourceType);

    let config : TaggerConfig = {
        resourceArn  : resourceArn,
        region       : region,
        accountId    : accountId,
        resourceId   : resourceId
    };
    // @ts-ignore
    return new taggerClass(config);

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(obj : Tagger, fn, fnArgs, retries : number = 0) {

    if (! obj.getLimits().throttleFunction) {
        obj.getLimits().throttleFunction = require("promise-ratelimit")(obj.getLimits().rateLimit);
    }
    let prev = obj.getLimits().rateLimit;
    await obj.getLimits().throttleFunction();
    try {
        let x = await obj[fn](...fnArgs);
        return x;
    } catch (error) {
        if ((retries < obj.getLimits().maxRetries ? obj.getLimits().maxRetries : defaultMaxRetries)
            && error.retryable) {

            let maxRate = obj.getLimits().maxRateLimit ? obj.getLimits().maxRateLimit : defaultMaxRateLimit;
            let increase : number;

            if (error.retryDelay > 0) {
                increase = error.retryDelay * 2;
            } else {
                increase = obj.getLimits().rateIncrease ? obj.getLimits().rateIncrease : defaultRateIncrease;
            }
            obj.getLimits().rateLimit =  obj.getLimits().rateLimit + increase;
            if ( obj.getLimits().rateLimit > maxRate ) {
                 obj.getLimits().rateLimit = maxRate;
                 console.log("WARN max rate limit reached with ", obj.config.resourceArn);
            }
            obj.getLimits().throttleFunction = require("promise-ratelimit")(obj.getLimits().rateLimit);
            await sleep(obj.getLimits().rateLimit);
            await retry(obj, fn, fnArgs, retries + 1);
            return;

        } else {
            throw error;
        }
    }
}

export abstract class Tagger  {

    public  config : TaggerConfig;
    private _cachedTags: Tags | null;
    private _loadedTags: Tags | null;

    private awsFunction: any | null;

    constructor(config : TaggerConfig) {

        this.config = config;

        this._cachedTags = null;
        this._loadedTags = null;

        this.awsFunction = null;

    };

    protected abstract async _serviceGetTags() : Promise<Tags>;
    protected abstract async _serviceUpdateTags(tagMapUpdates : Tags);
    protected abstract async _serviceDeleteTags(tagsToDeleteList : string[]);
    protected abstract _getAwsLibraryName() : string;
    protected abstract _getAwsApiVersion()  : string;

    private static getEnvironmentRegion() : string {
        if (process.env.AWS_REGION) {
            return process.env.AWS_REGION;
        } else if (process.env.AWS_DEFAULT_REGION) {
            return process.env.AWS_DEFAULT_REGION
        } else {
            return "us-east-1";
        }
    }

    public getLimits() : TaggerLimits {
        return baseLimits;
    }

    protected  getAwsFunction(useEnvironmentForRegion? : boolean) : any {
        if (this.awsFunction === null) {
            let regionToUse = this.config.region;
            if (useEnvironmentForRegion) {
                regionToUse = Tagger.getEnvironmentRegion();
            }

            this.awsFunction = new AWS[this._getAwsLibraryName()]({
                apiVersion: this._getAwsApiVersion(),
                region: regionToUse
            });
        }
       return this.awsFunction;
    }

    protected async getResourceRegion() : Promise<string> {
        return this.config.region;
    }

    private checkLoaded() {
        if ( typeof this._loadedTags === null ) {
            throw new Error("Must call load() first");
        }
    }

    get tags() : Tags {
        this.checkLoaded();
        return this._cachedTags;
    }
    set tags(tagMap : Tags) {
        this.checkLoaded();
        // TODO add validator
        this._cachedTags = tagMap;
    }

    setTags(tags : Tags) : Tags {
        this._cachedTags = tags;
        this._loadedTags = {...tags};
        return this._cachedTags;
    }
    setTagKeyValueArray(keyValueArray : []) {
        this._cachedTags = Tagger._akvToMap(keyValueArray);
        this._loadedTags = {...this._cachedTags};
        return this._cachedTags;
    }

    public async load() : Promise<object> {
        if (this._cachedTags === null) {
            if (this.config.region === undefined) {
                this.config.region = await this.getResourceRegion();
            }
            let tags = await this._serviceGetTags();
            this.setTags(tags);

        }
        return this.tags;
    };

    public async save() {
        if (this.config.region === undefined ) {
            this.config.region = await this.getResourceRegion();
        }

        this.checkLoaded();
        let keysToDelete = [];
        let tagsToUpdate = {};
        for (let key in this._loadedTags) {
            if (key in this._cachedTags) {
                if (this._cachedTags[key] !== this._loadedTags[key]) {
                    tagsToUpdate[key] = this._cachedTags[key];
                }
            } else {
                keysToDelete.push(key);
            }
        }
        for (let key in this._cachedTags) {
            if (!(key in this._loadedTags)) {
                tagsToUpdate[key] = this._cachedTags[key];
            }
        }

        try {
            await retry(this, "_updateAndDeleteTags", [tagsToUpdate, keysToDelete]);
        } catch (err) {
            throw err;
        }
        return;
    }

    protected async _updateAndDeleteTags(updateMap : Tags, deleteList : string[]) {
        try {
            if (Object.keys(deleteList).length > 0) {
                await this._serviceDeleteTags(deleteList);
            }
            if (Object.keys(updateMap).length > 0) {
                await this._serviceUpdateTags(updateMap);
            }
        } catch (err) {
            throw err;
        }
    }

    protected static _akvToMap(arrayOfKeyValues : object[]) : Tags {
        let newData = {};
        arrayOfKeyValues.forEach(function (element) {
            newData[element["Key"]] = element["Value"];
        });
        return newData;
    };

    protected static _kvMapToArray(tagMap : object) : object[] {
        let newArray = [];
        for (let key in tagMap) {
            newArray.push({"Key": key, "Value": tagMap[key]});
        }
        return newArray;
    }

    protected static _keyListToListMap(tags : string[]) : object[] {
        let newList = [];
        tags.forEach(function (key) {
            newList.push({"Key": key})
        });
        return newList;
    }
}
