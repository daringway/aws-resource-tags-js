'use strict';

import * as AWS from 'aws-sdk';

// Don't implement elasticloadbalancing-loadbalancer as there is now way to tell V1 from V2 in ARN.

export interface Tags {
    [key: string]: string
}

export interface AwsApiConfig {
    readonly awsLibraryName : string,
    readonly awsApiVersion  : string,
    readonly rateLimit?     : number,
    readonly rateIncrease?  : number,
    readonly maxRetries?    : number,
    readonly maxRateLimit?  : number
}

interface TaggerConfig {
    readonly resourceArn : string,
             region      : string,
    readonly accountId   : string,
    readonly resourceId  : string
}

interface AboutTagger {
    readonly taggerClass    : typeof Tagger,
    readonly service        : string,
    readonly resourceType   : string,
}

interface TaggerAws {
    awsFunction      : any,
    throttleFunction : any,
    currentRate      : number,
    config           : AwsApiConfig
}

let defaultLimits : AwsApiConfig = {
    awsApiVersion  : undefined,
    awsLibraryName : undefined,
    rateLimit      : 10,
    rateIncrease   : 10,
    maxRetries     : 10,
    maxRateLimit   : 2000
};

let taggers: Record<string, AboutTagger> = {};
let awsApis: Record<string, TaggerAws> = {};

export function register(taggerClass   : typeof Tagger,
                         service       : string,
                         resourceType  : string = undefined
    ) {

    let config : AboutTagger = {
        taggerClass  : taggerClass,
        service      : service,
        resourceType : resourceType
    };

    if (config.service && config.resourceType) {
        taggers[config.service + '-' + config.resourceType] = config;
    } else if (config.service) {
        taggers[config.service] = config;
    } else {
        taggers['default'] = config;
    }
}

function getTaggerClass(service, resourceType) : typeof Tagger {
    if ( service + '-' + resourceType in taggers) {
        return taggers[service + '-' + resourceType].taggerClass;
    } else if ( service in taggers) {
        return taggers[service].taggerClass;
    } else {
        return taggers['default'].taggerClass;
    }
}

export function getWorkerInstance(resourceArn : string,
                                  service : string,
                                  region : string,
                                  accountId : string,
                                  resourceType : string,
                                  resourceId : string ) : Tagger | null {

    if ( ['cloudformation', 'events'].includes(service) ) {
        return null;
    }

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

    await obj.getAws().throttleFunction();
    try {
        return await obj[fn](...fnArgs);
    } catch (error) {
        if ((retries < obj.getAws().config.maxRetries)
            && error.retryable) {

            let increase : number;
            if (error.retryDelay > 0) {
                increase = error.retryDelay * 2;
            } else {
                increase = obj.getAws().config.rateIncrease;
            }
            obj.getAws().currentRate =  obj.getAws().currentRate + increase;

            if ( obj.getAws().currentRate > obj.getAws().config.maxRateLimit ) {
                 obj.getAws().currentRate = obj.getAws().config.maxRateLimit;
                 console.log('WARN max rate limit reached with', obj.config.resourceArn);
            }
            obj.getAws().throttleFunction = require('promise-ratelimit')(obj.getAws().currentRate);
            await sleep(obj.getAws().currentRate);
            await retry(obj, fn, fnArgs, retries + 1);
            return;

        } else {
            console.log('ERROR max retries reached with', obj.config.resourceArn);
            throw error;
        }
    }
}

export abstract class Tagger  {

    public  config : TaggerConfig;
    private _cachedTags: Tags | null;
    private _loadedTags: Tags | null;

    private awsAccess: any | null;

    constructor(config : TaggerConfig) {

        this.config      = config;
        this._cachedTags = null;
        this._loadedTags = null;
        this.awsAccess   = null;
    };

    protected abstract async _serviceGetTags() : Promise<Tags>;
    protected abstract async _serviceUpdateTags(tagMapUpdates : Tags);
    protected abstract async _serviceDeleteTags(tagsToDeleteList : string[]);
    protected abstract getAwsApiConfig() : AwsApiConfig;

    private static getEnvironmentRegion() : string {
        if (process.env.AWS_REGION) {
            return process.env.AWS_REGION;
        } else if (process.env.AWS_DEFAULT_REGION) {
            return process.env.AWS_DEFAULT_REGION
        } else {
            return 'us-east-1';
        }
    }

    protected async getResourceRegion() : Promise<string> {
        return this.config.region;
    }
    protected getResourceAwsFunction() : any {
        return new AWS[this.getAwsApiConfig().awsLibraryName]({
            apiVersion: this.getAwsApiConfig().awsApiVersion,
            region: Tagger.getEnvironmentRegion()
        })
    }

    public async isTaggableState() : Promise<boolean> {
        return true;
    }

    public getAws() : TaggerAws {
        if (this.awsAccess == null) {
            let regionToUse    = this.config.region;
            let apiConfig      = this.getAwsApiConfig();
            let awsLibraryName = apiConfig.awsLibraryName;

            let keyName = regionToUse + '-' + awsLibraryName;

            if (!(keyName in awsApis)) {
                let newConfig : AwsApiConfig = {
                    awsLibraryName : apiConfig.awsLibraryName,
                    awsApiVersion  : apiConfig.awsApiVersion,
                    rateLimit      : apiConfig.rateLimit    ? apiConfig.rateLimit    : defaultLimits.rateLimit,
                    rateIncrease   : apiConfig.rateIncrease ? apiConfig.rateIncrease : defaultLimits.rateIncrease,
                    maxRateLimit   : apiConfig.maxRateLimit ? apiConfig.maxRateLimit : defaultLimits.maxRateLimit,
                    maxRetries     : apiConfig.maxRetries   ? apiConfig.maxRetries   : defaultLimits.maxRetries
                };

                awsApis[keyName] = {
                    awsFunction      : new AWS[newConfig.awsLibraryName]({
                                            apiVersion: newConfig.awsApiVersion,
                                            region: regionToUse
                                        }),
                    throttleFunction : require('promise-ratelimit')(newConfig.rateLimit),
                    config           : newConfig,
                    currentRate      : newConfig.rateLimit
                }
            }
            this.awsAccess = awsApis[keyName];
        }
        return this.awsAccess;
    }

    protected getAwsFunction() : any {
        return this.getAws().awsFunction;
    }


    private checkLoaded() {
        if ( typeof this._loadedTags === null ) {
            throw new Error('Must call load() first');
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
            await retry(this, '_updateAndDeleteTags', [tagsToUpdate, keysToDelete]);
            this._loadedTags = {...this._cachedTags};
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
            newData[element['Key']] = element['Value'];
        });
        return newData;
    };

    protected static _kvMapToArray(tagMap : object) : object[] {
        let newArray = [];
        for (let key in tagMap) {
            newArray.push({'Key': key, 'Value': tagMap[key]});
        }
        return newArray;
    }

    protected static _keyListToListMap(tags : string[]) : object[] {
        let newList = [];
        tags.forEach(function (key) {
            newList.push({'Key': key})
        });
        return newList;
    }
}
