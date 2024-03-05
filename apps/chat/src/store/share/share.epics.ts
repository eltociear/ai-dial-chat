import {
  EMPTY,
  catchError,
  concat,
  filter,
  map,
  mergeMap,
  of,
  switchMap,
  zip,
} from 'rxjs';

import { AnyAction } from '@reduxjs/toolkit';

import { combineEpics } from 'redux-observable';

import { ConversationService } from '@/src/utils/app/data/conversation-service';
import { ShareService } from '@/src/utils/app/data/share-service';
import { constructPath } from '@/src/utils/app/file';
import { splitEntityId } from '@/src/utils/app/folders';
import { isConversationId, isFolderId, isPromptId } from '@/src/utils/app/id';
import { EnumMapper } from '@/src/utils/app/mappers';
import { translate } from '@/src/utils/app/translation';
import { ApiUtils, parseConversationApiKey } from '@/src/utils/server/api';

import { Conversation, ConversationInfo, Message } from '@/src/types/chat';
import { FeatureType } from '@/src/types/common';
import { FolderInterface } from '@/src/types/folder';
import { Prompt } from '@/src/types/prompt';
import {
  ShareByLinkResponseModel,
  ShareRelations,
  ShareRequestType,
} from '@/src/types/share';
import { AppEpic } from '@/src/types/store';

import { errorsMessages } from '@/src/constants/errors';

import {
  ConversationsActions,
  ConversationsSelectors,
} from '../conversations/conversations.reducers';
import { PromptsActions, PromptsSelectors } from '../prompts/prompts.reducers';
import { SettingsSelectors } from '../settings/settings.reducers';
import { UIActions } from '../ui/ui.reducers';
import { ShareActions, ShareSelectors } from './share.reducers';

const getInternalResourcesUrls = (
  messages: Message[] | undefined,
): string[] => {
  return (messages
    ?.map((message) =>
      message.custom_content?.attachments
        ?.map((attachment) => attachment.url)
        .filter(Boolean),
    )
    .filter(Boolean)
    .flat() || []) as string[];
};

const shareEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.share.match),
    switchMap(({ payload }) => {
      if (payload.featureType === FeatureType.Chat) {
        if (!payload.isFolder) {
          return of(
            ShareActions.shareConversation({ resourceId: payload.resourceId }),
          );
        } else {
          return of(
            ShareActions.shareConversationFolder({
              resourceId: payload.resourceId,
            }),
          );
        }
      } else {
        if (!payload.isFolder) {
          return of(
            ShareActions.sharePrompt({ resourceId: payload.resourceId }),
          );
        } else {
          return of(
            ShareActions.sharePromptFolder({
              resourceId: payload.resourceId,
            }),
          );
        }
      }
    }),
  );

const shareConversationEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.shareConversation.match),
    switchMap(({ payload }) => {
      const { apiKey, bucket, parentPath, name } = splitEntityId(
        payload.resourceId,
      );

      return ConversationService.getConversation({
        ...parseConversationApiKey(payload.resourceId),
        id: payload.resourceId,
        name,
        folderId: constructPath(apiKey, bucket, parentPath),
      }).pipe(
        switchMap((res) => {
          const internalResources = getInternalResourcesUrls(res?.messages);
          return ShareService.share({
            invitationType: ShareRequestType.link,
            resources: [
              {
                url: ApiUtils.encodeApiUrl(payload.resourceId),
              },
              ...internalResources.map((res) => ({ url: res })),
            ],
          }).pipe(
            map((response: ShareByLinkResponseModel) => {
              return ShareActions.shareSuccess({
                invitationId: response.invitationLink.split('/').slice(-1)?.[0],
              });
            }),
            catchError((err) => {
              console.error(err);
              return of(ShareActions.shareFail());
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const shareConversationFolderEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.shareConversationFolder.match),
    switchMap(({ payload }) => {
      return ConversationService.getConversations(
        payload.resourceId,
        true,
      ).pipe(
        switchMap((res) => {
          return zip(
            res.map((res) =>
              ConversationService.getConversation({
                ...res,
              }),
            ),
          );
        }),
        map((res) => res.filter(Boolean) as Conversation[]),
        switchMap((conversations: Conversation[]) => {
          const internalResourcesIds = conversations
            .flatMap((res) => getInternalResourcesUrls(res.messages))
            .map((url) => ({ url }));

          return ShareService.share({
            invitationType: ShareRequestType.link,
            resources: [
              {
                url: ApiUtils.encodeApiUrl(payload.resourceId) + '/',
              },
              ...internalResourcesIds,
            ],
          }).pipe(
            map((response: ShareByLinkResponseModel) => {
              return ShareActions.shareSuccess({
                invitationId: response.invitationLink.split('/').slice(-1)?.[0],
              });
            }),
            catchError((err) => {
              console.error(err);
              return of(ShareActions.shareFail());
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );
const sharePromptEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.sharePrompt.match),
    switchMap(({ payload }) => {
      return ShareService.share({
        invitationType: ShareRequestType.link,
        resources: [
          {
            url: ApiUtils.encodeApiUrl(payload.resourceId),
          },
        ],
      }).pipe(
        map((response: ShareByLinkResponseModel) => {
          return ShareActions.shareSuccess({
            invitationId: response.invitationLink.split('/').slice(-1)?.[0],
          });
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const sharePromptFolderEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.sharePromptFolder.match),
    switchMap(({ payload }) => {
      return ShareService.share({
        invitationType: ShareRequestType.link,
        resources: [
          {
            url: ApiUtils.encodeApiUrl(payload.resourceId) + '/',
          },
        ],
      }).pipe(
        map((response: ShareByLinkResponseModel) => {
          return ShareActions.shareSuccess({
            invitationId: response.invitationLink.split('/').slice(-1)?.[0],
          });
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const shareFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.shareFail.match),
    map(() => {
      return UIActions.showErrorToast(translate(errorsMessages.shareFailed));
    }),
  );

const acceptInvitationEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.acceptShareInvitation.match),
    switchMap(({ payload }) => {
      return ShareService.shareAccept({
        invitationId: payload.invitationId,
      }).pipe(
        switchMap(() =>
          ShareService.getShareDetails({
            invitationId: payload.invitationId,
          }).pipe(
            switchMap((data) =>
              of(
                ShareActions.acceptShareInvitationSuccess({
                  acceptedId: data.resources[0].url,
                }),
              ),
            ),
          ),
        ),
        catchError((err) => {
          console.error(err);
          let message = errorsMessages.acceptShareFailed;
          if (err.message === '404') {
            message = errorsMessages.acceptShareNotExists;
          }
          return of(ShareActions.acceptShareInvitationFail({ message }));
        }),
      );
    }),
  );

const acceptInvitationSuccessEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.acceptShareInvitationSuccess.match),
    switchMap(() => {
      history.replaceState({}, '', `${window.location.origin}`);

      return EMPTY;
    }),
  );

const acceptInvitationFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.acceptShareInvitationFail.match),
    map(({ payload }) => {
      history.replaceState({}, '', `${window.location.origin}`);

      return UIActions.showErrorToast(
        translate(payload.message || errorsMessages.acceptShareFailed),
      );
    }),
  );

const triggerGettingSharedListingsConversationsEpic: AppEpic = (
  action$,
  state$,
) =>
  action$.pipe(
    filter(
      (action) =>
        ConversationsActions.initFoldersAndConversationsSuccess.match(action) ||
        ShareActions.acceptShareInvitationSuccess.match(action),
    ),
    filter(() =>
      SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Chat),
    ),
    switchMap(() => {
      return concat(
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Chat,
            sharedWith: ShareRelations.me,
          }),
        ),
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Chat,
            sharedWith: ShareRelations.others,
          }),
        ),
      );
    }),
  );

const triggerGettingSharedListingsPromptsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        PromptsActions.initPromptsSuccess.match(action) ||
        ShareActions.acceptShareInvitationSuccess.match(action),
    ),
    filter(() =>
      SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Prompt),
    ),
    switchMap(() => {
      return concat(
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Prompt,
            sharedWith: ShareRelations.me,
          }),
        ),
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Prompt,
            sharedWith: ShareRelations.others,
          }),
        ),
      );
    }),
  );

const initReloadSharedConversationsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationsActions.reloadStateSuccess.match),
    filter(() =>
      SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Chat),
    ),
    switchMap(() =>
      concat(
        of(
          ShareActions.triggerReloadSharedItems({
            sharedWith: ShareRelations.me,
            featureType: FeatureType.Chat,
          }),
        ),
        of(
          ShareActions.triggerReloadSharedItems({
            sharedWith: ShareRelations.others,
            featureType: FeatureType.Chat,
          }),
        ),
      ),
    ),
  );

const initReloadSharedPromptsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(PromptsActions.reloadStateSuccess.match),
    filter(() =>
      SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Prompt),
    ),
    switchMap(() =>
      concat(
        of(
          ShareActions.triggerReloadSharedItems({
            sharedWith: ShareRelations.me,
            featureType: FeatureType.Prompt,
          }),
        ),
        of(
          ShareActions.triggerReloadSharedItems({
            sharedWith: ShareRelations.others,
            featureType: FeatureType.Prompt,
          }),
        ),
      ),
    ),
  );

const triggerReloadSharedItemsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.triggerReloadSharedItems.match),
    filter(({ payload }) =>
      SettingsSelectors.isSharingEnabled(state$.value, payload.featureType),
    ),
    mergeMap(({ payload }) => {
      return ShareService.getSharedListing({
        order: 'popular_asc',
        resourceTypes: [
          EnumMapper.getBackendResourceTypeByFeatureType(payload.featureType),
        ],
        with: payload.sharedWith,
      }).pipe(
        switchMap((entities) => {
          return of(
            ShareActions.reloadSharedListingSuccess({
              featureType: payload.featureType,
              sharedWith: payload.sharedWith,
              resources: entities,
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.reloadSharedListingFail());
        }),
      );
    }),
  );

const getSharedListingEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.getSharedListing.match),
    mergeMap(({ payload }) => {
      return ShareService.getSharedListing({
        order: 'popular_asc',
        resourceTypes: [
          EnumMapper.getBackendResourceTypeByFeatureType(payload.featureType),
        ],
        with: payload.sharedWith,
      }).pipe(
        switchMap((entities) => {
          return of(
            ShareActions.getSharedListingSuccess({
              featureType: payload.featureType,
              sharedWith: payload.sharedWith,
              resources: entities,
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.getSharedListingFail());
        }),
      );
    }),
  );

const reloadSharedListingFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.reloadSharedListingFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(
          translate(errorsMessages.shareByMeReloadListingFailed),
        ),
      );
    }),
  );

const getSharedListingFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.getSharedListingFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(
          translate(errorsMessages.shareByMeListingFailed),
        ),
      );
    }),
  );

