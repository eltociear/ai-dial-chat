import { toast } from 'react-hot-toast';

import { filter, forkJoin, ignoreElements, of, switchMap, tap } from 'rxjs';

import { combineEpics } from 'redux-observable';

import { AppEpic } from '@/src/types/store';

import { errorsMessages } from '@/src/constants/errors';

import { UIActions } from './ui.reducers';

const saveThemeEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.setTheme.match),
    tap(({ payload }) => {
      localStorage.setItem('settings', JSON.stringify({ theme: payload }));

      // Needed for fast work with theme initial load
      document.documentElement.className = payload || '';
    }),
    ignoreElements(),
  );

const saveShowChatbarEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.setShowChatbar.match),
    tap(({ payload }) => {
      localStorage.setItem('showChatbar', JSON.stringify(payload));
    }),
    ignoreElements(),
  );

const saveShowPromptbarEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.setShowPromptbar.match),
    tap(({ payload }) => {
      localStorage.setItem('showPromptbar', JSON.stringify(payload));
    }),
    ignoreElements(),
  );

const showToastErrorEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.showToast.match),
    switchMap(({ payload }) => {
      return forkJoin({
        responseMessage:
          typeof payload.response !== 'undefined'
            ? (payload.response as Response).text()
            : of(undefined),
        payload: of(payload),
      });
    }),
    tap(({ payload, responseMessage }) => {
      let message = payload.message ?? errorsMessages.generalServer;
      if (
        payload.response &&
        responseMessage &&
        payload.response.status !== 504
      ) {
        message = responseMessage;
      }

      switch (payload.type) {
        case 'error':
          toast.error(message, { id: 'toast' });
          break;
        case 'loading':
          toast.loading(message, { id: 'toast' });
          break;
        case 'success':
          toast.success(message, { id: 'toast' });
          break;
        default:
          toast(message, { id: 'toast' });
          break;
      }
    }),
    ignoreElements(),
  );

const closeAnnouncementEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(UIActions.closeAnnouncement.match),
    tap(({ payload }) => {
      localStorage.setItem(
        'textOfClosedAnnouncement',
        JSON.stringify(payload.announcement),
      );
    }),
    ignoreElements(),
  );

const UIEpics = combineEpics(
  saveThemeEpic,
  saveShowChatbarEpic,
  saveShowPromptbarEpic,
  showToastErrorEpic,
  closeAnnouncementEpic,
);

export default UIEpics;
