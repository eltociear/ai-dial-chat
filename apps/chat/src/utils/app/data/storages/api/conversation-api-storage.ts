import { Observable, catchError, forkJoin, of } from 'rxjs';

import { cleanConversation } from '@/src/utils/app/clean';
import { prepareEntityName } from '@/src/utils/app/common';
import { getGeneratedConversationId } from '@/src/utils/app/conversation';
import { ConversationService } from '@/src/utils/app/data/conversation-service';
import { ApiEntityStorage } from '@/src/utils/app/data/storages/api/api-entity-storage';
import { constructPath } from '@/src/utils/app/file';
import { getPathToFolderById } from '@/src/utils/app/folders';
import {
  getConversationRootId,
  isRootConversationsId,
} from '@/src/utils/app/id';
import {
  getConversationApiKey,
  parseConversationApiKey,
} from '@/src/utils/server/api';

import { Conversation, ConversationInfo } from '@/src/types/chat';
import { ApiKeys, UploadStatus } from '@/src/types/common';
import { FolderInterface } from '@/src/types/folder';

import { ConversationsSelectors } from '@/src/store/conversations/conversations.reducers';

import { RootState } from '@/src/store';

export class ConversationApiStorage extends ApiEntityStorage<
  ConversationInfo,
  Conversation
> {
  mergeGetResult(info: ConversationInfo, entity: Conversation): Conversation {
    return {
      ...entity,
      ...info,
      lastActivityDate: info.lastActivityDate ?? entity.lastActivityDate,
      model: entity.model,
    };
  }

  cleanUpEntity(conversation: Conversation): Conversation {
    return cleanConversation(conversation);
  }

  getEntityKey(info: ConversationInfo): string {
    return getConversationApiKey(info);
  }

  parseEntityKey(key: string): Omit<ConversationInfo, 'folderId' | 'id'> {
    return parseConversationApiKey(key);
  }

  getStorageKey(): ApiKeys {
    return ApiKeys.Conversations;
  }
}

export const getOrUploadConversation = (
  payload: { id: string },
  state: RootState,
): Observable<{
  conversation: Conversation | null;
  payload: { id: string };
}> => {
  const conversation = ConversationsSelectors.selectConversation(
    state,
    payload.id,
  ) as Conversation;

  if (conversation?.status !== UploadStatus.LOADED) {
    return forkJoin({
      conversation: ConversationService.getConversation(conversation).pipe(
        catchError((err) => {
          console.error('The conversation was not found:', err);
          return of(null);
        }),
      ),
      payload: of(payload),
    });
  } else {
    return forkJoin({
      conversation: of(conversation),
      payload: of(payload),
    });
  }
};

export const getPreparedConversations = ({
  conversations,
  conversationsFolders,
  addRoot = false,
}: {
  conversations: Conversation[];
  conversationsFolders: FolderInterface[];
  addRoot?: boolean;
}) =>
  conversations.map((conv) => {
    const { path } = getPathToFolderById(conversationsFolders, conv.folderId, {
      forRenaming: true,
      replaceWithSpacesForRenaming: true,
    });

    const newName = prepareEntityName(conv.name, {
      forRenaming: true,
      replaceWithSpacesForRenaming: true,
    });

    return {
      ...conv,
      id: getGeneratedConversationId({
        ...conv,
        name: newName,
        folderId: path,
      }),
      name: newName,
      folderId: addRoot ? constructPath(getConversationRootId(), path) : path,
    };
  }); // to send conversation with proper parentPath and lastActivityDate order

export const getImportPreparedConversations = ({
  conversations,
  conversationsFolders,
}: {
  conversations: Conversation[] | ConversationInfo[];
  conversationsFolders: FolderInterface[];
}) =>
  conversations.map((conv) => {
    const { path } = getPathToFolderById(conversationsFolders, conv.folderId, {
      forRenaming: false,
    });

    const newName = prepareEntityName(conv.name);
    const rootId = isRootConversationsId(path) ? path : getConversationRootId();
    const folderId = constructPath(rootId, path);

    return {
      ...conv,
      id: getGeneratedConversationId({
        ...conv,
        name: newName,
        folderId: folderId,
      }),
      name: newName,
      folderId: folderId,
    };
  }); // to send conversation with proper parentPath and lastActivityDate order
