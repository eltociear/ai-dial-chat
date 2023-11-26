import {
  IconDots,
  IconFolderPlus,
  IconPencilMinus,
  IconTrashX,
} from '@tabler/icons-react';
import { MouseEventHandler, useMemo } from 'react';

import { HighlightColor } from '@/src/types/common';
import { DisplayMenuItemProps } from '@/src/types/menu';

import BaseContextMenu from './BaseContextMenu';

interface FolderContextMenuProps {
  onDelete?: MouseEventHandler<unknown>;
  onRename?: MouseEventHandler<unknown>;
  onAddFolder?: MouseEventHandler;
  highlightColor: HighlightColor;
}
export const FolderContextMenu = ({
  onDelete,
  onRename,
  onAddFolder,
  highlightColor,
}: FolderContextMenuProps) => {
  const menuItems: DisplayMenuItemProps[] = useMemo(
    () => [
      {
        name: 'Rename',
        display: !!onRename,
        dataQa: 'rename',
        Icon: IconPencilMinus,
        onClick: onRename,
      },
      {
        name: 'Delete',
        display: !!onDelete,
        dataQa: 'rename',
        Icon: IconTrashX,
        onClick: onDelete,
      },
      {
        name: 'Add new folder',
        display: !!onAddFolder,
        dataQa: 'rename',
        Icon: IconFolderPlus,
        onClick: onAddFolder,
      },
    ],
    [onRename, onDelete, onAddFolder],
  );

  if (!onDelete && !onRename && !onAddFolder) {
    return null;
  }

  return (
    <BaseContextMenu
      menuItems={menuItems}
      ContextMenuIcon={IconDots}
      contextMenuIconSize={16}
      translation="sidebar"
      highlightColor={highlightColor}
      className="m-0 justify-self-end p-0"
    />
  );
};
