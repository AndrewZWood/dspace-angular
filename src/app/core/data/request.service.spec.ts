import { cold, getTestScheduler, hot } from 'jasmine-marbles';
import { of as observableOf } from 'rxjs';
import { getMockObjectCacheService } from '../../shared/mocks/mock-object-cache.service';
import { defaultUUID, getMockUUIDService } from '../../shared/mocks/mock-uuid.service';
import { ObjectCacheService } from '../cache/object-cache.service';
import { CoreState } from '../core.reducers';
import { UUIDService } from '../shared/uuid.service';
import { RequestConfigureAction, RequestExecuteAction } from './request.actions';
import * as ngrx from '@ngrx/store';
import {
  DeleteRequest,
  GetRequest,
  HeadRequest,
  OptionsRequest,
  PatchRequest,
  PostRequest,
  PutRequest,
  RestRequest
} from './request.models';
import { RequestService } from './request.service';
import { ActionsSubject, Store } from '@ngrx/store';
import { TestScheduler } from 'rxjs/testing';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { MockStore } from '../../shared/testing/mock-store';
import { IndexState } from '../index/index.reducer';

describe('RequestService', () => {
  let scheduler: TestScheduler;
  let service: RequestService;
  let serviceAsAny: any;
  let objectCache: ObjectCacheService;
  let uuidService: UUIDService;
  let store: Store<CoreState>;

  const testUUID = '5f2a0d2a-effa-4d54-bd54-5663b960f9eb';
  const testHref = 'https://rest.api/endpoint/selfLink';
  const testGetRequest = new GetRequest(testUUID, testHref);
  const testPostRequest = new PostRequest(testUUID, testHref);
  const testPutRequest = new PutRequest(testUUID, testHref);
  const testDeleteRequest = new DeleteRequest(testUUID, testHref);
  const testOptionsRequest = new OptionsRequest(testUUID, testHref);
  const testHeadRequest = new HeadRequest(testUUID, testHref);
  const testPatchRequest = new PatchRequest(testUUID, testHref);
  let selectSpy;
  beforeEach(() => {
    scheduler = getTestScheduler();

    objectCache = getMockObjectCacheService();
    (objectCache.hasBySelfLink as any).and.returnValue(false);

    uuidService = getMockUUIDService();

    store = new Store<CoreState>(new BehaviorSubject({}), new ActionsSubject(), null);
    selectSpy = spyOnProperty(ngrx, 'select');
    selectSpy.and.callFake(() => {
      return () => {
        return () => cold('a', { a: undefined });
      };
    });

    service = new RequestService(
      objectCache,
      uuidService,
      store,
      undefined
    );
    serviceAsAny = service as any;
  });

  describe('generateRequestId', () => {
    it('should generate a new request ID', () => {
      const result = service.generateRequestId();
      const expected = `client/${defaultUUID}`;

      expect(result).toBe(expected);
    });
  });

  describe('isPending', () => {
    describe('before the request is configured', () => {
      beforeEach(() => {
        spyOn(service, 'getByHref').and.returnValue(observableOf(undefined));
      });

      it('should return false', () => {
        const result = service.isPending(testGetRequest);
        const expected = false;

        expect(result).toBe(expected);
      });
    });

    describe('when the request has been configured but hasn\'t reached the store yet', () => {
      beforeEach(() => {
        spyOn(service, 'getByHref').and.returnValue(observableOf(undefined));
        serviceAsAny.requestsOnTheirWayToTheStore = [testHref];
      });

      it('should return true', () => {
        const result = service.isPending(testGetRequest);
        const expected = true;

        expect(result).toBe(expected);
      });
    });

    describe('when the request has reached the store, before the server responds', () => {
      beforeEach(() => {
        spyOn(service, 'getByHref').and.returnValue(observableOf({
          completed: false
        }))
      });

      it('should return true', () => {
        const result = service.isPending(testGetRequest);
        const expected = true;

        expect(result).toBe(expected);
      });
    });

    describe('after the server responds', () => {
      beforeEach(() => {
        spyOn(service, 'getByHref').and.returnValues(observableOf({
          completed: true
        }));
      });

      it('should return false', () => {
        const result = service.isPending(testGetRequest);
        const expected = false;

        expect(result).toBe(expected);
      });
    });

  });

  describe('getByUUID', () => {
    describe('if the request with the specified UUID exists in the store', () => {
      beforeEach(() => {
        selectSpy.and.callFake(() => {
          return () => {
            return () => hot('a', {
              a: {
                completed: true
              }
            });
          };
        });
      });

      it('should return an Observable of the RequestEntry', () => {
        const result = service.getByUUID(testUUID);
        const expected = cold('b', {
          b: {
            completed: true
          }
        });

        expect(result).toBeObservable(expected);
      });
    });

    describe('if the request with the specified UUID doesn\'t exist in the store', () => {
      beforeEach(() => {
        selectSpy.and.callFake(() => {
          return () => {
            return () => hot('a', { a: undefined });
          };
        });
      });

      it('should return an Observable of undefined', () => {
        const result = service.getByUUID(testUUID);
        // const expected = cold('b', {
        //   b: undefined
        // });

        scheduler.expectObservable(result).toBe('b', { b: undefined });
      });
    });

  });

  describe('getByHref', () => {
    describe('when the request with the specified href exists in the store', () => {
      beforeEach(() => {
        selectSpy.and.callFake(() => {
          return () => {
            return () => hot('a', { a: testUUID });
          };
        });
        spyOn(service, 'getByUUID').and.returnValue(cold('b', {
          b: {
            completed: true
          }
        }));
      });

      it('should return an Observable of the RequestEntry', () => {
        const result = service.getByHref(testHref);
        const expected = cold('c', {
          c: {
            completed: true
          }
        });

        expect(result).toBeObservable(expected);
      });
    });

    describe('when the request with the specified href doesn\'t exist in the store', () => {
      beforeEach(() => {
        selectSpy.and.callFake(() => {
          return () => {
            return () => hot('a', { a: undefined });
          };
        });
        spyOn(service, 'getByUUID').and.returnValue(cold('b', {
          b: undefined
        }));
      });

      it('should return an Observable of undefined', () => {
        const result = service.getByHref(testHref);
        const expected = cold('c', {
          c: undefined
        });

        expect(result).toBeObservable(expected);
      });
    });
  });

  describe('configure', () => {
    beforeEach(() => {
      spyOn(serviceAsAny, 'dispatchRequest');
    });

    describe('when the request is a GET request', () => {
      let request: RestRequest;

      beforeEach(() => {
        request = testGetRequest;
      });

      it('should track it on it\'s way to the store', () => {
        spyOn(serviceAsAny, 'trackRequestsOnTheirWayToTheStore');
        service.configure(request);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).toHaveBeenCalledWith(request);
      });
      describe('and it isn\'t cached or pending', () => {
        beforeEach(() => {
          spyOn(serviceAsAny, 'isCachedOrPending').and.returnValue(false);
        });

        it('should dispatch the request', () => {
          scheduler.schedule(() => service.configure(request));
          scheduler.flush();
          expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(request);
        });
      });
      describe('and it is already cached or pending', () => {
        beforeEach(() => {
          spyOn(serviceAsAny, 'isCachedOrPending').and.returnValue(true);
        });

        it('shouldn\'t dispatch the request', () => {
          service.configure(request);
          expect(serviceAsAny.dispatchRequest).not.toHaveBeenCalled();
        });
      });
    });

    describe('when the request isn\'t a GET request', () => {
      it('should dispatch the request', () => {
        service.configure(testPostRequest);
        expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(testPostRequest);

        service.configure(testPutRequest);
        expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(testPutRequest);

        service.configure(testDeleteRequest);
        expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(testDeleteRequest);

        service.configure(testOptionsRequest);
        expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(testOptionsRequest);

        service.configure(testHeadRequest);
        expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(testHeadRequest);

        service.configure(testPatchRequest);
        expect(serviceAsAny.dispatchRequest).toHaveBeenCalledWith(testPatchRequest);
      });

      it('shouldn\'t track it on it\'s way to the store', () => {
        spyOn(serviceAsAny, 'trackRequestsOnTheirWayToTheStore');

        serviceAsAny.dispatchRequest(testPostRequest);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).not.toHaveBeenCalled();

        serviceAsAny.dispatchRequest(testPutRequest);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).not.toHaveBeenCalled();

        serviceAsAny.dispatchRequest(testDeleteRequest);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).not.toHaveBeenCalled();

        serviceAsAny.dispatchRequest(testOptionsRequest);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).not.toHaveBeenCalled();

        serviceAsAny.dispatchRequest(testHeadRequest);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).not.toHaveBeenCalled();

        serviceAsAny.dispatchRequest(testPatchRequest);
        expect(serviceAsAny.trackRequestsOnTheirWayToTheStore).not.toHaveBeenCalled();
      });
    });
  });

  describe('isCachedOrPending', () => {
    describe('when the request is cached', () => {
      describe('in the ObjectCache', () => {
        beforeEach(() => {
          (objectCache.hasBySelfLink as any).and.returnValue(true);
        });

        it('should return true', () => {
          const result = serviceAsAny.isCachedOrPending(testGetRequest);
          const expected = true;

          expect(result).toEqual(expected);
        });
      });
      describe('in the responseCache', () => {
        beforeEach(() => {
          spyOn(serviceAsAny, 'isReusable').and.returnValue(observableOf(true));
          spyOn(serviceAsAny, 'getByHref').and.returnValue(observableOf(undefined));
        });

        describe('and it\'s a DSOSuccessResponse', () => {
          beforeEach(() => {
            (serviceAsAny.getByHref as any).and.returnValue(observableOf({
                response: {
                  isSuccessful: true,
                  resourceSelfLinks: [
                    'https://rest.api/endpoint/selfLink1',
                    'https://rest.api/endpoint/selfLink2'
                  ]
                }
              }
            ));
          });

          it('should return true if all top level links in the response are cached in the object cache', () => {
            (objectCache.hasBySelfLink as any).and.returnValues(false, true, true);

            const result = serviceAsAny.isCachedOrPending(testGetRequest);
            const expected = true;

            expect(result).toEqual(expected);
          });
          it('should return false if not all top level links in the response are cached in the object cache', () => {
            (objectCache.hasBySelfLink as any).and.returnValues(false, true, false);
            spyOn(service, 'isPending').and.returnValue(false);

            const result = serviceAsAny.isCachedOrPending(testGetRequest);
            const expected = false;

            expect(result).toEqual(expected);
          });
        });

        describe('and it isn\'t a DSOSuccessResponse', () => {
          beforeEach(() => {
            (objectCache.hasBySelfLink as any).and.returnValue(false);
            (service as any).isReusable.and.returnValue(observableOf(true));
            (serviceAsAny.getByHref as any).and.returnValue(observableOf({
                response: {
                  isSuccessful: true
                }
              }
            ));
          });

          it('should return true', () => {
            const result = serviceAsAny.isCachedOrPending(testGetRequest);
            const expected = true;

            expect(result).toEqual(expected);
          });
        });
      });
    });

    describe('when the request is pending', () => {
      beforeEach(() => {
        spyOn(service, 'isPending').and.returnValue(true);
      });

      it('should return true', () => {
        const result = serviceAsAny.isCachedOrPending(testGetRequest);
        const expected = true;

        expect(result).toEqual(expected);
      });
    });

    describe('when the request is neither cached nor pending', () => {
      it('should return false', () => {
        const result = serviceAsAny.isCachedOrPending(testGetRequest);
        const expected = false;

        expect(result).toEqual(expected);
      });
    });
  });

  describe('dispatchRequest', () => {
    beforeEach(() => {
      spyOn(store, 'dispatch');
    });

    it('should dispatch a RequestConfigureAction', () => {
      const request = testGetRequest;
      serviceAsAny.dispatchRequest(request);
      expect(store.dispatch).toHaveBeenCalledWith(new RequestConfigureAction(request));
    });

    it('should dispatch a RequestExecuteAction', () => {
      const request = testGetRequest;
      serviceAsAny.dispatchRequest(request);
      expect(store.dispatch).toHaveBeenCalledWith(new RequestExecuteAction(request.uuid));
    });
  });

  describe('trackRequestsOnTheirWayToTheStore', () => {
    let request: GetRequest;

    beforeEach(() => {
      request = testGetRequest;
    });

    describe('when the method is called with a new request', () => {
      it('should start tracking the request', () => {
        expect(serviceAsAny.requestsOnTheirWayToTheStore.includes(request.href)).toBeFalsy();
        serviceAsAny.trackRequestsOnTheirWayToTheStore(request);
        expect(serviceAsAny.requestsOnTheirWayToTheStore.includes(request.href)).toBeTruthy();
      });
    });

    describe('when the request is added to the store', () => {
      it('should stop tracking the request', () => {
        selectSpy.and.callFake(() => {
          return () => {
            return () => observableOf({ request });
          };
        });
        serviceAsAny.trackRequestsOnTheirWayToTheStore(request);
        expect(serviceAsAny.requestsOnTheirWayToTheStore.includes(request.href)).toBeFalsy();
      });
    });
  });

  describe('isReusable', () => {
    describe('when the given UUID is has no value', () => {
      let reusable;
      beforeEach(() => {
        const uuid = undefined;
        reusable = serviceAsAny.isReusable(uuid);
      });
      it('return an observable emitting false', () => {
        reusable.subscribe((isReusable) => expect(isReusable).toBe(false));
      })
    });

    describe('when the given UUID has a value, but no cached entry is found', () => {
      let reusable;
      beforeEach(() => {
        spyOn(service, 'getByUUID').and.returnValue(observableOf(undefined));
        const uuid = 'a45bb291-1adb-40d9-b2fc-7ad9080607be';
        reusable = serviceAsAny.isReusable(uuid);
      });
      it('return an observable emitting false', () => {
        reusable.subscribe((isReusable) => expect(isReusable).toBe(false));
      })
    });

    describe('when the given UUID has a value, a cached entry is found, but it has no response', () => {
      let reusable;
      beforeEach(() => {
        spyOn(service, 'getByUUID').and.returnValue(observableOf({ response: undefined }));
        const uuid = '53c9b814-ad8b-4567-9bc1-d9bb6cfba6c8';
        reusable = serviceAsAny.isReusable(uuid);
      });
      it('return an observable emitting false', () => {
        reusable.subscribe((isReusable) => expect(isReusable).toBe(false));
      })
    });

    describe('when the given UUID has a value, a cached entry is found, but its response was not successful', () => {
      let reusable;
      beforeEach(() => {
        spyOn(service, 'getByUUID').and.returnValue(observableOf({ response: { isSuccessful: false } }));
        const uuid = '694c9b32-7b2e-4788-835b-ef3fc2252e6c';
        reusable = serviceAsAny.isReusable(uuid);
      });
      it('return an observable emitting false', () => {
        reusable.subscribe((isReusable) => expect(isReusable).toBe(false));
      })
    });

    describe('when the given UUID has a value, a cached entry is found, its response was successful, but the response is outdated', () => {
      let reusable;
      const now = 100000;
      const timeAdded = 99899;
      const msToLive = 100;

      beforeEach(() => {
        spyOn(Date.prototype, 'getTime').and.returnValue(now);
        spyOn(service, 'getByUUID').and.returnValue(observableOf({
          response: {
            isSuccessful: true,
            timeAdded: timeAdded
          },
          request: {
            responseMsToLive: msToLive
          }
        }));
        const uuid = 'f9b85788-881c-4994-86b6-bae8dad024d2';
        reusable = serviceAsAny.isReusable(uuid);
      });

      it('return an observable emitting false', () => {
        reusable.subscribe((isReusable) => expect(isReusable).toBe(false));
      })
    });

    describe('when the given UUID has a value, a cached entry is found, its response was successful, and the response is not outdated', () => {
      let reusable;
      const now = 100000;
      const timeAdded = 99999;
      const msToLive = 100;

      beforeEach(() => {
        spyOn(Date.prototype, 'getTime').and.returnValue(now);
        spyOn(service, 'getByUUID').and.returnValue(observableOf({
          response: {
            isSuccessful: true,
            timeAdded: timeAdded
          },
          request: {
            responseMsToLive: msToLive
          }
        }));
        const uuid = 'f9b85788-881c-4994-86b6-bae8dad024d2';
        reusable = serviceAsAny.isReusable(uuid);
      });

      it('return an observable emitting true', () => {
        reusable.subscribe((isReusable) => expect(isReusable).toBe(true));
      })
    })
  })
});
