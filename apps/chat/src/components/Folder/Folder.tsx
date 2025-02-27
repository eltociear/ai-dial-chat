import { useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import { IconCheck, IconFolder, IconMinus, IconX } from '@tabler/icons-react';
import {
  ChangeEvent,
  DragEvent,
  FC,
  Fragment,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import classNames from 'classnames';

import {
  doesHaveDotsInTheEnd,
  hasInvalidNameInPath,
  isEntityNameInvalid,
  isEntityNameOnSameLevelUnique,
  prepareEntityName,
} from '@/src/utils/app/common';
import { getEntityNameError } from '@/src/utils/app/errors';
import { notAllowedSymbolsRegex } from '@/src/utils/app/file';
import {
  getChildAndCurrentFoldersIdsById,
  getFoldersDepth,
  getParentFolderIdsFromFolderId,
  sortByName,
} from '@/src/utils/app/folders';
import {
  hasParentWithAttribute,
  hasParentWithFloatingOverlay,
} from '@/src/utils/app/modals';
import {
  getDragImage,
  getEntityMoveType,
  getFolderMoveType,
  hasDragEventAnyData,
} from '@/src/utils/app/move';
import { doesEntityContainSearchItem } from '@/src/utils/app/search';
import { isEntityOrParentsExternal } from '@/src/utils/app/share';

import { Conversation, ConversationInfo } from '@/src/types/chat';
import { FeatureType, UploadStatus } from '@/src/types/common';
import { DialFile } from '@/src/types/files';
import { FolderInterface } from '@/src/types/folder';
import { PromptInfo } from '@/src/types/prompt';
import { SharingType } from '@/src/types/share';
import { Translation } from '@/src/types/translation';

import { ConversationsActions } from '@/src/store/conversations/conversations.reducers';
import { FilesActions } from '@/src/store/files/files.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { PromptsActions } from '@/src/store/prompts/prompts.reducers';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { ShareActions } from '@/src/store/share/share.reducers';
import { UIActions } from '@/src/store/ui/ui.reducers';

import SidebarActionButton from '@/src/components/Buttons/SidebarActionButton';
import CaretIconComponent from '@/src/components/Common/CaretIconComponent';

import CheckIcon from '../../../public/images/icons/check.svg';
import { PublishModal } from '../Chat/Publish/PublishWizard';
import { UnpublishModal } from '../Chat/Publish/UnpublishModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { FolderContextMenu } from '../Common/FolderContextMenu';
import ShareIcon from '../Common/ShareIcon';
import { Spinner } from '../Common/Spinner';
import Tooltip from '../Common/Tooltip';

export interface FolderProps<T, P = unknown> {
  currentFolder: FolderInterface;
  itemComponent?: FC<{
    item: T;
    level: number;
    readonly?: boolean;
    additionalItemData?: Record<string, unknown>;
    onEvent?: (eventId: string, data: P) => void;
    itemComponentClassNames?: string;
  }>;
  allItems?: T[];
  allFolders: FolderInterface[];
  level?: number;
  highlightedFolders?: string[];
  searchTerm: string;
  openedFoldersIds: string[];
  isInitialRenameEnabled?: boolean;
  newAddedFolderId?: string;
  loadingFolderIds?: string[];
  displayCaretAlways?: boolean;
  additionalItemData?: Record<string, unknown>;
  handleDrop?: (e: DragEvent, folder: FolderInterface) => void;
  onRenameFolder?: (newName: string, folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onSelectFolder?: (folderId: string, isSelected: boolean) => void;
  onAddFolder?: (parentFolderId: string) => void;
  onClickFolder?: (folderId: string) => void;
  featureType: FeatureType;
  onItemEvent?: (eventId: string, data: unknown) => void;
  readonly?: boolean;
  onFileUpload?: (parentFolderId: string) => void;
  maxDepth?: number;
  highlightTemporaryFolders?: boolean;
  withBorderHighlight?: boolean;
  allFoldersWithoutFilters?: FolderInterface[];
  allItemsWithoutFilters?: T[];
  folderClassName?: string;
  skipFolderRenameValidation?: boolean;
  noCaretIcon?: boolean;
  itemComponentClassNames?: string;
  canSelectFolders?: boolean;
  showTooltip?: boolean;
  isSidePanelFolder?: boolean;
}

const Folder = <T extends ConversationInfo | PromptInfo | DialFile>({
  currentFolder,
  searchTerm,
  itemComponent,
  allItems,
  allItemsWithoutFilters = [],
  allFolders,
  allFoldersWithoutFilters = [],
  highlightedFolders,
  openedFoldersIds,
  level = 0,
  isInitialRenameEnabled = false,
  newAddedFolderId,
  loadingFolderIds = [],
  displayCaretAlways = false,
  additionalItemData,
  handleDrop,
  onRenameFolder,
  onDeleteFolder,
  onSelectFolder,
  onClickFolder,
  onAddFolder,
  onFileUpload,
  onItemEvent,
  featureType,
  readonly = false,
  maxDepth,
  highlightTemporaryFolders,
  withBorderHighlight = true,
  folderClassName,
  skipFolderRenameValidation = false,
  noCaretIcon = false,
  itemComponentClassNames,
  canSelectFolders = false,
  showTooltip,
  isSidePanelFolder = true,
}: FolderProps<T>) => {
  const { t } = useTranslation(Translation.Chat);
  const dispatch = useAppDispatch();

  const [isDeletingConfirmDialog, setIsDeletingConfirmDialog] = useState(false);
  const [search, setSearch] = useState(searchTerm);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isRenaming, setIsRenaming] = useState(
    isInitialRenameEnabled &&
      newAddedFolderId === currentFolder.id &&
      !currentFolder.serverSynced,
  );
  const [renameValue, setRenameValue] = useState(currentFolder.name);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isContextMenu, setIsContextMenu] = useState(false);
  const [isConfirmRenaming, setIsConfirmRenaming] = useState(false);
  const dragDropElement = useRef<HTMLDivElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isUploadedForUnpublishing, setIsUploadedForUnpublishing] =
    useState(false);
  const [isUnshareConfirmOpened, setIsUnshareConfirmOpened] = useState(false);
  const isPublishingEnabled = useAppSelector((state) =>
    SettingsSelectors.isPublishingEnabled(state, featureType),
  );
  const isExternal = useAppSelector((state) =>
    isEntityOrParentsExternal(state, currentFolder, featureType),
  );
  const isNameInvalid = isEntityNameInvalid(currentFolder.name);
  const isInvalidPath = hasInvalidNameInPath(currentFolder.folderId);
  const isNameOrPathInvalid = isNameInvalid || isInvalidPath;
  const [isSelected, setIsSelected] = useState(false);
  const [isPartialSelected, setIsPartialSelected] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  const handleToggleFolder = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      setIsSelected((value) => {
        onSelectFolder?.(`${currentFolder.id}/`, value);
        return !value;
      });
    },
    [currentFolder.id, onSelectFolder],
  );

  useEffect(() => {
    const parentFolderIds = getParentFolderIdsFromFolderId(currentFolder.id);
    setIsSelected(
      parentFolderIds.some((id) =>
        ((additionalItemData?.selectedFolderIds as string[]) || []).includes(
          `${id}/`,
        ),
      ),
    );
  }, [additionalItemData?.selectedFolderIds, currentFolder.id]);

  useEffect(() => {
    const currentId = `${currentFolder.id}/`;
    setIsPartialSelected(
      !isSelected &&
        (
          (additionalItemData?.partialSelectedFolderIds as string[]) || []
        ).includes(currentId),
    );
  }, [
    additionalItemData?.partialSelectedFolderIds,
    currentFolder.id,
    isSelected,
  ]);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isPartialSelected && !isSelected;
    }
  }, [isPartialSelected, isSelected]);

  useEffect(() => {
    // only if search term was changed after first render
    // to allow `isInitialRenameEnabled` be used
    if (search !== searchTerm) {
      setIsRenaming(false);
    }
    setSearch(searchTerm);
  }, [search, searchTerm]);

  useEffect(() => {
    if (isRenaming) {
      // focus manually because `autoFocus` doesn't work well with several items and rerender
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [isRenaming]);

  const handleShare: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch(
        ShareActions.share({
          resourceId: currentFolder.id,
          featureType,
          isFolder: true,
        }),
      );
    },
    [currentFolder.id, dispatch, featureType],
  );
  const handleUnshare: MouseEventHandler = useCallback((e) => {
    e.stopPropagation();
    setIsUnshareConfirmOpened(true);
  }, []);

  const allChildItems = useMemo(() => {
    const folderPath = `${currentFolder.id}/`;
    return sortByName(
      allItems?.filter((item) => item.id.startsWith(folderPath)) || [],
    );
  }, [allItems, currentFolder.id]);

  const handleOpenPublishing: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation();

      if (
        featureType === FeatureType.Chat &&
        (!allChildItems.length ||
          !allChildItems.every((item) => (item as Conversation).messages))
      ) {
        dispatch(
          ConversationsActions.uploadConversationsByIds({
            conversationIds: allChildItems.map((e) => e.id),
            showLoader: true,
          }),
        );
      }

      setIsPublishing(true);
    },
    [allChildItems, dispatch, featureType],
  );

  const handleClosePublishModal = useCallback(() => {
    setIsPublishing(false);
  }, []);

  const handleOpenUnpublishing: MouseEventHandler = useCallback(
    (e) => {
      e.stopPropagation();

      if (featureType === FeatureType.Chat && !isUploadedForUnpublishing) {
        dispatch(
          ConversationsActions.uploadConversationsWithContentRecursive({
            path: currentFolder.id,
          }),
        );
      } else if (
        featureType === FeatureType.Prompt &&
        !isUploadedForUnpublishing
      ) {
        dispatch(
          PromptsActions.uploadPromptsWithFoldersRecursive({
            path: currentFolder.id,
            noLoader: true,
          }),
        );
      }

      setIsUploadedForUnpublishing(true);
      setIsUnpublishing(true);
    },
    [currentFolder.id, dispatch, featureType, isUploadedForUnpublishing],
  );

  const handleCloseUnpublishModal = useCallback(() => {
    setIsUnpublishing(false);
  }, []);

  const isFolderOpened = useMemo(() => {
    return openedFoldersIds.includes(currentFolder.id);
  }, [currentFolder.id, openedFoldersIds]);
  const filteredChildFolders = useMemo(() => {
    return sortByName(
      allFolders.filter((folder) => folder.folderId === currentFolder.id),
    );
  }, [currentFolder, allFolders]);
  const filteredChildItems = useMemo(() => {
    return sortByName(
      allItems?.filter(
        (item) =>
          item.folderId === currentFolder.id &&
          (!searchTerm || doesEntityContainSearchItem(item, searchTerm)),
      ) || [],
    );
  }, [allItems, currentFolder.id, searchTerm]);

  const hasChildElements = useMemo(() => {
    return filteredChildFolders.length > 0 || filteredChildItems.length > 0;
  }, [filteredChildFolders.length, filteredChildItems.length]);

  const hasChildItemOnAnyLevel = useMemo(() => {
    const prefix = `${currentFolder.id}/`;
    return allItemsWithoutFilters.some(
      (entity) =>
        entity.folderId === currentFolder.id ||
        entity.folderId.startsWith(prefix),
    );
  }, [allItemsWithoutFilters, currentFolder.id]);

  const { refs, context } = useFloating({
    open: isContextMenu,
    onOpenChange: setIsContextMenu,
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const handleNewFolderRename = useCallback(() => {
    if (newAddedFolderId === currentFolder.id) {
      dispatch(FilesActions.resetNewFolderId());
    }
  }, [newAddedFolderId, dispatch, currentFolder]);

  const handleRename = useCallback(() => {
    if (!onRenameFolder) {
      return;
    }

    const newName = prepareEntityName(renameValue, { forRenaming: true });
    setRenameValue(newName);

    if (!skipFolderRenameValidation) {
      if (
        !isEntityNameOnSameLevelUnique(
          newName,
          currentFolder,
          allFoldersWithoutFilters,
        )
      ) {
        dispatch(
          UIActions.showErrorToast(
            t(
              'Folder with name "{{folderName}}" already exists in this folder.',
              {
                ns: 'folder',
                folderName: newName,
              },
            ),
          ),
        );
        return;
      }

      if (doesHaveDotsInTheEnd(newName)) {
        dispatch(
          UIActions.showErrorToast(
            t('Using a dot at the end of a name is not permitted.'),
          ),
        );
        return;
      }
    }

    if (currentFolder.isShared && newName !== currentFolder.name) {
      setIsConfirmRenaming(true);
      setIsRenaming(false);
      setIsContextMenu(false);
      return;
    }

    if (newName && newName !== currentFolder.name) {
      onRenameFolder(newName, currentFolder.id);
    }

    handleNewFolderRename();

    setRenameValue('');
    setIsRenaming(false);
    setIsContextMenu(false);
  }, [
    onRenameFolder,
    renameValue,
    skipFolderRenameValidation,
    currentFolder,
    allFoldersWithoutFilters,
    handleNewFolderRename,
    dispatch,
    t,
  ]);

  const handleEnterDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRename();
      }
    },
    [handleRename],
  );

  const dropHandler = useCallback(
    (e: DragEvent) => {
      if (!handleDrop || isExternal || canSelectFolders) {
        return;
      }

      if (e.dataTransfer) {
        e.preventDefault();
        e.stopPropagation();

        dispatch(UIActions.openFolder({ id: currentFolder.id, featureType }));
        setIsDraggingOver(false);

        const folderData = e.dataTransfer.getData(
          getFolderMoveType(featureType),
        );

        if (folderData) {
          const draggedFolder = JSON.parse(folderData);

          if (draggedFolder.id === currentFolder.id) {
            return;
          }

          const childIds = new Set(
            getChildAndCurrentFoldersIdsById(draggedFolder.id, allFolders),
          );

          if (childIds.has(currentFolder.id)) {
            dispatch(
              UIActions.showErrorToast(
                t("It's not allowed to move parent folder in child folder"),
              ),
            );
            return;
          }

          const foldersDepth = getFoldersDepth(draggedFolder, allFolders);

          if (maxDepth && level + foldersDepth > maxDepth) {
            dispatch(
              UIActions.showErrorToast(
                t("It's not allowed to have more nested folders"),
              ),
            );
            return;
          }

          if (
            !isEntityNameOnSameLevelUnique(
              draggedFolder.name,
              { ...draggedFolder, folderId: currentFolder.id },
              allFoldersWithoutFilters,
            )
          ) {
            dispatch(
              UIActions.showErrorToast(
                t(
                  'Folder with name "{{folderName}}" already exists in this folder.',
                  {
                    ns: 'folder',
                    folderName: draggedFolder.name,
                  },
                ),
              ),
            );

            return;
          }
        }

        const entityData = e.dataTransfer.getData(
          getEntityMoveType(featureType),
        );
        if (entityData) {
          const draggedEntity = JSON.parse(entityData);

          if (
            !isEntityNameOnSameLevelUnique(
              draggedEntity.name,
              { ...draggedEntity, folderId: currentFolder.id },
              allItemsWithoutFilters,
            )
          ) {
            dispatch(
              UIActions.showErrorToast(
                t(
                  '{{entityType}} with name "{{entityName}}" already exists in this folder.',
                  {
                    ns: 'common',
                    entityType:
                      featureType === FeatureType.Chat
                        ? 'Conversation'
                        : 'Prompt',
                    entityName: draggedEntity.name,
                  },
                ),
              ),
            );

            return;
          }
        }

        handleDrop(e, currentFolder);
      }
    },
    [
      allFolders,
      allFoldersWithoutFilters,
      allItemsWithoutFilters,
      canSelectFolders,
      currentFolder,
      dispatch,
      featureType,
      handleDrop,
      isExternal,
      level,
      maxDepth,
      t,
    ],
  );

  const allowDrop = useCallback(
    (e: DragEvent) => {
      if (
        !canSelectFolders &&
        !isExternal &&
        hasDragEventAnyData(e, featureType)
      ) {
        e.preventDefault();
      }
    },
    [canSelectFolders, featureType, isExternal],
  );

  const isParentFolder = useCallback(
    (currentFolder: Element, checkedElement: Element) => {
      let isParentFolder = true;
      let parent = checkedElement.parentElement;
      while (parent) {
        if (parent.id === 'folder' && parent !== currentFolder) {
          isParentFolder = false;
          break;
        }
        if (currentFolder === parent) {
          break;
        }

        parent = parent.parentElement;
      }

      return isParentFolder;
    },
    [],
  );

  const highlightDrop = useCallback(
    (evt: DragEvent) => {
      if (isExternal || !hasDragEventAnyData(evt, featureType)) {
        return;
      }

      if (dragDropElement.current === evt.target) {
        setIsDraggingOver(true);
        return;
      }

      if (
        dragDropElement.current?.contains(evt.target as Node) &&
        isParentFolder(dragDropElement.current, evt.target as Element)
      ) {
        dispatch(UIActions.openFolder({ id: currentFolder.id, featureType }));
        setIsDraggingOver(true);
      }
    },
    [currentFolder.id, dispatch, featureType, isExternal, isParentFolder],
  );

  const deleteHighlight = useCallback(
    (evt: DragEvent) => {
      if (!dragDropElement.current?.contains(evt.relatedTarget as Node)) {
        setIsDraggingOver(false);
        return;
      }

      if (
        !isParentFolder(dragDropElement.current, evt.relatedTarget as Element)
      ) {
        setIsDraggingOver(false);
      }
    },
    [isParentFolder],
  );

  const onRename: MouseEventHandler = useCallback(
    (e) => {
      if (!onRenameFolder) {
        return;
      }

      e.stopPropagation();
      setIsRenaming(true);
      setRenameValue(currentFolder.name);
      // `setTimeout` because isRenaming should be applied to render input and only after that it can be focused
      setTimeout(() => renameInputRef.current?.focus());
    },
    [currentFolder.name, onRenameFolder],
  );

  const onDelete: MouseEventHandler = useCallback(
    (e) => {
      if (!onDeleteFolder) {
        return;
      }

      e.stopPropagation();
      setIsDeletingConfirmDialog(true);
    },
    [onDeleteFolder],
  );
  const onSelect: MouseEventHandler = useCallback(
    (e) => {
      if (!onSelectFolder) {
        return;
      }

      e.stopPropagation();
      onSelectFolder(`${currentFolder.id}/`, isSelected);
    },
    [currentFolder.id, isSelected, onSelectFolder],
  );
  const onAdd: MouseEventHandler = useCallback(
    (e) => {
      if (!onAddFolder) {
        return;
      }

      e.stopPropagation();

      if (maxDepth && level + 1 > maxDepth) {
        dispatch(
          UIActions.showErrorToast(
            t("It's not allowed to have more nested folders"),
          ),
        );
        return;
      }

      onAddFolder(currentFolder.id);
    },
    [currentFolder, dispatch, level, maxDepth, onAddFolder, t],
  );

  const onUpload: MouseEventHandler = useCallback(
    (e) => {
      if (!onFileUpload) {
        return;
      }

      e.stopPropagation();
      onFileUpload(currentFolder.id);
    },
    [currentFolder.id, onFileUpload],
  );

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, folder: FolderInterface) => {
      if (e.dataTransfer && !isExternal) {
        e.dataTransfer.setDragImage(getDragImage(), 0, 0);
        e.dataTransfer.setData(
          getFolderMoveType(featureType),
          JSON.stringify(folder),
        );
        dispatch(UIActions.closeFolder({ id: currentFolder.id, featureType }));
      }
    },
    [currentFolder.id, dispatch, featureType, isExternal],
  );

  const handleContextMenuOpen = (e: MouseEvent) => {
    if (hasParentWithFloatingOverlay(e.target as Element)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsContextMenu(true);
  };

  useEffect(() => {
    if (isRenaming) {
      setIsDeletingConfirmDialog(false);
    } else if (isDeletingConfirmDialog) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeletingConfirmDialog]);

  useEffect(() => {
    if (searchTerm) {
      dispatch(UIActions.openFolder({ id: currentFolder.id, featureType }));
    }
  }, [currentFolder.id, dispatch, featureType, searchTerm]);

  const isHighlighted =
    isRenaming ||
    isContextMenu ||
    ((additionalItemData?.selectedFolderIds as string[]) || []).includes(
      `${currentFolder.id}/`,
    ) ||
    (allItems === undefined && highlightedFolders?.includes(currentFolder.id));

  const hideContextMenu =
    (canSelectFolders && featureType !== FeatureType.File) ||
    readonly ||
    isRenaming;

  return (
    <div
      id="folder"
      className={classNames(
        'transition-colors duration-200',
        isDraggingOver && 'bg-accent-primary-alpha',
        currentFolder.temporary && 'text-primary',
      )}
      onDrop={dropHandler}
      onDragOver={allowDrop}
      onDragEnter={highlightDrop}
      onDragLeave={deleteHighlight}
      onContextMenu={handleContextMenuOpen}
      ref={dragDropElement}
    >
      <div
        className={classNames(
          'group/button group/folder-item group relative flex h-[30px] cursor-pointer items-center rounded border-l-2 hover:bg-accent-primary-alpha',
          (canSelectFolders || !withBorderHighlight) && 'border-transparent',
          isHighlighted ? 'bg-accent-primary-alpha' : 'border-transparent',
          !canSelectFolders &&
            isHighlighted &&
            withBorderHighlight &&
            'border-accent-primary',
          folderClassName,
        )}
        data-qa="folder"
        onClick={(e) => {
          if (
            onClickFolder &&
            !hasParentWithAttribute(
              e.target as HTMLDivElement,
              'data-item-checkbox',
            )
          ) {
            onClickFolder(currentFolder.id);
          }
        }}
        draggable={
          !!handleDrop &&
          !isExternal &&
          !isNameOrPathInvalid &&
          !canSelectFolders
        }
        onDragStart={(e) => handleDragStart(e, currentFolder)}
        onDragOver={(e) => {
          if (!isExternal && hasDragEventAnyData(e, featureType)) {
            e.preventDefault();
          }
        }}
      >
        {isRenaming ? (
          <div
            className="flex w-full items-center gap-1 py-2 pr-3"
            style={{
              paddingLeft: `${level * 1.5}rem`,
            }}
            data-qa="edit-container"
          >
            <CaretIconComponent
              isOpen={isFolderOpened}
              hidden={!hasChildElements && !displayCaretAlways}
            />

            {loadingFolderIds.includes(currentFolder.id) &&
            !hasChildElements ? (
              <Spinner />
            ) : (
              <>
                {!isSelected && (
                  <ShareIcon
                    {...currentFolder}
                    isHighlighted
                    featureType={featureType}
                    containerClassName={
                      !isExternal && canSelectFolders
                        ? 'group-hover/folder-item:hidden'
                        : ''
                    }
                  >
                    <IconFolder
                      size={18}
                      className={classNames(
                        'mr-1 text-secondary',
                        !isExternal &&
                          canSelectFolders &&
                          'group-hover/folder-item:hidden',
                      )}
                    />
                  </ShareIcon>
                )}
                {canSelectFolders &&
                  !isExternal &&
                  !loadingFolderIds.includes(currentFolder.id) && (
                    <div
                      className={classNames(
                        'relative mr-1 size-[18px] group-hover/folder-item:flex',
                        isSelected ? 'flex' : 'hidden',
                      )}
                      data-item-checkbox
                    >
                      <input
                        className="checkbox peer size-[18px] bg-layer-3"
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleToggleFolder}
                      />
                      <IconCheck
                        size={18}
                        className="pointer-events-none invisible absolute text-accent-primary peer-checked:visible"
                      />
                    </div>
                  )}
              </>
            )}

            <input
              className="mr-12 flex-1 overflow-hidden text-ellipsis bg-transparent text-left outline-none"
              type="text"
              value={renameValue}
              onChange={(e) =>
                setRenameValue(
                  e.target.value.replaceAll(notAllowedSymbolsRegex, ''),
                )
              }
              onKeyDown={handleEnterDown}
              ref={renameInputRef}
              name="edit-input"
            />
          </div>
        ) : (
          <div
            className="group/folder-item flex max-w-full items-center gap-1 py-2 pr-3"
            style={{
              paddingLeft: `${level * 24}px`,
            }}
          >
            <CaretIconComponent
              isOpen={isFolderOpened}
              hidden={
                (!hasChildElements &&
                  currentFolder.status === UploadStatus.LOADED &&
                  !displayCaretAlways) ||
                noCaretIcon
              }
            />

            {loadingFolderIds.includes(currentFolder.id) &&
            !hasChildElements ? (
              <Spinner className="mr-1" />
            ) : (
              <>
                {!isSelected && !isPartialSelected && (
                  <ShareIcon
                    {...currentFolder}
                    isHighlighted={isContextMenu}
                    featureType={featureType}
                    containerClassName={
                      !isExternal && canSelectFolders
                        ? 'group-hover/folder-item:hidden'
                        : ''
                    }
                  >
                    <IconFolder
                      size={18}
                      className={classNames(
                        'mr-1 text-secondary',
                        !isExternal &&
                          canSelectFolders &&
                          'group-hover/folder-item:hidden',
                      )}
                    />
                  </ShareIcon>
                )}
                {canSelectFolders &&
                  !isExternal &&
                  !loadingFolderIds.includes(currentFolder.id) && (
                    <div
                      className={classNames(
                        'relative mr-1 size-[18px] group-hover/folder-item:flex',
                        isSelected || isPartialSelected ? 'flex' : 'hidden',
                      )}
                      data-item-checkbox
                    >
                      <input
                        className="checkbox peer size-[18px] bg-layer-3"
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleToggleFolder}
                        ref={checkboxRef}
                        data-qa={
                          isSelected
                            ? 'checked'
                            : isPartialSelected
                              ? 'partiallyChecked'
                              : 'unchecked'
                        }
                      />
                      {isSelected && (
                        <IconCheck
                          size={18}
                          className="pointer-events-none absolute text-accent-primary"
                        />
                      )}
                      {isPartialSelected && (
                        <IconMinus
                          size={18}
                          className="pointer-events-none absolute text-accent-primary"
                        />
                      )}
                    </div>
                  )}
              </>
            )}
            <div
              className={classNames(
                'relative max-h-5 flex-1 truncate text-left',
                isNameOrPathInvalid && 'text-secondary',
                !hideContextMenu && 'group-hover/button:pr-5',
              )}
              data-qa="folder-name"
            >
              <Tooltip
                tooltip={
                  showTooltip && !isNameOrPathInvalid
                    ? currentFolder.name
                    : t(
                        getEntityNameError(
                          isNameInvalid,
                          isInvalidPath,
                          isExternal,
                        ),
                      )
                }
                contentClassName="sm:max-w-[400px] max-w-[250px] break-all"
                triggerClassName={classNames(
                  'block max-h-5 flex-1 truncate whitespace-pre break-all text-left',
                  highlightTemporaryFolders &&
                    (currentFolder.temporary
                      ? 'text-primary'
                      : 'text-secondary'),
                  isNameOrPathInvalid
                    ? 'text-secondary'
                    : highlightedFolders?.includes(currentFolder.id) &&
                        featureType &&
                        !canSelectFolders
                      ? 'text-accent-primary'
                      : 'text-primary',
                )}
              >
                {currentFolder.name}
              </Tooltip>
            </div>
            {(onDeleteFolder ||
              onRenameFolder ||
              onAddFolder ||
              onSelectFolder) &&
              !hideContextMenu && (
                <div
                  ref={refs.setFloating}
                  {...getFloatingProps()}
                  className={classNames(
                    'invisible absolute right-3 z-50 flex justify-end group-hover/button:visible',
                    isContextMenu && 'max-md:visible',
                  )}
                >
                  <FolderContextMenu
                    folder={currentFolder}
                    featureType={featureType}
                    onRename={
                      (onRenameFolder &&
                        !currentFolder.serverSynced &&
                        onRename) ||
                      undefined
                    }
                    onDelete={onDeleteFolder && onDelete}
                    onAddFolder={onAddFolder && onAdd}
                    onShare={handleShare}
                    onUnshare={handleUnshare}
                    onPublish={
                      featureType !== FeatureType.Chat ||
                      !allChildItems.every(
                        (item) => (item as ConversationInfo).isReplay,
                      )
                        ? handleOpenPublishing
                        : undefined
                    }
                    onUnpublish={handleOpenUnpublishing}
                    onPublishUpdate={handleOpenPublishing}
                    onOpenChange={setIsContextMenu}
                    onUpload={onFileUpload && onUpload}
                    isOpen={isContextMenu}
                    isEmpty={!hasChildItemOnAnyLevel}
                    isSidePanelFolder={isSidePanelFolder}
                    onSelect={onSelectFolder && onSelect}
                  />
                </div>
              )}
          </div>
        )}
        {isRenaming && (
          <div className="absolute right-1 z-10 flex" data-qa="actions">
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();
                if (isRenaming) {
                  handleRename();
                }
              }}
              dataQA="confirm-edit"
            >
              <CheckIcon
                width={18}
                height={18}
                size={18}
                className="hover:text-accent-primary"
              />
            </SidebarActionButton>
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();
                setIsRenaming(false);
                handleNewFolderRename();
              }}
              dataQA="cancel-edit"
            >
              <IconX
                width={18}
                height={18}
                size={18}
                className="hover:text-accent-primary"
                strokeWidth="2"
              />
            </SidebarActionButton>
          </div>
        )}
      </div>
      {isFolderOpened ? (
        <div className="flex flex-col gap-1">
          <div className="flex flex-col">
            {filteredChildFolders.map((item) => {
              return (
                <Fragment key={item.id}>
                  <div className="h-1"></div>
                  <Folder
                    folderClassName={folderClassName}
                    noCaretIcon={noCaretIcon}
                    readonly={readonly}
                    level={level + 1}
                    searchTerm={searchTerm}
                    currentFolder={item}
                    itemComponent={itemComponent}
                    allItems={allItems}
                    allItemsWithoutFilters={allItemsWithoutFilters}
                    allFolders={allFolders}
                    allFoldersWithoutFilters={allFoldersWithoutFilters}
                    highlightedFolders={highlightedFolders}
                    openedFoldersIds={openedFoldersIds}
                    loadingFolderIds={loadingFolderIds}
                    displayCaretAlways={displayCaretAlways}
                    additionalItemData={additionalItemData}
                    isInitialRenameEnabled={isInitialRenameEnabled}
                    newAddedFolderId={newAddedFolderId}
                    handleDrop={handleDrop}
                    onRenameFolder={onRenameFolder}
                    onFileUpload={onFileUpload}
                    onDeleteFolder={onDeleteFolder}
                    onAddFolder={onAddFolder}
                    onClickFolder={onClickFolder}
                    onItemEvent={onItemEvent}
                    featureType={featureType}
                    maxDepth={maxDepth}
                    highlightTemporaryFolders={highlightTemporaryFolders}
                    withBorderHighlight={withBorderHighlight}
                    itemComponentClassNames={itemComponentClassNames}
                    canSelectFolders={canSelectFolders}
                    showTooltip={showTooltip}
                    isSidePanelFolder={isSidePanelFolder}
                    onSelectFolder={onSelectFolder}
                  />
                </Fragment>
              );
            })}
          </div>
          {itemComponent &&
            filteredChildItems.map((item) => (
              <div key={item.id}>
                {createElement(itemComponent, {
                  item,
                  level: level + 1,
                  readonly,
                  additionalItemData,
                  itemComponentClassNames,
                  ...(!!onItemEvent && { onEvent: onItemEvent }),
                })}
              </div>
            ))}
        </div>
      ) : null}
      {onDeleteFolder && (
        <ConfirmDialog
          isOpen={isDeletingConfirmDialog}
          heading={t('Confirm deleting folder')}
          description={`${t('Are you sure that you want to delete a folder with all nested elements?')}${t(
            currentFolder.isShared
              ? '\nDeleting will stop sharing and other users will no longer see this folder.'
              : '',
          )}`}
          confirmLabel={t('Delete')}
          cancelLabel={t('Cancel')}
          onClose={(result) => {
            setIsDeletingConfirmDialog(false);
            if (result) {
              onDeleteFolder(currentFolder.id);
            }
          }}
        />
      )}
      {isPublishing && isPublishingEnabled && (
        <PublishModal
          entity={currentFolder}
          entities={
            featureType === FeatureType.Chat
              ? (
                  allChildItems as (Partial<Conversation> & ConversationInfo)[]
                ).filter(
                  (item) =>
                    item.isPlayback ||
                    (!item.isReplay && item.messages?.length),
                )
              : allChildItems
          }
          type={
            featureType === FeatureType.Prompt
              ? SharingType.PromptFolder
              : SharingType.ConversationFolder
          }
          isOpen
          onClose={handleClosePublishModal}
          depth={getFoldersDepth(currentFolder, allFolders)}
        />
      )}
      {isUnpublishing && isPublishingEnabled && (
        <UnpublishModal
          subtitle={
            featureType === FeatureType.Chat
              ? t(
                  'Folder/conversations will no longer be visible to the organization',
                )
              : t(
                  'Folder/prompts will no longer be visible to the organization',
                )
          }
          type={
            featureType === FeatureType.Chat
              ? SharingType.ConversationFolder
              : SharingType.PromptFolder
          }
          entity={currentFolder}
          entities={allChildItems}
          isOpen
          onClose={handleCloseUnpublishModal}
        />
      )}
      {isUnshareConfirmOpened && (
        <ConfirmDialog
          isOpen={isUnshareConfirmOpened}
          heading={t('Confirm unsharing: {{folderName}}', {
            folderName: currentFolder.name,
          })}
          description={
            t('Are you sure that you want to unshare this folder?') || ''
          }
          confirmLabel={t('Unshare')}
          cancelLabel={t('Cancel')}
          onClose={(result) => {
            setIsUnshareConfirmOpened(false);
            if (result) {
              dispatch(
                ShareActions.revokeAccess({
                  resourceId: currentFolder.id,
                  isFolder: true,
                  featureType,
                }),
              );
            }
          }}
        />
      )}
      <ConfirmDialog
        isOpen={isConfirmRenaming}
        heading={t('Confirm renaming folder')}
        confirmLabel={t('Rename')}
        cancelLabel={t('Cancel')}
        description={
          t(
            'Renaming will stop sharing and other users will no longer see this folder.',
          ) || ''
        }
        onClose={(result) => {
          setIsConfirmRenaming(false);
          if (result) {
            const newName = prepareEntityName(renameValue);

            if (newName) {
              onRenameFolder!(newName, currentFolder.id);
            }

            setRenameValue('');
          }
        }}
      />
    </div>
  );
};

export default Folder;
