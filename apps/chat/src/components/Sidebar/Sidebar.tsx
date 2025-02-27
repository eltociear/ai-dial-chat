import {
  DragEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import classNames from 'classnames';

import { EnumMapper } from '@/src/utils/app/mappers';
import { hasDragEventEntityData } from '@/src/utils/app/move';

import { SidebarSide } from '@/src/types/chat';
import { FeatureType } from '@/src/types/common';
import { FolderInterface } from '@/src/types/folder';
import { SearchFilters } from '@/src/types/search';
import { Translation } from '@/src/types/translation';

import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { UIActions, UISelectors } from '@/src/store/ui/ui.reducers';

import {
  CENTRAL_CHAT_MIN_WIDTH,
  DESKTOP_BREAKPOINT,
} from '@/src/constants/chat';
import { SIDEBAR_MIN_WIDTH } from '@/src/constants/default-ui-settings';

import Loader from '../Common/Loader';
import { NoData } from '../Common/NoData';
import { NoResultsFound } from '../Common/NoResultsFound';
import Search from '../Search';
import { LeftSideResizeIcon, RightSideResizeIcon } from './ResizeIcons';

import trimEnd from 'lodash-es/trimEnd';
import { Resizable, ResizableProps, ResizeCallback } from 're-resizable';

interface Props<T> {
  isOpen: boolean;
  side: 'left' | 'right';
  filteredItems: T[];
  filteredFolders: FolderInterface[];
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  actionButtons: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  searchFilters: SearchFilters;
  featureType: FeatureType;
  handleSearchTerm: (searchTerm: string) => void;
  handleSearchFilters: (searchFilters: SearchFilters) => void;
  toggleOpen?: () => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  areEntitiesUploaded: boolean;
}

const Sidebar = <T,>({
  isOpen,
  actionButtons,
  side,
  filteredItems,
  filteredFolders,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  searchFilters,
  featureType,
  handleSearchTerm,
  handleSearchFilters,
  handleDrop,
  areEntitiesUploaded,
}: Props<T>) => {
  const { t } = useTranslation(Translation.PromptBar);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragDropElement = useRef<HTMLDivElement>(null);
  const sideBarElementRef = useRef<Resizable>(null);
  const dispatch = useAppDispatch();
  const chatbarWidth = useAppSelector(UISelectors.selectChatbarWidth);
  const promptbarWidth = useAppSelector(UISelectors.selectPromptbarWidth);

  const isOverlay = useAppSelector(SettingsSelectors.selectIsOverlay);

  const [windowWidth, setWindowWidth] = useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
  });

  const isLeftSidebar = side === SidebarSide.Left;
  const isRightSidebar = side === SidebarSide.Right;

  const dataQa = useMemo(
    () => (isLeftSidebar ? 'chatbar' : 'promptbar'),
    [isLeftSidebar],
  );

  const resizeTriggerColor = classNames(
    'xl:bg-accent-primary xl:text-accent-primary',
    isResizing ? 'bg-accent-primary text-accent-primary' : '',
  );

  const resizeTriggerClassName = classNames(
    'invisible h-full w-0.5 bg-layer-3 text-secondary group-hover:visible md:visible',
    resizeTriggerColor,
    isResizing ? 'xl:visible' : 'xl:invisible',
  );

  const SIDEBAR_WIDTH = useMemo(
    () => (isLeftSidebar ? chatbarWidth : promptbarWidth),
    [isLeftSidebar, chatbarWidth, promptbarWidth],
  );

  const maxWidth = useMemo(() => {
    if (!windowWidth) return;
    return windowWidth - SIDEBAR_MIN_WIDTH - CENTRAL_CHAT_MIN_WIDTH;
  }, [windowWidth]);

  const SIDEBAR_HEIGHT = 'auto';

  const allowDrop = useCallback(
    (e: DragEvent) => {
      if (hasDragEventEntityData(e, featureType)) {
        e.preventDefault();
      }
    },
    [featureType],
  );

  const highlightDrop = useCallback(
    (e: DragEvent) => {
      if (
        hasDragEventEntityData(e, featureType) &&
        (dragDropElement.current?.contains(e.target as Node) ||
          dragDropElement.current === e.target)
      ) {
        setIsDraggingOver(true);
      }
    },
    [featureType],
  );

  const removeHighlight = useCallback((e: DragEvent) => {
    if (
      (e.target === dragDropElement.current ||
        dragDropElement.current?.contains(e.target as Node)) &&
      !dragDropElement.current?.contains(e.relatedTarget as Node)
    ) {
      setIsDraggingOver(false);
    }
  }, []);

  const onResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const onResize: ResizeCallback = useCallback(() => {
    if (!windowWidth || windowWidth < DESKTOP_BREAKPOINT) return;

    const sidebarCurrentWidth =
      sideBarElementRef.current?.resizable?.getClientRects()[0].width;
    const resizableWidth =
      sidebarCurrentWidth && Math.round(sidebarCurrentWidth);

    const width = resizableWidth ?? SIDEBAR_MIN_WIDTH;

    const sidebarAndCentralWidth = width + CENTRAL_CHAT_MIN_WIDTH;
    const maxOppositeSidebarWidth = windowWidth - sidebarAndCentralWidth;

    const centralChatWidth = (sidebarWidth: number | undefined) =>
      windowWidth - (width + (sidebarWidth ?? SIDEBAR_MIN_WIDTH));

    if (
      isLeftSidebar &&
      centralChatWidth(promptbarWidth) <= CENTRAL_CHAT_MIN_WIDTH
    ) {
      dispatch(UIActions.setPromptbarWidth(maxOppositeSidebarWidth));
    }

    if (
      isRightSidebar &&
      centralChatWidth(chatbarWidth) <= CENTRAL_CHAT_MIN_WIDTH
    ) {
      dispatch(UIActions.setChatbarWidth(maxOppositeSidebarWidth));
    }
  }, [
    dispatch,
    isLeftSidebar,
    isRightSidebar,
    chatbarWidth,
    promptbarWidth,
    windowWidth,
  ]);

  const onResizeStop = useCallback(() => {
    setIsResizing(false);
    const resizibleWidth =
      sideBarElementRef.current?.resizable?.getClientRects()[0].width &&
      Math.round(
        sideBarElementRef.current?.resizable?.getClientRects()[0].width,
      );

    const width = resizibleWidth ?? SIDEBAR_MIN_WIDTH;

    if (isLeftSidebar) {
      dispatch(UIActions.setChatbarWidth(width));
    }

    if (isRightSidebar) {
      dispatch(UIActions.setPromptbarWidth(width));
    }
  }, [dispatch, isLeftSidebar, isRightSidebar]);

  const resizeSettings: ResizableProps = useMemo(() => {
    return {
      defaultSize: {
        width: SIDEBAR_WIDTH ?? SIDEBAR_MIN_WIDTH,
        height: SIDEBAR_HEIGHT,
      },
      minWidth: SIDEBAR_MIN_WIDTH,
      maxWidth,

      size: {
        width: SIDEBAR_WIDTH ?? SIDEBAR_MIN_WIDTH,
        height: SIDEBAR_HEIGHT,
      },
      enable: {
        top: false,
        right: isLeftSidebar,
        bottom: false,
        left: isRightSidebar,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      },
      handleClasses: {
        right: 'group invisible md:visible',
        left: 'group invisible md:visible',
      },
      handleStyles: { right: { right: '-11px' }, left: { left: '-3px' } },
      handleComponent: {
        left: <LeftSideResizeIcon className={resizeTriggerClassName} />,
        right: <RightSideResizeIcon className={resizeTriggerClassName} />,
      },
      onResizeStart: onResizeStart,
      onResizeStop: onResizeStop,
      onResize: onResize,
    };
  }, [
    onResizeStart,
    onResizeStop,
    onResize,
    resizeTriggerClassName,
    isLeftSidebar,
    isRightSidebar,
    SIDEBAR_HEIGHT,
    SIDEBAR_WIDTH,
    maxWidth,
  ]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resizableWrapperClassName = classNames(
    '!fixed z-40 flex max-w-[95%] border-tertiary md:max-w-[45%] xl:!relative xl:top-0 xl:!h-full',
    isLeftSidebar
      ? 'sidebar-left left-0 border-r'
      : 'sidebar-right right-0 border-l',
    isOverlay ? 'top-9 !h-[calc(100%-36px)]' : 'top-12 !h-[calc(100%-48px)]',
  );

  return isOpen ? (
    <Resizable
      ref={sideBarElementRef}
      {...resizeSettings}
      className={resizableWrapperClassName}
      data-qa={dataQa}
    >
      <div className="group/sidebar flex size-full flex-none shrink-0 flex-col divide-y divide-tertiary bg-layer-3 transition-all">
        {areEntitiesUploaded ? (
          <>
            <Search
              placeholder={t('Search {{name}}...', {
                name: trimEnd(
                  EnumMapper.getApiKeyByFeatureType(featureType),
                  's',
                ),
              })}
              searchTerm={searchTerm}
              searchFilters={searchFilters}
              onSearch={handleSearchTerm}
              onSearchFiltersChanged={handleSearchFilters}
              featureType={featureType}
            />

            {actionButtons}

            <div className="flex grow flex-col gap-px divide-y divide-tertiary overflow-y-auto">
              {folderComponent}

              {filteredItems.length > 0 || filteredFolders.length > 0 ? (
                <div
                  ref={dragDropElement}
                  className={classNames(
                    'min-h-min min-w-[42px] grow',
                    isDraggingOver && 'bg-accent-primary-alpha',
                  )}
                  onDrop={(e) => {
                    setIsDraggingOver(false);
                    handleDrop(e);
                  }}
                  onDragOver={allowDrop}
                  onDragEnter={highlightDrop}
                  onDragLeave={removeHighlight}
                  data-qa="draggable-area"
                >
                  {itemComponent}
                </div>
              ) : searchTerm.length ? (
                <div className="flex grow content-center justify-center">
                  <NoResultsFound />
                </div>
              ) : (
                <div className="flex grow content-center justify-center">
                  <NoData />
                </div>
              )}
            </div>
            {footerComponent}
          </>
        ) : (
          <Loader />
        )}
      </div>
    </Resizable>
  ) : null;
};

export default Sidebar;
