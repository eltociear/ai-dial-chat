export enum ExpectedMessages {
  newConversationCreated = 'New conversation is created',
  replayConversationCreated = 'Replay conversation is created',
  conversationNameUpdated = 'Conversation name is updated',
  conversationNameNotUpdated = 'Conversation name is not updated',
  conversationDeleted = 'Conversation is deleted',
  conversationNotDeleted = 'Conversation is not deleted',
  conversationMovedToFolder = 'Conversation is moved to a folder',
  contextMenuOptionsValid = 'Context menu options are valid',
  contextMenuIsNotAvailable = 'Context menu is not available',
  contextMenuOptionIsAvailable = 'Context menu option is available',
  contextMenuOptionIsNotAvailable = 'Context menu option is not available',
  conversationIsVisible = 'Conversation is visible in chat bar',
  conversationIsNotVisible = 'Conversation is not visible in chat bar',
  sendMessageButtonIsNotVisible = 'Send message button is not visible in chat input',
  conversationsCountIsValid = 'Conversations count is valid',
  folderIsNotVisible = 'Folder is not visible in chat bar',
  folderIsVisible = 'Folder is visible',
  newFolderCreated = 'New folder is created',
  folderCollapsed = 'Folder is collapsed',
  folderExpanded = 'Folder is expanded',
  folderCaretIsExpanded = 'Folder caret is visible and expanded',
  folderNameUpdated = 'Folder name is updated',
  folderNameNotUpdated = 'Folder name is not updated',
  folderDeleted = 'Folder is deleted',
  folderNotDeleted = 'Folder is not deleted',
  folderConversationDeleted = 'Conversation inside folder is deleted',
  foldersCountIsValid = 'Folders count is valid',
  defaultTalkToIsValid = 'Default Talk to is GPT-3.5',
  talkToEntityIsSelected = 'Talk to entity is selected',
  defaultAssistantModelIsValid = 'Default Assistant model to is GPT-4',
  assistantModelsValid = 'Assistant models are valid',
  modelSelectorNotVisible = 'Model selector is not visible',
  defaultSystemPromptIsEmpty = 'Default System Prompt is empty',
  systemPromptValid = 'System Prompt is valid',
  systemPromptNotVisible = 'System Prompt is not visible',
  defaultTemperatureIsOne = 'Default Temperature is 1',
  temperatureIsValid = 'Set Temperature is preserved',
  temperatureSliderVisible = 'Temperature slider is visible',
  temperatureSliderNotVisible = 'Temperature slider is not visible',
  noAddonsSelected = 'No addon selected',
  selectedAddonsValid = 'Selected addons valid',
  addonsNotVisible = 'Addons are not visible',
  cannotDeleteSelectedAddon = 'Selected addon cannot be deleted',
  recentAddonsVisible = 'Recent addons are visible',
  recentEntitiesVisible = 'Recent entities are visible',
  recentEntitiesIsOnTop = 'Recent entity is on top of the list',
  systemPromptIsValid = 'Set System Prompt is preserved',
  conversationRenamed = 'Conversation is renamed',
  conversationOfToday = 'Conversation is from Today',
  conversationOfYesterday = 'Conversation is from Yesterday',
  conversationOfLastWeek = 'Conversation is from Last 7 days',
  conversationOfLastMonth = 'Conversation is from Last month',
  newPromptCreated = 'New prompt is created',
  promptDeleted = 'Prompt is deleted',
  promptNotDeleted = 'Prompt is not deleted',
  promptModalClosed = 'Prompt modal dialog is closed',
  promptNotUpdated = 'Prompt is not updated',
  promptNameValid = 'Prompt name is valid',
  promptDescriptionValid = 'Prompt description is valid',
  promptContentValid = 'Prompt content is valid',
  promptVariablePlaceholderValid = 'Prompt variable placeholder is valid',
  promptNameUpdated = 'Prompt name is updated',
  promptDescriptionUpdated = 'Prompt description is updated',
  promptValueUpdated = 'Prompt value is updated',
  promptMovedToFolder = 'Prompt is moved to a folder',
  promptIsVisible = 'Prompt is visible',
  promptIsNotVisible = 'Prompt is not visible',
  noPromptsImported = 'No prompts are imported',
  deleteAllPromptsButtonNotVisible = 'Delete All Prompts button is not visible',
  promptApplied = 'Prompt is applied to the field',
  promptsCountIsValid = 'Prompts count is valid',
  infoAppIsValid = 'More info application is valid',
  infoAppDescriptionIsValid = 'More info application description is valid',
  entityHasDescription = 'Entity has description',
  entityDescriptionIsValid = 'Entity description is valid',
  entityDescriptionHasFullWidth = 'Entity description has full width',
  descriptionLinkIsBlue = 'Description link color is blue',
  descriptionLinkOpened = 'Description link is opened in a new window',
  startReplayVisible = 'Start Replay button is visible',
  startReplayNotVisible = 'Start Replay button is not visible',
  chatRequestIsSent = 'Chat API request is sent',
  chatRequestModelIsValid = 'Chat API request model is valid',
  chatRequestModelAssistantIsValid = 'Chat API request assistant model is valid',
  chatRequestPromptIsValid = 'Chat API request prompt is valid',
  chatRequestTemperatureIsValid = 'Chat API request temperature is valid',
  chatRequestAddonsAreValid = 'Chat API request addons are valid',
  chatRequestMessageIsValid = 'Chat API request message is valid',
  sendMessageButtonDisabled = 'Send message button is disabled',
  sendMessageButtonEnabled = 'Send message button is enabled',
  tooltipContentIsValid = 'Tooltip content is valid',
  headerTitleCorrespondRequest = 'Chat header title correspond sent request',
  headerTitleIsValid = 'Chat header title is valid',
  headerTitleIsFullyVisible = 'Chat header title is fully visible on tooltip',
  headerIconsCountIsValid = 'Chat header icons number is valid',
  headerCleanConversationIconVisible = 'Chat header Clean Conversation icon is visible',
  chatInfoModelIsValid = 'Chat info model is valid',
  chatInfoModelIconIsValid = 'Chat info model icon is valid',
  chatInfoAppIsValid = 'Chat info application is valid',
  chatInfoAppIconIsValid = 'Chat info application icon is valid',
  chatInfoAssistantIsValid = 'Chat info assistant is valid',
  chatInfoAssistantModelIsValid = 'Chat info assistant model is valid',
  chatInfoAssistantModelIconIsValid = 'Chat info assistant model icon is valid',
  chatInfoAssistantIconIsValid = 'Chat info assistant icon is valid',
  chatInfoTemperatureIsValid = 'Chat info temperature is valid',
  chatInfoPromptIsValid = 'Chat info prompt is valid',
  chatInfoAddonIsValid = 'Chat info addon is valid',
  chatInfoAddonIconIsValid = 'Chat info addon icon is valid',
  chatInfoAddonsCountIsValid = 'Chat info addons number is valid',
  proceedReplayIsVisible = 'Proceed replay button is visible',
  replayContinuesFromReceivedContent = 'Replay continued from received content',
  replayRegeneratesStages = 'Replay regenerates all stages',
  allStagesRegenerated = 'All stages are regenerated on Regenerate Response button click',
  errorReceivedOnReplay = 'Error message is received during chat replay',
  compareModeOpened = 'Compare mode is opened',
  compareModeClosed = 'Compare mode is closed',
  conversationToCompareVisible = 'Conversation to compare selector is visible',
  conversationsToCompareOptionsValid = 'Conversation to compare options are valid',
  noConversationsAvailable = 'No conversations are available for comparison',
  responseReceivedForComparedConversations = 'Response is received by both conversations in compare mode',
  requestModeIdIsValid = 'Request modelId is valid in API request',
  requestPromptIsValid = 'Request prompt is valid in API request',
  requestTempIsValid = 'Request temperature is valid in API request',
  requestSelectedAddonsAreValid = 'Request addons are valid in API request',
  requestAssistantModelIdIsValid = 'Request assistant modelId is valid in API request',
  requestCustomContentIsValid = 'Request custom content is valid in API request',
  regenerateNotAvailable = 'Regenerate button is not available',
  regenerateIsAvailable = 'Regenerate button is available',
  stopGeneratingIsNotVisible = 'Stop generating button is not visible',
  iconSizeIsValid = 'Icon size is valid',
  chatBarConversationIconIsDefault = 'Chat bar conversation icon is default',
  chatBarConversationIconIsPlayback = 'Chat bar conversation icon is Playback',
  playbackIconIsSelected = 'Playback icon is selected on Talk to list',
  responseLoadingStopped = 'Conversation response stopped',
  responseIsNotLoading = 'Conversation response not loading',
  responseIsLoading = 'Conversation response is loading',
  onlyLastResponseIsRegenerating = 'Only last chat response is regenerating',
  onlyFirstStageDisplayed = 'Only first stage is displayed in response',
  editRequestModeIsClosed = 'Edit request mode is closed',
  saveIsDisabled = 'Save button is disabled',
  messageCountIsCorrect = 'Chat messages count is correct',
  messageContentIsValid = 'Message content is correct',
  requestMessageIsEdited = 'Request message is edited',
  messageIsDeleted = 'Message is deleted from conversation',
  chatHeaderTitleTruncated = 'Chat header title is truncated',
  conversationSettingsVisible = 'Conversation Settings screen is visible',
  replayAsIsLabelIsVisible = 'Replay As Is label is visible',
  replayAsOptionNotVisible = 'Replay As Is option is not visible',
  entitiesIconsCountIsValid = 'Entities icons number is valid',
  entityIconIsValid = 'Entity icon is valid',
  entityNameIsValid = 'Entity name is valid',
  addonsIconsCountIsValid = 'Addons icons number is valid',
  addonIconIsValid = 'Addon icon is valid',
  draggableAreaColorIsValid = 'Draggable area background color is valid',
  folderNameColorIsValid = 'Folder name color is valid',
  confirmationMessageIsValid = 'Confirmation dialog message is valid',
  chronologyMessageCountIsCorrect = 'Chat bar chronology messages count is correct',
  fieldIsRequired = 'Field is required',
  fieldIsHighlightedWithRed = 'Field is highlighted with red',
  fieldIsHighlightedWithBlue = 'Field is highlighted with blue',
  buttonIsDisabled = 'Button is disabled',
  buttonIsEnabled = 'Button is enabled',
  buttonBackgroundColorIsValid = 'Button background color is valid',
  newPromptButtonIsHighlighted = 'New prompt button is highlighted',
  newPromptButtonCursorIsPointer = 'New prompt button cursor is a pointer',
  playbackControlsHidden = 'PlayBack controls are hidden',
  playbackNextButtonEnabled = 'PlayBack next button is enabled',
  playbackNextButtonDisabled = 'PlayBack next button is disabled',
  playbackPreviousButtonDisabled = 'PlayBack previous button is disabled',
  playbackPreviousButtonEnabled = 'PlayBack previous button is enabled',
  playbackChatMessageIsValid = 'Playback chat message is correct',
  playbackMessageIsInViewport = 'Playback message is in viewport',
  playbackNextMessageIsScrollable = 'Playback next message is scrollable',
  playbackNextMessageIsHidden = 'Playback next message is hidden',
  searchResultCountIsValid = 'Search results count is valid',
  noResultsFound = 'No results found is displayed',
  notAllowedModelErrorDisplayed = 'Not allowed model selected error is displayed',
  replayAsIsDescriptionIsVisible = 'Replay as is description is visible',
  replayOldVersionWarningIsVisible = 'Replay old version of DIAL conversation warning is displayed',
  warningLabelColorIsValid = 'Warning label color is valid',
  compareButtonIsDisabled = 'Chat bar Compare button is disabled',
  closeChatIconIsNotVisible = 'Close chat icon is not visible',
  chatMessageIsRated = 'Chat message was rated',
  entityNameIsTruncated = 'Entity name is truncated',
  folderNameIsTruncated = 'Folder name is truncated in side panel',
  chatNameIsTruncated = 'Chat name is truncated in side panel',
  filenameIsTruncated = 'File name is truncated on modal',
  sendButtonCursorIsNotAllowed = 'Send button cursor is not allowed',
  sharedIconColorIsValid = 'Shared arrow icon color is valid',
  sharedEntityIconIsVisible = 'Shared entity arrow icon is visible',
  sharedEntityIconIsNotVisible = 'Shared entity arrow icon is not visible',
  sharedFolderIconIsNotVisible = 'Shared folder arrow icon is not visible',
  sharedFolderIconIsVisible = 'Shared folder arrow icon is visible',
  sharedModalTextIsValid = 'Shared models dialog text is valid',
  sharedInvitationLinkIsUnique = 'Shared invitation link is unique',
  shareConversationLinkIsValid = 'Share conversation link is valid',
  shareInviteAcceptanceErrorShown = 'Share invite acceptance error toast is shown',
  conversationIsNotShared = 'Conversation is not shared',
  conversationIsShared = 'Conversation is shared',
  folderIsNotShared = 'Folder is not shared',
  folderIsShared = 'Folder is shared',
  promptIsNotShared = 'Prompt is not shared',
  fileIsNotShared = 'File is not shared',
  modalWindowIsClosed = 'Modal window is closed',
  entityNameIsFullyVisible = 'Entity name is fully visible on tooltip',
  shareLinkIsFullyVisible = 'Share link is fully visible on tooltip',
  buttonColorIsValid = 'Button color is valid',
  buttonTextColorIsValid = 'Button text color is valid',
  sideBarPanelWidthIsValid = 'Side bar panel width is valid',
  sideBarPanelIsHidden = 'Side bar panel is hidden',
  dotsMenuIsHidden = 'Three dots menu is hidden',
  dotsMenuIsVisible = 'Three dots menu is visible',
  iconColorIsValid = 'Icon color is valid',
  iconIsHidden = 'Icon is hidden',
  bannerMessageIsValid = 'Announcement banner message is valid',
  bannerWidthIsValid = 'Announcement banner width is valid',
  bannerIsClosed = 'Announcement banner is closed',
  newPageIsOpened = 'New browser page is opened',
  conversationIsSelected = 'Conversation is selected',
  folderIsHighlighted = 'Folder is highlighted',
  entitiesCountIsValid = 'Number of entities returned in API response is valid',
  modelIsAvailable = 'Model is returned in API response',
  addonIsAvailable = 'Addon is returned in API response',
  responseCodeIsValid = 'Response code is valid for model: ',
  responseTextIsValid = 'Response text is valid for model: ',
  imageUrlReturnedInResponse = 'Image url is returned in the response for model: ',
  attachmentUrlIsValid = 'Conversation attachment url is valid',
  attachmentIsSuccessfullyDownloaded = 'Conversation attachment is successfully downloaded',
  attachmentIsExpanded = 'Conversation attachment is expanded',
  attachmentIsCollapsed = 'Conversation attachment is collapsed',
  attachmentNameColorIsValid = 'Attachment name color is valid',
  attachmentHasErrorIcon = 'Attachment has error icon',
  plotlyAttachmentIsVisible = 'Plotly attachment is visible',
  attachmentLinkIsValid = 'Attachment link is valid',
  folderUrlIsValid = 'Folder url is valid',
  conversationUrlIsValid = 'Conversation url is valid',
  sharedResourcesCountIsValid = 'Shared resources count is valid',
  dataIsNotExported = 'Data is not exported',
  dataIsExported = 'Data is exported',
  dataIsNotImported = 'Data is not imported',
  stageIsVisibleInResponse = 'Stage is visible in message response',
  codeIsVisibleInResponse = 'Code is visible in message response',
  duplicateButtonIsNotVisible = 'Duplicate button is not visible',
  notAllowedNameErrorShown = 'Not allowed name error toast is shown',
  charactersAreNotDisplayed = 'Characters are not displayed',
  errorToastIsShown = 'Error toast is shown',
  noErrorToastIsShown = 'No error toast is shown',
  scrollDownButtonIsNotVisible = 'Scroll down button is not visible',
  scrollDownButtonIsVisible = 'Scroll down button is visible',
  scrollPositionIsCorrect = 'Scroll position is correct',
  elementPositionIsCorrect = 'Element position is correct',
  clipIconNotAvailable = 'Clip icon is not available for the model',
  clipIconIsAvailable = 'Clip icon is available for the model',
  attachmentLoadingIndicatorNotVisible = 'Attachment loading indicator is not visible',
  attachmentLoadingIndicatorIsVisible = 'Attachment loading indicator is visible',
  attachmentNameIsTruncated = 'Attachment name is truncated',
  attachmentNameIsFullyVisible = 'Attachment name is fully visible',
  attachmentFileIsChecked = 'Attachment file is checked',
  fileIsAttached = 'File is attached to message box',
  fileIsNotHighlighted = 'File is not highlighted',
  fileIsNotAttached = 'File is removed from message box',
  attachedFilesCountIsValid = 'Attached files count is valid',
  removeAttachmentIconIsHighlighted = 'Remove attachment icon is highlighted',
  attachmentsAreGrouped = 'Attachments are grouped',
  attachmentIsVisible = 'Attachment is visible',
  attachmentIsHidden = 'Attachment is hidden',
  attachFilesModalIsOpened = 'Attach files modal dialog is opened',
  supportedTypesLabelIsCorrect = 'Supported types label is valid',
  fileIsUploaded = 'File is uploaded',
  fileIsNotUploaded = 'File is not uploaded',
  filesCountIsValid = 'Files count is valid',
  fileExtensionIsValid = 'File extension is valid',
  elementAttributeValueIsValid = 'Element attribute value is valid',
  uploadedFilesAreaIsScrollable = 'Uploaded files area is scrollable vertically',
  fieldIsInFocus = 'Field is in focus',
  errorMessageIsShown = 'Error message is shown',
  errorTextColorIsValid = 'Error text color is valid',
  errorMessageContentIsValid = 'Error message content is valid',
  folderEditModeIsActive = 'Folder edit mode is active',
  folderEditModeIsClosed = 'Folder edit mode is closed',
  folderBackgroundColorIsValid = 'Folder background color is valid',
  folderTextColorIsValid = 'Folder text color is valid',
  selectFolderAreaIsScrollable = 'Select folder area is scrollable vertically',
  borderColorsAreValid = 'Element border colors are valid',
  uploadToPathIsValid = 'Upload to path is valid',
  uploadToPathIsTruncated = 'Upload to path is truncated',
  folderCheckboxIsNotVisible = 'Folder check-box is not visible',
  stopPlaybackButtonNotVisible = '"Stop playback" button is not visible',
  tableIsVisible = 'Table is visible in chat message',
  tableControlIconsNotVisible = 'Table control icons are not visible',
  tableCopyAsCsvIconIsVisible = 'Table Copy As Csv icon is available',
  tableCopyAsTxtIconIsVisible = 'Table Copy As Txt icon is available',
  tableCopyAsMdIconIsVisible = 'Table Copy As MD icon is available',
  tableColumnsCountIsValid = 'Table columns count is valid',
  tableRowsCountIsValid = 'Table rows count is valid',
  tableEntityBackgroundColorIsValid = 'Table entity background color is valid',
  tableControlTooltipIsVisible = 'Table control tooltip is visible',
  copiedContentIsValid = 'Copied content is valid',
  applicationThemeIsValid = 'Application theme is valid',
  folderIsChecked = 'Folder is checked',
  folderContentIsPartiallyChecked = 'Folder content is partially checked',
  entityIsChecked = 'Entity is checked',
  folderIsNotChecked = 'Folder is not checked',
  entityIsNotChecked = 'Entity is not checked',
  folderEntityBackgroundColorIsValid = 'Folder entity background color is valid',
  buttonIsVisible = 'Button is visible',
  buttonIsNotVisible = 'Button is not visible',
  folderEntityIsNotVisible = 'Folder entity is not visible',
  folderEntityIsVisible = 'Folder entity is visible',
  entityIsNotVisible = 'Entity is not visible',
  entityIsVisible = 'Entity is visible',
  entityBackgroundColorIsValid = 'Entity background color is valid',
}
