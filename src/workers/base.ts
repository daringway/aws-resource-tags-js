/* Copyright (C) 2019 Walter Derezinski - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the ISC license.
 */

import * as AWS from 'aws-sdk';

// Don't implement elasticloadbalancing-loadbalancer as there is now way to tell V1 from V2 in ARN.

export interface Tags {
  [key: string]: string
}

export interface AwsApiConfig {
  readonly awsLibraryName: string,
  readonly awsApiVersion: string,
  readonly rateLimit?: number,
  readonly rateIncrease?: number,
  readonly maxRetries?: number,
  readonly maxRateLimit?: number
}

interface TaggerConfig {
  readonly resourceArn: string,
  region: string,
  readonly accountId: string,
  readonly resourceId: string,
  readonly service: string,
  readonly resourceType: string
}

interface AboutTagger {
  readonly taggerClass: typeof Tagger,
  readonly service: string,
  readonly resourceType: string,
}

interface TaggerAws {
  awsFunction: any,
  throttleFunction: any,
  currentRate: number,
  config: AwsApiConfig
}

const defaultLimits: AwsApiConfig = {
  awsApiVersion: undefined,
  awsLibraryName: undefined,
  rateLimit: 10,
  rateIncrease: 10,
  maxRetries: 10,
  maxRateLimit: 2000,
};

const taggers: Record<string, AboutTagger> = {};
const awsApis: Record<string, TaggerAws> = {};

export function register(
  taggerClass: typeof Tagger,
  service: string,
  resourceType: string = undefined
) {
  const config: AboutTagger = {
    taggerClass,
    service,
    resourceType,
  };

  if (config.service && config.resourceType) {
    taggers[`${config.service}-${config.resourceType}`] = config;
  } else if (config.service) {
    taggers[config.service] = config;
  } else {
    taggers.default = config;
  }
}

function getTaggerClass(service, resourceType): typeof Tagger {
  if (`${service}-${resourceType}` in taggers) {
    return taggers[`${service}-${resourceType}`].taggerClass;
  }
  if (service in taggers) {
    return taggers[service].taggerClass;
  }
  return taggers.default.taggerClass;
}

