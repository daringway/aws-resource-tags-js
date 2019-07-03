'use strict';

const AWS = require('aws-sdk');

let throttleRetry = require('promise-ratelimit')(50);
let backoffTime = 250;
let maxBackoffTime = 500;
let maxRetries = 10;

export interface TaggerConfig {
    readonly resourceArn     : string,
    readonly region          : string,
    readonly accountId       : string,
    readonly resourceId      : string,
}

export interface AboutTagger {
    readonly taggerClass    : typeof Tagger,
    readonly service        : string,
    readonly resourceType   : string,
}

let taggers: Record<string, AboutTagger> = {};

export function register(taggerClass : typeof Tagger, service : string, resourceType? : string) {

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
                                  resourceId : string ) : Tagger {

    let taggerClass = getTaggerClass(service, resourceType);

    let config : TaggerConfig = {
        resourceArn  : resourceArn,
        region       : region,
        accountId    : accountId,
        resourceId   : resourceId
    }
    // @ts-ignore
    return new taggerClass(config);

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function retry(obj, fn, fnargs, retries=maxRetries, err=null) {
    return new Promise( (resolve, reject) => {
        if (retries == 0) {
            reject(err);
        } else {
            return throttleRetry().then(() => {
                obj[fn](...fnargs)
                    .then(x => resolve(x))
                    .catch(err => {
                        if (err.retryDelay > 0) {
                            if (backoffTime < maxBackoffTime) {
                                // First time through the backOffTime won't increase
                                backoffTime += Math.ceil(err.retryDelay) * (maxRetries - retries);
                            }
                            sleep(backoffTime).then(() => {
                                retry(obj, fn, fnargs, (retries - 1), err).then(() => {
                                    resolve()
                                })
                                    .catch((err) => {
                                        reject(err);
                                    })
                            });
                        } else {
                            return reject(err);
                        }
                    });
            });
        };
    });
}

export abstract class Tagger  {

    public  config : TaggerConfig;
    private _cachedTags: Object;
    private _loadedTags: Object;

    private awsFunction: any;

    constructor(config : TaggerConfig) {

        this.config = config;

        this._cachedTags = undefined;
        this._loadedTags = undefined;

        this.awsFunction = undefined;

    };

    protected abstract _serviceGetTags();
    protected abstract _serviceUpdateTags(tagMapUpdates);
    protected abstract _serviceDeleteTags(tagsToDeleteList);
    protected abstract _getAwsLibraryName() : string;
    protected abstract _getAwsApiVersion()  : string;

    protected getAwsFunction() : any {
        if (! this.awsFunction) {
            this.awsFunction = new AWS[this._getAwsLibraryName()]({
                apiVersion: this._getAwsApiVersion(),
                region: this.config.region
            });
        }
       return this.awsFunction;
    }

    protected getResourceRegion() {
        return this.config.region;
    }

    private checkLoaded() {
        if ( typeof this._loadedTags === undefined  ) {
            throw new Error('Must call load() first');
        }
    }

    get tags() {
        this.checkLoaded();
        return this._cachedTags;
    }
    set tags(tagMap) {
        this.checkLoaded();
        // TODO add validator
        this._cachedTags = tagMap;
    }

    setTags(tags) {
        this._cachedTags = tags;
        this._loadedTags = {...tags};
        this._cachedTags;
    }
    setTagKeyValueArray(keyValueArray) {
        this._cachedTags = this._akvToMap(keyValueArray);
        this._loadedTags = {...this._cachedTags};
        return this._cachedTags;
    }

    public load() {
        return new Promise((resolve, reject) => {
            if ( this._cachedTags !== undefined) {
                resolve(this._cachedTags);
            }
            this._serviceGetTags().then((data) => {
                this.setTags(data);
                resolve(this._cachedTags);
            }).catch((e) => {
                reject(e);
            })
        })
    };

    public save() {
        return new Promise((resolve, reject) => {
            this.checkLoaded();
            let keysToDelete = [];
            let tagsToUpdate = {};
            for (let key in this._loadedTags) {
                if (key in this._cachedTags) {
                    if (this._loadedTags[key] != this._cachedTags[key]) {
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
            retry(this, '_updateAndDeleteTags', [tagsToUpdate, keysToDelete])
                .then(() => {
                    resolve();
                });
        })
    }

    protected _updateAndDeleteTags(updateMap, deleteList) {
        let promises = [];
        if (Object.keys(deleteList).length > 0) {
            promises.push(this._serviceDeleteTags(deleteList));
        }
        if (Object.keys(updateMap).length > 0) {
            promises.push(this._serviceUpdateTags(updateMap));
        }
        return Promise.all(promises);
    }

    protected _akvToMap(arrayOfKeyValues) {
        let newdata = {};
        arrayOfKeyValues.forEach(function (element) {
            newdata[element['Key']] = element['Value'];
        });
        return newdata;
    };

    protected _kvMapToArray(tagMap) {
        let newarray = [];
        for (let key in tagMap) {
            newarray.push({'Key': key, 'Value': tagMap[key]});
        }
        return newarray;
    }

    protected _keyListToListMap(tags) {
        let newlist = [];
        tags.forEach(function (key) {
            newlist.push({'Key': key})
        });
        return newlist;
    }

};
