import { useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  MouseEventHandler,
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
  isEntityNameOrPathInvalid,
  prepareEntityName,
  trimEndDots,
} from '@/src/utils/app/common';
import { getEntityNameError } from '@/src/utils/app/errors';
import { constructPath, notAllowedSymbolsRegex } from '@/src/utils/app/file';
import { getNextDefaultName } from '@/src/utils/app/folders';
import { getConversationRootId } from '@/src/utils/app/id';
import { hasParentWithFloatingOverlay } from '@/src/utils/app/modals';
import { MoveType, getDragImage } from '@/src/utils/app/move';
import { defaultMyItemsFilters } from '@/src/utils/app/search';
import { isEntityOrParentsExternal } from '@/src/utils/app/share';
import { translate } from '@/src/utils/app/translation';

import { Conversation, ConversationInfo } from '@/src/types/chat';
import { FeatureType, UploadStatus, isNotLoaded } from '@/src/types/common';
import { MoveToFolderProps } from '@/src/types/folder';
import { SharingType } from '@/src/types/share';
import { Translation } from '@/src/types/translation';

import {
  ConversationsActions,
  ConversationsSelectors,
} from '@/src/store/conversations/conversations.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { ImportExportActions } from '@/src/store/import-export/importExport.reducers';
import { ModelsSelectors } from '@/src/store/models/models.reducers';
import { ShareActions } from '@/src/store/share/share.reducers';
import { UIActions } from '@/src/store/ui/ui.reducers';

import { DEFAULT_FOLDER_NAME } from '@/src/constants/default-ui-settings';

import SidebarActionButton from '@/src/components/Buttons/SidebarActionButton';
import { PlaybackIcon } from '@/src/components/Chat/Playback/PlaybackIcon';
import { ReplayAsIsIcon } from '@/src/components/Chat/ReplayAsIsIcon';
import ItemContextMenu from '@/src/components/Common/ItemContextMenu';
import { MoveToFolderMobileModal } from '@/src/components/Common/MoveToFolderMobileModal';
import ShareIcon from '@/src/components/Common/ShareIcon';

import { PublishModal } from '../Chat/Publish/PublishWizard';
import { UnpublishModal } from '../Chat/Publish/UnpublishModal';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import Tooltip from '../Common/Tooltip';
import { ExportModal } from './ExportModal';
import { ModelIcon } from './ModelIcon';

interface ViewProps {
  conversation: ConversationInfo;
  isHighlited: boolean;
  isInvalid: boolean;
  isChosen?: boolean;
  isSelectMode?: boolean;
}

export function ConversationView({
  conversation,
  isHighlited,
  isInvalid,
  isChosen = false,
  isSelectMode,
}: ViewProps) {
  const { t } = useTranslation(Translation.Chat);
  const modelsMap = useAppSelector(ModelsSelectors.selectModelsMap);
  const isNameInvalid = isEntityNameInvalid(conversation.name);
  const isInvalidPath = hasInvalidNameInPath(conversation.folderId);
  const isNameOrPathInvalid = isNameInvalid || isInvalidPath;
  const isExternal = useAppSelector((state) =>
    isEntityOrParentsExternal(state, conversation, FeatureType.Chat),
  );

  const handleToggle = useCallback(() => {
    ConversationsActions.setChosenConversation({
      conversationId: conversation.id,
      isChosen,
    });
  }, [conversation.id, isChosen]);

  return (
    <>
      <div
        className={classNames(
          'relative size-[18px]',
          isSelectMode &&
            !isExternal &&
            'shrink-0 group-hover/conversation-item:flex',
          isSelectMode && isChosen && !isExternal ? 'flex' : 'hidden',
        )}
      >
        <input
          className="checkbox peer size-[18px] bg-layer-3"
          type="checkbox"
          checked={isChosen}
          onChange={handleToggle}
          data-qa={isChosen ? 'checked' : 'unchecked'}
        />
        <IconCheck
          size={18}
          className="pointer-events-none invisible absolute text-accent-primary peer-checked:visible"
        />
      </div>
      <ShareIcon
        {...conversation}
        isHighlighted={isHighlited}
        featureType={FeatureType.Chat}
        isInvalid={isInvalid}
        containerClassName={classNames(
          isSelectMode && !isExternal && 'group-hover/conversation-item:hidden',
          isChosen && !isExternal && 'hidden',
        )}
      >
        {conversation.isReplay && (
          <span className="flex shrink-0">
            <ReplayAsIsIcon size={18} />
          </span>
        )}

        {conversation.isPlayback && (
          <span className="flex shrink-0">
            <PlaybackIcon size={18} />
          </span>
        )}

        {!conversation.isReplay && !conversation.isPlayback && (
          <ModelIcon
            size={18}
            entityId={conversation.model.id}
            entity={modelsMap[conversation.model.id]}
            isInvalid={isInvalid}
          />
        )}
      </ShareIcon>
      <div
        className="relative max-h-5 flex-1 truncate whitespace-pre break-all text-left"
        data-qa="conversation-name"
      >
        <Tooltip
          tooltip={t(
            getEntityNameError(isNameInvalid, isInvalidPath, isExternal),
          )}
          hideTooltip={!isNameOrPathInvalid}
          triggerClassName="block max-h-5 flex-1 truncate whitespace-pre break-all text-left"
        >
          {conversation.name}
        </Tooltip>
      </div>
    </>
  );
}

