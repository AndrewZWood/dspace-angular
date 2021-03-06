import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import {
  DiscardObjectUpdatesAction,
  ObjectUpdatesAction,
  ObjectUpdatesActionTypes,
  RemoveObjectUpdatesAction
} from './object-updates.actions';
import { delay, map, switchMap, take, tap } from 'rxjs/operators';
import { of as observableOf, race as observableRace, Subject } from 'rxjs';
import { hasNoValue } from '../../../shared/empty.util';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { INotification } from '../../../shared/notifications/models/notification.model';

/**
 * NGRX effects for ObjectUpdatesActions
 */
@Injectable()
export class ObjectUpdatesEffects {
  /**
   * Map that keeps track of the latest ObjectUpdatesAction for each page's url
   */
  private actionMap: {
    /* Use Subject instead of BehaviorSubject:
      we only want Actions that are fired while we're listening
      actions that were previously fired do not matter anymore
    */
    [url: string]: Subject<ObjectUpdatesAction>
  } = {};

  /**
   * Effect that makes sure all last fired ObjectUpdatesActions are stored in the map of this service, with the url as their key
   */
  @Effect({ dispatch: false }) mapLastActions$ = this.actions$
    .pipe(
      ofType(...Object.values(ObjectUpdatesActionTypes)),
      map((action: DiscardObjectUpdatesAction) => {
          const url: string = action.payload.url;
          if (hasNoValue(this.actionMap[url])) {
            this.actionMap[url] = new Subject<ObjectUpdatesAction>();
          }
          this.actionMap[url].next(action);
        }
      )
    );

  /**
   * Effect that checks whether the removeAction's notification timeout ends before a user triggers another ObjectUpdatesAction
   * When no ObjectUpdatesAction is fired during the timeout, a RemoteObjectUpdatesAction will be returned
   * When a REINSTATE action is fired during the timeout, a NO_ACTION action will be returned
   * When any other ObjectUpdatesAction is fired during the timeout, a RemoteObjectUpdatesAction will be returned
   */
  @Effect() removeAfterDiscardOrReinstateOnUndo$ = this.actions$
    .pipe(
      ofType(ObjectUpdatesActionTypes.DISCARD),
      switchMap((action: DiscardObjectUpdatesAction) => {
          const url: string = action.payload.url;
          const notification: INotification = action.payload.notification;
          const timeOut = notification.options.timeOut;
          return observableRace(
            // Either wait for the delay and perform a remove action
            observableOf(new RemoveObjectUpdatesAction(action.payload.url)).pipe(delay(timeOut)),
            // Or wait for a a user action
            this.actionMap[url].pipe(
              take(1),
              tap(() => this.notificationsService.remove(notification)),
              map((updateAction: ObjectUpdatesAction) => {
                if (updateAction.type === ObjectUpdatesActionTypes.REINSTATE) {
                  // If someone reinstated, do nothing, just let the reinstating happen
                  return { type: 'NO_ACTION' }
                } else {
                  // If someone performed another action, assume the user does not want to reinstate and remove all changes
                  return new RemoveObjectUpdatesAction(action.payload.url);
                }
              })
            )
          )
        }
      )
    );

  constructor(private actions$: Actions,
              private notificationsService: NotificationsService) {

  }

}