export function getWorkerInstance(resourceArn: string,
  service: string,
  region: string,
  accountId: string,
  resourceType: string,
  resourceId: string): Tagger | null {
  if (['cloudformation', 'events'].includes(service)) {
    return null;
  }

  const taggerClass = getTaggerClass(service, resourceType);

  const config: TaggerConfig = {
    resourceArn,
    region,
    accountId,
    resourceId,
    service,
    resourceType,
  };
  // @ts-ignore
  return new taggerClass(config);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(obj: Tagger, fn, fnArgs, retries: number = 0) {
  await obj.getAws().throttleFunction();
  try {
    return await obj[fn](...fnArgs);
  } catch (error) {
    if (!error.retryable || error.retryable === 'false') {
      throw error;
    } else if (retries < obj.getAws().config.maxRetries) {
      let increase: number;
      if (error.retryDelay > 0) {
        increase = error.retryDelay * 2;
      } else {
        increase = obj.getAws().config.rateIncrease;
      }
      obj.getAws().currentRate = obj.getAws().currentRate + increase;

      if (obj.getAws().currentRate > obj.getAws().config.maxRateLimit) {
        obj.getAws().currentRate = obj.getAws().config.maxRateLimit;
        console.log('WARN max rate limit reached with', obj.config.resourceArn);
      }
      obj.getAws().throttleFunction = require('promise-ratelimit')(obj.getAws().currentRate);
      await sleep(obj.getAws().currentRate);
      await retry(obj, fn, fnArgs, retries + 1);
    } else {
      console.log('ERROR max retries reached with', obj.config.resourceArn);
      throw error;
    }
  }
}

export abstract class Tagger {
  public config: TaggerConfig;

  private cachedTags: Tags | null;

  private loadedTags: Tags | null;

  private awsAccess: any | null;

  constructor(config: TaggerConfig) {
    this.config = config;
    this.cachedTags = null;
    this.loadedTags = null;
    this.awsAccess = null;
  }

  get tags(): Tags {
    this.checkLoaded();
    return this.cachedTags;
  }

  set tags(tagMap: Tags) {
    this.checkLoaded();
    // TODO add validator
    this.cachedTags = tagMap;
  }

  protected static akvToMap(arrayOfKeyValues: object[]): Tags {
    const newData = {};
    arrayOfKeyValues.forEach((element) => {
      newData[element.Key] = element.Value;
    });
    return newData;
  }

  protected static kvMapToArray(tagMap: object): object[] {
    const newArray = [];
    for (const key in tagMap) {
      newArray.push({ Key: key, Value: tagMap[key] });
    }
    return newArray;
  }

  protected static keyListToListMap(tags: string[]): object[] {
    const newList = [];
    tags.forEach((key) => {
      newList.push({ Key: key });
    });
    return newList;
  }

  private static getEnvironmentRegion(): string {
    if (process.env.AWS_REGION) {
      return process.env.AWS_REGION;
    }
    if (process.env.AWS_DEFAULT_REGION) {
      return process.env.AWS_DEFAULT_REGION;
    }
    return 'us-east-1';
  }

  public async isTaggableState(): Promise<boolean> {
    return retry(this, '_isTaggableState', []);
  }

  public async getChildrenArns(): Promise<string[]> {
    return [];
  }

  public getAws(): TaggerAws {
    if (this.awsAccess == null) {
      const regionToUse = this.config.region;
      const apiConfig = this.getAwsApiConfig();
      const { awsLibraryName } = apiConfig;

      const keyName = `${regionToUse}-${awsLibraryName}`;

      if (!(keyName in awsApis)) {
        const newConfig: AwsApiConfig = {
          awsLibraryName: apiConfig.awsLibraryName,
          awsApiVersion: apiConfig.awsApiVersion,
          rateLimit: apiConfig.rateLimit ? apiConfig.rateLimit : defaultLimits.rateLimit,
          rateIncrease: apiConfig.rateIncrease ? apiConfig.rateIncrease : defaultLimits.rateIncrease,
          maxRateLimit: apiConfig.maxRateLimit ? apiConfig.maxRateLimit : defaultLimits.maxRateLimit,
          maxRetries: apiConfig.maxRetries ? apiConfig.maxRetries : defaultLimits.maxRetries,
        };

        awsApis[keyName] = {
          awsFunction: new AWS[newConfig.awsLibraryName]({
            apiVersion: newConfig.awsApiVersion,
            region: regionToUse,
          }),
          throttleFunction: require('promise-ratelimit')(newConfig.rateLimit),
          config: newConfig,
          currentRate: newConfig.rateLimit,
        };
      }
      this.awsAccess = awsApis[keyName];
    }
    return this.awsAccess;
  }

  // @deprecated('Use initTags')
  setTags(tags: Tags): Tags {
    console.warn('Calling setTags is deprecated, use initTags');
    return this.initTags(tags);
  }

  initTags(tags: Tags): Tags {
    this.cachedTags = tags;
    this.loadedTags = { ...tags };
    return this.cachedTags;
  }

  setTagKeyValueArray(keyValueArray: []) {
    this.cachedTags = Tagger.akvToMap(keyValueArray);
    this.loadedTags = { ...this.cachedTags };
    return this.cachedTags;
  }

  public async load(): Promise<object> {
    if (this.cachedTags === null) {
      if (this.config.region === undefined) {
        this.config.region = await this.getResourceRegion();
      }
      const tags = await this.serviceGetTags();
      this.initTags(tags);
    }
    return this.tags;
  }

  public async save() {
    if (this.config.region === undefined) {
      this.config.region = await this.getResourceRegion();
    }

    this.checkLoaded();
    const keysToDelete = [];
    const tagsToUpdate = {};
    for (const key in this.loadedTags) {
      if (key in this.cachedTags) {
        if (this.cachedTags[key] !== this.loadedTags[key]) {
          tagsToUpdate[key] = this.cachedTags[key];
        }
      } else {
        keysToDelete.push(key);
      }
    }
    for (const key in this.cachedTags) {
      if (!(key in this.loadedTags)) {
        tagsToUpdate[key] = this.cachedTags[key];
      }
    }

    try {
      await retry(this, '_updateAndDeleteTags', [tagsToUpdate, keysToDelete]);
      this.loadedTags = { ...this.cachedTags };
    } catch (err) {
      throw err;
    }
  }

  protected abstract async serviceGetTags(): Promise<Tags>;

  protected abstract async serviceUpdateTags(tagMapUpdates: Tags);

  protected abstract async serviceDeleteTags(tagsToDeleteList: string[]);

  protected abstract getAwsApiConfig(): AwsApiConfig;

  protected async getResourceRegion(): Promise<string> {
    return this.config.region;
  }

  protected getResourceAwsFunction(): any {
    return new AWS[this.getAwsApiConfig().awsLibraryName]({
      apiVersion: this.getAwsApiConfig().awsApiVersion,
      region: Tagger.getEnvironmentRegion(),
    });
  }

  protected async _isTaggableState(): Promise<boolean> {
    return true;
  }

  protected getAwsFunction(): any {
    return this.getAws().awsFunction;
  }

  protected async _updateAndDeleteTags(updateMap: Tags, deleteList: string[]) {
    try {
      if (Object.keys(deleteList).length > 0) {
        await this.serviceDeleteTags(deleteList);
      }
      if (Object.keys(updateMap).length > 0) {
        await this.serviceUpdateTags(updateMap);
      }
    } catch (err) {
      throw err;
    }
  }

  private checkLoaded() {
    if (typeof this.loadedTags === null) {
      throw new Error('Must call load() first');
    }
  }
}