interface Props {
  item: ConversationInfo;
  level?: number;
  additionalItemData?: Record<string, unknown>;
}

export const ConversationComponent = ({
  item: conversation,
  level,
  additionalItemData,
}: Props) => {
  const { t } = useTranslation(Translation.Chat);

  const dispatch = useAppDispatch();

  const modelsMap = useAppSelector(ModelsSelectors.selectModelsMap);
  const selectedConversationIds = useAppSelector(
    ConversationsSelectors.selectSelectedConversationsIds,
  );

  const messageIsStreaming = useAppSelector(
    ConversationsSelectors.selectIsConversationsStreaming,
  );
  const isReplay = (conversation as Conversation).replay?.isReplay;
  const folders = useAppSelector((state) =>
    ConversationsSelectors.selectFilteredFolders(
      state,
      defaultMyItemsFilters,
      '',
      true,
    ),
  );
  const isPlayback = (conversation as Conversation).playback?.isPlayback;
  const isExternal = useAppSelector((state) =>
    isEntityOrParentsExternal(state, conversation, FeatureType.Chat),
  );
  const allConversations = useAppSelector(
    ConversationsSelectors.selectConversations,
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isShowMoveToModal, setIsShowMoveToModal] = useState(false);
  const [isShowExportModal, setIsShowExportModal] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isContextMenu, setIsContextMenu] = useState(false);
  const [isConfirmRenaming, setIsConfirmRenaming] = useState(false);
  const [isUnshareConfirmOpened, setIsUnshareConfirmOpened] = useState(false);

  const isSelected = selectedConversationIds.includes(conversation.id);

  const isSelectMode = useAppSelector(
    ConversationsSelectors.selectIsSelectMode,
  );
  const chosenConversationIds = useAppSelector(
    ConversationsSelectors.selectChosenConversationIds,
  );
  const chosenFolderIds = useAppSelector(
    ConversationsSelectors.selectChosenFolderIds,
  );
  const isChosen = useMemo(
    () =>
      chosenConversationIds.includes(conversation.id) ||
      chosenFolderIds.some((folderId) => conversation.id.startsWith(folderId)),
    [chosenConversationIds, chosenFolderIds, conversation.id],
  );

  const { refs, context } = useFloating({
    open: isContextMenu,
    onOpenChange: setIsContextMenu,
  });

  useEffect(() => {
    if (isContextMenu && isNotLoaded(conversation.status)) {
      dispatch(
        ConversationsActions.uploadConversationsByIds({
          conversationIds: [conversation.id],
        }),
      );
    }
  }, [conversation.id, conversation.status, dispatch, isContextMenu]);

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const isEmptyConversation = !(
    (conversation as Conversation).messages?.length > 0
  );

  const performRename = useCallback(
    (name: string) => {
      if (name.length > 0) {
        dispatch(
          ConversationsActions.updateConversation({
            id: conversation.id,
            values: {
              name,
              isNameChanged: true,
              isShared: false,
            },
          }),
        );

        setRenameValue('');
        setIsContextMenu(false);
      }

      setIsRenaming(false);
    },
    [conversation.id, dispatch],
  );

  const handleRename = useCallback(() => {
    const newName = prepareEntityName(renameValue, { forRenaming: true });
    setRenameValue(newName);

    if (
      !isEntityNameOnSameLevelUnique(newName, conversation, allConversations)
    ) {
      dispatch(
        UIActions.showErrorToast(
          t(
            'Conversation with name "{{newName}}" already exists in this folder.',
            {
              ns: 'chat',
              newName,
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

    if (conversation.isShared && newName !== conversation.name) {
      setIsConfirmRenaming(true);
      setIsContextMenu(false);
      setIsRenaming(false);
      return;
    }

    performRename(trimEndDots(newName));
  }, [allConversations, conversation, dispatch, performRename, renameValue, t]);

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

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>, conversation: ConversationInfo) => {
      if (e.dataTransfer && !isExternal && !isSelectMode) {
        e.dataTransfer.setDragImage(getDragImage(), 0, 0);
        e.dataTransfer.setData(
          MoveType.Conversation,
          JSON.stringify(conversation),
        );
      }
    },
    [isExternal, isSelectMode],
  );

  const handleDelete = useCallback(() => {
    if (conversation.sharedWithMe) {
      dispatch(
        ShareActions.discardSharedWithMe({
          resourceId: conversation.id,
          featureType: FeatureType.Chat,
        }),
      );
    } else {
      dispatch(
        ConversationsActions.deleteConversations({
          conversationIds: [conversation.id],
        }),
      );
    }
    setIsDeleting(false);
  }, [conversation.id, conversation.sharedWithMe, dispatch]);

  const handleCancelRename: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsRenaming(false);
    },
    [],
  );

  const handleStartRename: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsRenaming(true);
      setRenameValue(conversation.name);
    },
    [conversation.name],
  );
  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> =
    useCallback((e) => {
      e.stopPropagation();
      setIsDeleting(true);
    }, []);

  const handleStartReplay: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsContextMenu(false);
      dispatch(ConversationsActions.createNewReplayConversation(conversation));
    },
    [conversation, dispatch],
  );

  const handleCreatePlayback: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      dispatch(
        ConversationsActions.createNewPlaybackConversation(conversation),
      );
      setIsContextMenu(false);
    }, [conversation, dispatch]);

  const handleCompare: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      if (isReplay || isPlayback) return;
      dispatch(
        ConversationsActions.selectConversations({
          conversationIds: [conversation.id],
        }),
      );
      dispatch(UIActions.setIsCompareMode(true));
    }, [conversation.id, dispatch, isPlayback, isReplay]);

  const handleDuplicate: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsContextMenu(false);
      dispatch(ConversationsActions.duplicateConversation(conversation));
    },
    [conversation, dispatch],
  );

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsContextMenu(false);
      dispatch(
        ConversationsActions.setChosenConversation({
          conversationId: conversation.id,
          isChosen,
        }),
      );
    },
    [conversation.id, dispatch, isChosen],
  );

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }); // set auto-focus
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  const handleOpenSharing: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      dispatch(
        ShareActions.share({
          featureType: FeatureType.Chat,
          resourceId: conversation.id,
        }),
      );
      setIsContextMenu(false);
    }, [conversation.id, dispatch]);

  const handleUnshare: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      setIsUnshareConfirmOpened(true);
      setIsContextMenu(false);
    }, []);

  const handleOpenPublishing: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      setIsPublishing(true);
      setIsContextMenu(false);
    }, []);

  const handleClosePublishModal = useCallback(() => {
    setIsPublishing(false);
  }, []);

  const handleOpenUnpublishing: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      setIsUnpublishing(true);
      setIsContextMenu(false);
    }, []);

  const handleCloseUnpublishModal = useCallback(() => {
    setIsUnpublishing(false);
  }, []);

  const handleMoveToFolder = useCallback(
    ({ folderId, isNewFolder }: MoveToFolderProps) => {
      const conversationRootId = getConversationRootId();
      const folderPath = (
        isNewFolder
          ? getNextDefaultName(
              translate(DEFAULT_FOLDER_NAME),
              folders.filter((f) => f.folderId === conversationRootId), // only my root conversation folders
            )
          : folderId
      ) as string;

      if (
        !isEntityNameOnSameLevelUnique(
          conversation.name,
          { ...conversation, folderId: folderPath },
          allConversations,
        )
      ) {
        dispatch(
          UIActions.showErrorToast(
            t(
              'Conversation with name "{{name}}" already exists in this folder.',
              {
                ns: 'chat',
                name: conversation.name,
              },
            ),
          ),
        );

        return;
      }

      if (isNewFolder) {
        dispatch(
          ConversationsActions.createFolder({
            name: folderPath,
            parentId: getConversationRootId(),
          }),
        );
      }
      dispatch(
        ConversationsActions.updateConversation({
          id: conversation.id,
          values: {
            folderId: isNewFolder
              ? constructPath(getConversationRootId(), folderPath)
              : folderPath,
          },
        }),
      );
    },
    [allConversations, conversation, dispatch, folders, t],
  );
  const handleOpenExportModal = useCallback(() => {
    setIsShowExportModal(true);
  }, []);
  const handleCloseExportModal = useCallback(() => {
    setIsShowExportModal(false);
  }, []);

  const handleExport = useCallback(
    (args?: unknown) => {
      const typedArgs = args as { withAttachments?: boolean };
      if (typedArgs?.withAttachments) {
        dispatch(
          ImportExportActions.exportConversation({
            conversationId: conversation.id,
            withAttachments: true,
          }),
        );
      } else {
        dispatch(
          ImportExportActions.exportConversation({
            conversationId: conversation.id,
          }),
        );
      }
      handleCloseExportModal();
    },
    [conversation.id, dispatch, handleCloseExportModal],
  );

  const handleContextMenuOpen = (e: MouseEvent) => {
    if (hasParentWithFloatingOverlay(e.target as Element)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsContextMenu(true);
  };

  const isHighlighted = !isSelectMode
    ? isSelected || isRenaming || isDeleting
    : isChosen;
  const isNameOrPathInvalid = isEntityNameOrPathInvalid(conversation);

  useEffect(() => {
    if (isSelectMode) {
      setIsRenaming(false);
      setIsDeleting(false);
    }
  }, [isSelectMode]);

  return (
    <div
      className={classNames(
        'group/conversation-item relative flex h-[30px] items-center rounded border-l-2 pr-3 hover:bg-accent-primary-alpha',
        !isSelectMode && isHighlighted
          ? 'border-l-accent-primary'
          : 'border-l-transparent',
        isHighlighted && 'bg-accent-primary-alpha',
        { 'bg-accent-primary-alpha': isContextMenu },
        isNameOrPathInvalid && !isRenaming && 'text-secondary',
      )}
      style={{
        paddingLeft: (level && `${0.875 + level * 1.5}rem`) || '0.875rem',
      }}
      onContextMenu={handleContextMenuOpen}
      data-qa="conversation"
    >
      {isRenaming ? (
        <div
          className="flex w-full items-center gap-2 pr-12"
          data-qa="edit-container"
        >
          <ShareIcon
            {...conversation}
            isHighlighted={isHighlighted}
            featureType={FeatureType.Chat}
          >
            {conversation.isReplay && (
              <span className="flex shrink-0">
                <ReplayAsIsIcon size={18} />
              </span>
            )}

            {conversation.isPlayback && (
              <span className="flex shrink-0">
                <PlaybackIcon size={18} />
              </span>
            )}

            {!conversation.isReplay && !conversation.isPlayback && (
              <ModelIcon
                size={18}
                entityId={conversation.model.id}
                entity={modelsMap[conversation.model.id]}
              />
            )}
          </ShareIcon>
          <input
            className="flex-1 overflow-hidden text-ellipsis bg-transparent text-left outline-none"
            type="text"
            value={renameValue}
            name="edit-input"
            onChange={(e) =>
              setRenameValue(
                e.target.value.replaceAll(notAllowedSymbolsRegex, ''),
              )
            }
            onKeyDown={handleEnterDown}
            autoFocus
            ref={inputRef}
          />
        </div>
      ) : (
        <button
          className={classNames(
            'group/conversation-item flex size-full cursor-pointer items-center gap-2 transition-colors duration-200 disabled:cursor-not-allowed',
            isSelectMode
              ? 'pr-0'
              : '[&:not(:disabled)]:group-hover/conversation-item:pr-6',
          )}
          onClick={() => {
            setIsDeleting(false);
            setIsRenaming(false);
            if (!isSelectMode || !isExternal) {
              dispatch(
                !isSelectMode
                  ? ConversationsActions.selectConversations({
                      conversationIds: [conversation.id],
                    })
                  : ConversationsActions.setChosenConversation({
                      conversationId: conversation.id,
                      isChosen,
                    }),
              );
            }
          }}
          disabled={messageIsStreaming || (isSelectMode && isExternal)}
          draggable={!isExternal && !isNameOrPathInvalid && !isSelectMode}
          onDragStart={(e) => handleDragStart(e, conversation)}
          ref={buttonRef}
          data-qa={isSelected ? 'selected' : null}
        >
          <ConversationView
            conversation={conversation}
            isHighlited={isHighlighted || isContextMenu}
            isInvalid={isNameOrPathInvalid}
            isChosen={isChosen}
            isSelectMode={isSelectMode}
          />
        </button>
      )}

      {!isSelectMode && !isDeleting && !isRenaming && !messageIsStreaming && (
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          className={classNames(
            'absolute right-3 z-50 flex cursor-pointer justify-end group-hover/conversation-item:visible',
            (conversation.status === UploadStatus.LOADED || !isContextMenu) &&
              'invisible',
          )}
          data-qa="dots-menu"
        >
          <ItemContextMenu
            entity={conversation}
            isEmptyConversation={
              !isReplay && !isPlayback && isEmptyConversation
            }
            folders={folders}
            featureType={FeatureType.Chat}
            onOpenMoveToModal={() => setIsShowMoveToModal(true)}
            onMoveToFolder={handleMoveToFolder}
            onDelete={handleOpenDeleteModal}
            onRename={handleStartRename}
            onExport={handleExport}
            onOpenExportModal={handleOpenExportModal}
            onCompare={!isReplay && !isPlayback ? handleCompare : undefined}
            onDuplicate={handleDuplicate}
            onReplay={!isReplay && !isPlayback ? handleStartReplay : undefined}
            onPlayback={
              !isReplay && !isPlayback ? handleCreatePlayback : undefined
            }
            onShare={!isReplay ? handleOpenSharing : undefined}
            onUnshare={!isReplay ? handleUnshare : undefined}
            onPublish={!isReplay ? handleOpenPublishing : undefined}
            onUnpublish={
              isReplay || additionalItemData?.isApproveRequiredResource
                ? undefined
                : handleOpenUnpublishing
            }
            onOpenChange={setIsContextMenu}
            isOpen={isContextMenu}
            isLoading={conversation.status !== UploadStatus.LOADED}
            onSelect={handleSelect}
          />
        </div>
      )}
      <div className="md:hidden">
        {isShowMoveToModal && (
          <MoveToFolderMobileModal
            onClose={() => {
              setIsShowMoveToModal(false);
            }}
            folders={folders}
            onMoveToFolder={handleMoveToFolder}
          />
        )}
      </div>
      <div className="md:hidden">
        {isShowExportModal && (
          <ExportModal
            onExport={handleExport}
            onClose={handleCloseExportModal}
            isOpen={isShowExportModal}
          />
        )}
      </div>

      {isRenaming && (
        <div className="absolute right-1 z-10 flex" data-qa="actions">
          <SidebarActionButton
            handleClick={() => handleRename()}
            dataQA="confirm-edit"
          >
            <IconCheck size={18} className="hover:text-accent-primary" />
          </SidebarActionButton>
          <SidebarActionButton
            handleClick={handleCancelRename}
            dataQA="cancel-edit"
          >
            <IconX
              size={18}
              strokeWidth="2"
              className="hover:text-accent-primary"
            />
          </SidebarActionButton>
        </div>
      )}
      {isPublishing && (
        <PublishModal
          entity={conversation}
          entities={[conversation]}
          type={SharingType.Conversation}
          isOpen
          onClose={handleClosePublishModal}
        />
      )}
      {isUnpublishing && (
        <UnpublishModal
          subtitle={t(
            'Conversation will no longer be visible to the organization',
          )}
          entity={conversation}
          entities={[conversation]}
          isOpen
          onClose={handleCloseUnpublishModal}
          type={SharingType.Conversation}
        />
      )}
      {isUnshareConfirmOpened && (
        <ConfirmDialog
          isOpen={isUnshareConfirmOpened}
          heading={t('Confirm unsharing: {{conversationName}}', {
            conversationName: conversation.name,
          })}
          description={
            t('Are you sure that you want to unshare this conversation?') || ''
          }
          confirmLabel={t('Unshare')}
          cancelLabel={t('Cancel')}
          onClose={(result) => {
            setIsUnshareConfirmOpened(false);
            if (result) {
              dispatch(
                ShareActions.revokeAccess({
                  resourceId: conversation.id,
                  featureType: FeatureType.Chat,
                }),
              );
            }
          }}
        />
      )}
      <ConfirmDialog
        isOpen={isDeleting}
        heading={t('Confirm deleting conversation')}
        description={`${t('Are you sure that you want to delete a conversation?')}${t(
          conversation.isShared
            ? '\nDeleting will stop sharing and other users will no longer see this conversation.'
            : '',
        )}`}
        confirmLabel={t('Delete')}
        cancelLabel={t('Cancel')}
        onClose={(result) => {
          setIsDeleting(false);
          if (result) handleDelete();
        }}
      />
      <ConfirmDialog
        isOpen={isConfirmRenaming}
        heading={t('Confirm renaming conversation')}
        confirmLabel={t('Rename')}
        cancelLabel={t('Cancel')}
        description={
          t(
            'Renaming will stop sharing and other users will no longer see this conversation.',
          ) || ''
        }
        onClose={(result) => {
          setIsConfirmRenaming(false);

          if (result) {
            performRename(
              prepareEntityName(renameValue, { forRenaming: true }),
            );
          }

          setIsContextMenu(false);
          setIsRenaming(false);
        }}
      />
    </div>
  );
};
