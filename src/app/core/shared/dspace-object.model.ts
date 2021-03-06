import {
  MetadataMap,
  MetadataValue,
  MetadataValueFilter,
  MetadatumViewModel
} from './metadata.models';
import { Metadata } from './metadata.utils';
import { CacheableObject } from '../cache/object-cache.reducer';
import { RemoteData } from '../data/remote-data';
import { ResourceType } from './resource-type';
import { ListableObject } from '../../shared/object-collection/shared/listable-object.model';
import { Observable } from 'rxjs';

/**
 * An abstract model class for a DSpaceObject.
 */
export class DSpaceObject implements CacheableObject, ListableObject {

  self: string;

  /**
   * The human-readable identifier of this DSpaceObject
   */
  id: string;

  /**
   * The universally unique identifier of this DSpaceObject
   */
  uuid: string;

  /**
   * A string representing the kind of DSpaceObject, e.g. community, item, …
   */
  type: ResourceType;

  /**
   * The name for this DSpaceObject
   */
  get name(): string {
    return this.firstMetadataValue('dc.title');
  }

  /**
   * All metadata of this DSpaceObject
   */
  metadata: MetadataMap;

  /**
   * Retrieve the current metadata as a list of MetadatumViewModels
   */
  get metadataAsList(): MetadatumViewModel[] {
    return Metadata.toViewModelList(this.metadata);
  }

  /**
   * An array of DSpaceObjects that are direct parents of this DSpaceObject
   */
  parents: Observable<RemoteData<DSpaceObject[]>>;

  /**
   * The DSpaceObject that owns this DSpaceObject
   */
  owner: Observable<RemoteData<DSpaceObject>>;

  /**
   * Gets all matching metadata in this DSpaceObject.
   *
   * @param {string|string[]} keyOrKeys The metadata key(s) in scope. Wildcards are supported; see [[Metadata]].
   * @param {MetadataValueFilter} filter The value filter to use. If unspecified, no filtering will be done.
   * @returns {MetadataValue[]} the matching values or an empty array.
   */
  allMetadata(keyOrKeys: string | string[], valueFilter?: MetadataValueFilter): MetadataValue[] {
    return Metadata.all(this.metadata, keyOrKeys, valueFilter);
  }

  /**
   * Like [[allMetadata]], but only returns string values.
   *
   * @param {string|string[]} keyOrKeys The metadata key(s) in scope. Wildcards are supported; see [[Metadata]].
   * @param {MetadataValueFilter} filter The value filter to use. If unspecified, no filtering will be done.
   * @returns {string[]} the matching string values or an empty array.
   */
  allMetadataValues(keyOrKeys: string | string[], valueFilter?: MetadataValueFilter): string[] {
    return Metadata.allValues(this.metadata, keyOrKeys, valueFilter);
  }

  /**
   * Gets the first matching MetadataValue object in this DSpaceObject, or `undefined`.
   *
   * @param {string|string[]} keyOrKeys The metadata key(s) in scope. Wildcards are supported; see [[Metadata]].
   * @param {MetadataValueFilter} filter The value filter to use. If unspecified, no filtering will be done.
   * @returns {MetadataValue} the first matching value, or `undefined`.
   */
  firstMetadata(keyOrKeys: string | string[], valueFilter?: MetadataValueFilter): MetadataValue {
    return Metadata.first(this.metadata, keyOrKeys, valueFilter);
  }

  /**
   * Like [[firstMetadata]], but only returns a string value, or `undefined`.
   *
   * @param {string|string[]} keyOrKeys The metadata key(s) in scope. Wildcards are supported; see [[Metadata]].
   * @param {MetadataValueFilter} filter The value filter to use. If unspecified, no filtering will be done.
   * @returns {string} the first matching string value, or `undefined`.
   */
  firstMetadataValue(keyOrKeys: string | string[], valueFilter?: MetadataValueFilter): string {
    return Metadata.firstValue(this.metadata, keyOrKeys, valueFilter);
  }

  /**
   * Checks for a matching metadata value in this DSpaceObject.
   *
   * @param {string|string[]} keyOrKeys The metadata key(s) in scope. Wildcards are supported; see [[Metadata]].
   * @param {MetadataValueFilter} filter The value filter to use. If unspecified, no filtering will be done.
   * @returns {boolean} whether a match is found.
   */
  hasMetadata(keyOrKeys: string | string[], valueFilter?: MetadataValueFilter): boolean {
    return Metadata.has(this.metadata, keyOrKeys, valueFilter);
  }

}