// TODO: refactor it to something better
const getSharedListingSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.getSharedListingSuccess.match),
    switchMap(({ payload }) => {
      const actions = [];
      const acceptedId = ShareSelectors.selectAcceptedId(state$.value);
      const decodedAcceptedId = acceptedId && ApiUtils.decodeApiUrl(acceptedId);
      const isNewResource = [
        ...payload.resources.entities,
        ...payload.resources.folders,
      ].some((item) => item.id === decodedAcceptedId);

      if (payload.featureType === FeatureType.Chat) {
        if (payload.sharedWith === ShareRelations.others) {
          const conversations = ConversationsSelectors.selectConversations(
            state$.value,
          );
          const folders = ConversationsSelectors.selectFolders(state$.value);

          actions.push(
            ...(payload.resources.folders
              .map((item) => {
                const isShared = folders.find((res) => res.id === item.id);

                if (isShared) {
                  return ConversationsActions.updateFolder({
                    folderId: item.id,
                    values: {
                      isShared: true,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );

          actions.push(
            ...((payload.resources.entities as ConversationInfo[])
              .map((conv) => {
                const sharedConv = conversations.find(
                  (res) => res.id === conv.id,
                );

                if (sharedConv) {
                  return ConversationsActions.updateConversationSuccess({
                    id: conv.id,
                    conversation: {
                      isShared: true,
                      lastActivityDate: sharedConv.lastActivityDate,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );
        } else {
          const [selectedConv] =
            ConversationsSelectors.selectSelectedConversations(state$.value);

          if (
            selectedConv &&
            !isNewResource &&
            payload.resources.entities.some(
              (conv) => conv.id === selectedConv.id,
            )
          ) {
            actions.push(
              ConversationsActions.selectConversations({
                conversationIds: [selectedConv.id],
              }),
            );
          }

          payload.resources.entities.length &&
            actions.push(
              ConversationsActions.addConversations({
                conversations: payload.resources.entities.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as Conversation[],
              }),
            );
          payload.resources.folders.length &&
            actions.push(
              ConversationsActions.addFolders({
                folders: payload.resources.folders.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as FolderInterface[],
              }),
            );
        }
      }
      if (payload.featureType === FeatureType.Prompt) {
        if (payload.sharedWith === ShareRelations.others) {
          const prompts = PromptsSelectors.selectPrompts(state$.value);
          actions.push(
            ...(payload.resources.entities
              .map((item) => {
                const sharedPrompt = prompts.find((res) => res.id === item.id);

                if (sharedPrompt) {
                  return PromptsActions.updatePromptSuccess({
                    id: item.id,
                    prompt: {
                      isShared: true,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );
          const folders = PromptsSelectors.selectFolders(state$.value);
          payload.resources.folders.length &&
            actions.push(
              ...(payload.resources.folders
                .map((item) => {
                  const isShared = folders.find((res) => res.id === item.id);

                  if (isShared) {
                    return PromptsActions.updateFolder({
                      folderId: item.id,
                      values: {
                        isShared: true,
                      },
                    });
                  }
                  return undefined;
                })
                .filter(Boolean) as AnyAction[]),
            );
        } else {
          payload.resources.entities.length &&
            actions.push(
              PromptsActions.addPrompts({
                prompts: payload.resources.entities.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as Prompt[],
              }),
            );
          payload.resources.folders.length &&
            actions.push(
              PromptsActions.addFolders({
                folders: payload.resources.folders.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as FolderInterface[],
              }),
            );
        }
      }

      if (decodedAcceptedId && isNewResource) {
        if (isConversationId(acceptedId)) {
          if (isFolderId(acceptedId)) {
            actions.push(
              ConversationsActions.uploadConversationsWithFoldersRecursive({
                path: decodedAcceptedId,
                selectFirst: true,
                noLoader: true,
              }),
            );
            actions.push(ShareActions.resetShareId());
          } else {
            actions.push(
              ConversationsActions.selectConversations({
                conversationIds: [decodedAcceptedId],
              }),
            );
          }
        } else if (isPromptId(acceptedId)) {
          if (isFolderId(acceptedId)) {
            actions.push(
              PromptsActions.uploadPromptsWithFoldersRecursive({
                path: decodedAcceptedId,
                selectFirst: true,
              }),
            );
            actions.push(ShareActions.resetShareId());
          } else {
            actions.push(
              PromptsActions.setSelectedPrompt({
                promptId: decodedAcceptedId,
              }),
            );
            actions.push(
              PromptsActions.uploadPrompt({
                promptId: decodedAcceptedId,
              }),
            );
          }
          actions.push(
            PromptsActions.setIsEditModalOpen({
              isOpen: true,
              isPreview: true,
            }),
          );
        }
      }

      return concat(actions);
    }),
  );

const reloadSharedListingSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.reloadSharedListingSuccess.match),
    switchMap(({ payload }) => {
      const actions = [];

      if (payload.featureType === FeatureType.Chat) {
        if (payload.sharedWith === ShareRelations.others) {
          const conversations = ConversationsSelectors.selectConversations(
            state$.value,
          );
          const folders = ConversationsSelectors.selectFolders(state$.value);

          actions.push(
            ...(folders
              .map((item) => {
                const isShared = payload.resources.folders.find(
                  (res) => res.id === item.id,
                );

                return ConversationsActions.updateFolder({
                  folderId: item.id,
                  values: {
                    isShared: !!isShared,
                  },
                });
              })
              .filter(Boolean) as AnyAction[]),
          );

          actions.push(
            ...(conversations
              .map((conv) => {
                const sharedConv = payload.resources.entities.find(
                  (res) => res.id === conv.id,
                );

                return ConversationsActions.updateConversationSuccess({
                  id: conv.id,
                  conversation: {
                    isShared: !!sharedConv,
                    lastActivityDate: conv.lastActivityDate,
                  },
                });
              })
              .filter(Boolean) as AnyAction[]),
          );
        } else {
          const [selectedConv] =
            ConversationsSelectors.selectSelectedConversations(state$.value);

          if (
            selectedConv &&
            payload.resources.entities.some(
              (conv) => conv.id === selectedConv.id,
            )
          ) {
            actions.push(
              ConversationsActions.selectConversations({
                conversationIds: [selectedConv.id],
              }),
            );
          }

          actions.push(
            ConversationsActions.addSharedConversations({
              conversations: payload.resources.entities.map((res) => ({
                ...(res.id === selectedConv?.id ? selectedConv : res),
                sharedWithMe: true,
              })) as Conversation[],
            }),
          );

          actions.push(
            ConversationsActions.addSharedFolders({
              folders: payload.resources.folders.map((res) => ({
                ...res,
                sharedWithMe: true,
              })) as FolderInterface[],
            }),
          );
        }
      }
      if (payload.featureType === FeatureType.Prompt) {
        if (payload.sharedWith === ShareRelations.others) {
          const prompts = PromptsSelectors.selectPrompts(state$.value);
          actions.push(
            ...(prompts
              .map((item) => {
                const sharedPrompt = payload.resources.entities.find(
                  (res) => res.id === item.id,
                );

                return PromptsActions.updatePromptSuccess({
                  id: item.id,
                  prompt: {
                    isShared: !!sharedPrompt,
                  },
                });
              })
              .filter(Boolean) as AnyAction[]),
          );
          const folders = PromptsSelectors.selectFolders(state$.value);
          actions.push(
            ...(folders
              .map((item) => {
                const isShared = payload.resources.folders.find(
                  (res) => res.id === item.id,
                );

                return PromptsActions.updateFolder({
                  folderId: item.id,
                  values: {
                    isShared: !!isShared,
                  },
                });
              })
              .filter(Boolean) as AnyAction[]),
          );
        } else {
          const selectedPrompt = PromptsSelectors.selectSelectedPrompt(
            state$.value,
          );

          actions.push(
            PromptsActions.addSharedPrompts({
              prompts: payload.resources.entities.map((res) => ({
                ...(res.id === selectedPrompt?.id ? selectedPrompt : res),
                sharedWithMe: true,
              })) as Prompt[],
            }),
          );
          actions.push(
            PromptsActions.addSharedFolders({
              folders: payload.resources.folders.map((res) => ({
                ...res,
                sharedWithMe: true,
              })) as FolderInterface[],
            }),
          );
        }
      }

      return concat(actions);
    }),
  );

const revokeAccessEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.revokeAccess.match),
    switchMap(({ payload }) => {
      const resourceUrl = payload.isFolder
        ? ApiUtils.encodeApiUrl(payload.resourceId) + '/'
        : ApiUtils.encodeApiUrl(payload.resourceId);

      return ShareService.shareRevoke([resourceUrl]).pipe(
        map(() => ShareActions.revokeAccessSuccess(payload)),
        catchError(() => of(ShareActions.revokeAccessFail())),
      );
    }),
  );

const revokeAccessSuccessEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.revokeAccessSuccess.match),
    switchMap(({ payload }) => {
      if (!payload.isFolder && payload.featureType === FeatureType.Chat) {
        return of(
          ConversationsActions.updateConversationSuccess({
            id: payload.resourceId,
            conversation: {
              isShared: false,
            },
          }),
        );
      }
      if (payload.isFolder && payload.featureType === FeatureType.Chat) {
        return of(
          ConversationsActions.updateFolder({
            folderId: payload.resourceId,
            values: {
              isShared: false,
            },
          }),
        );
      }
      if (!payload.isFolder && payload.featureType === FeatureType.Prompt) {
        return of(
          PromptsActions.updatePromptSuccess({
            id: payload.resourceId,
            prompt: {
              isShared: false,
            },
          }),
        );
      }
      if (payload.isFolder && payload.featureType === FeatureType.Prompt) {
        return of(
          PromptsActions.updateFolder({
            folderId: payload.resourceId,
            values: {
              isShared: false,
            },
          }),
        );
      }

      console.error(`Entity not updated: ${payload.resourceId}`);
      return EMPTY;
    }),
  );

const revokeAccessFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.revokeAccessFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(translate(errorsMessages.revokeAccessFailed)),
      );
    }),
  );

const discardSharedWithMeEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.discardSharedWithMe.match),
    switchMap(({ payload }) => {
      const resourceUrl = payload.isFolder
        ? ApiUtils.encodeApiUrl(payload.resourceId) + '/'
        : ApiUtils.encodeApiUrl(payload.resourceId);

      return ShareService.shareDiscard([resourceUrl]).pipe(
        map(() => ShareActions.discardSharedWithMeSuccess(payload)),
        catchError(() => of(ShareActions.discardSharedWithMeFail())),
      );
    }),
  );

const discardSharedWithMeSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.discardSharedWithMeSuccess.match),
    switchMap(({ payload }) => {
      if (!payload.isFolder && payload.featureType === FeatureType.Chat) {
        const conversations = ConversationsSelectors.selectConversations(
          state$.value,
        );
        return of(
          ConversationsActions.setConversations({
            conversations: conversations.filter(
              (conv) => conv.id !== payload.resourceId,
            ),
            ignoreCombining: true,
          }),
        );
      }
      if (payload.isFolder && payload.featureType === FeatureType.Chat) {
        const folders = ConversationsSelectors.selectFolders(state$.value);
        return of(
          ConversationsActions.setFolders({
            folders: folders.filter((item) => item.id !== payload.resourceId),
          }),
        );
      }
      if (!payload.isFolder && payload.featureType === FeatureType.Prompt) {
        const prompts = PromptsSelectors.selectPrompts(state$.value);
        return of(
          PromptsActions.setPrompts({
            prompts: prompts.filter((item) => item.id !== payload.resourceId),
            ignoreCombining: true,
          }),
        );
      }
      if (payload.isFolder && payload.featureType === FeatureType.Prompt) {
        const folders = PromptsSelectors.selectFolders(state$.value);
        return of(
          PromptsActions.setFolders({
            folders: folders.filter((item) => item.id !== payload.resourceId),
          }),
        );
      }

      console.error(`Entity not updated: ${payload.resourceId}`);
      return EMPTY;
    }),
  );

const discardSharedWithMeFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.discardSharedWithMeFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(
          translate(errorsMessages.discardSharedWithMeFailed),
        ),
      );
    }),
  );

const deleteOrRenameSharedFolderEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        ConversationsActions.deleteFolder.match(action) ||
        PromptsActions.deleteFolder.match(action) ||
        ConversationsActions.updateFolder.match(action) ||
        PromptsActions.updateFolder.match(action),
    ),
    switchMap(({ payload }) => {
      const folders = ConversationsSelectors.selectFolders(state$.value);
      const isSharedFolder = folders.find(
        (folder) => folder.id === payload.folderId,
      )?.isShared;
      const requireRevoke = payload.values ? payload.values.name : true;

      return payload.folderId && isSharedFolder && requireRevoke
        ? of(
            ShareActions.revokeAccess({
              resourceId: payload.folderId,
              featureType: FeatureType.Chat,
              isFolder: true,
            }),
          )
        : EMPTY;
    }),
  );

export const ShareEpics = combineEpics(
  shareEpic,
  shareFailEpic,

  shareConversationEpic,
  sharePromptEpic,
  shareConversationFolderEpic,
  sharePromptFolderEpic,

  acceptInvitationEpic,
  acceptInvitationSuccessEpic,
  acceptInvitationFailEpic,

  revokeAccessEpic,
  revokeAccessSuccessEpic,
  revokeAccessFailEpic,

  discardSharedWithMeEpic,
  discardSharedWithMeSuccessEpic,
  discardSharedWithMeFailEpic,

  getSharedListingEpic,
  getSharedListingFailEpic,
  getSharedListingSuccessEpic,

  triggerGettingSharedListingsConversationsEpic,
  triggerGettingSharedListingsPromptsEpic,

  deleteOrRenameSharedFolderEpic,

  // reload
  initReloadSharedConversationsEpic,
  initReloadSharedPromptsEpic,
  triggerReloadSharedItemsEpic,
  reloadSharedListingFailEpic,
  reloadSharedListingSuccessEpic,
);
