import { useMemo } from 'react';

import { isRootId } from '../utils/app/id';

import { ConversationInfo } from '../types/chat';
import { DialFile } from '../types/files';
import { FolderInterface } from '../types/folder';
import { PromptInfo } from '../types/prompt';
import { PublicationResource } from '../types/publication';

import minBy from 'lodash-es/minBy';

export const usePublicationResources = <
  T extends PromptInfo | ConversationInfo | DialFile,
>(
  allFolders: FolderInterface[],
  resources: PublicationResource[],
  items: T[],
) => {
  const resourceUrls = useMemo(
    () => resources.map((r) => r.reviewUrl),
    [resources],
  );
  const itemsToDisplay = useMemo(
    () =>
      items.filter(
        (item) => isRootId(item.folderId) && resourceUrls.includes(item.id),
      ),
    [items, resourceUrls],
  );
  const folderItemsToDisplay = useMemo(
    () =>
      items.filter(
        (item) => !isRootId(item.folderId) && resourceUrls.includes(item.id),
      ),
    [items, resourceUrls],
  );
  const rootFolder = useMemo(
    () =>
      minBy(
        allFolders.filter((f) =>
          resourceUrls.some((url) => url.startsWith(`${f.id}/`)),
        ),
        (item) => item.id.split('/').length,
      ),
    [allFolders, resourceUrls],
  );

  return {
    itemsToDisplay,
    folderItemsToDisplay,
    rootFolder,
  };
};
