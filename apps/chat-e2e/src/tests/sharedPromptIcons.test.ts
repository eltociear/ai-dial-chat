import { Prompt } from '@/chat/types/prompt';
import dialTest from '@/src/core/dialFixtures';
import { ExpectedMessages, MenuOptions } from '@/src/testData';
import { Colors } from '@/src/ui/domData';
import { keys } from '@/src/ui/keyboard';
import { GeneratorUtil } from '@/src/utils';
import { expect } from '@playwright/test';

dialTest.skip(
  'Shared icon appears in prompt icon if to click on copy icon.\n' +
    'Shared icon does not appear in prompt icon if to close the pop-up on X button.\n' +
    'Shared icon does not appear in prompt icon if to close the pop-up on click out of it.\n' +
    'Share icon appears in prompt icon only once if to click on copy several times',
  async ({
    dialHomePage,
    promptData,
    prompts,
    dataInjector,
    promptBar,
    promptDropdownMenu,
    shareModal,
    setTestIds,
  }) => {
    setTestIds('EPMRTC-1517', 'EPMRTC-1520', 'EPMRTC-1521', 'EPMRTC-1523');
    let prompt: Prompt;
    await dialTest.step('Prepare a new prompt', async () => {
      prompt = promptData.prepareDefaultPrompt();
      await dataInjector.createPrompts([prompt]);
    });

    await dialTest.step(
      'Open prompt dropdown menu and choose "Share" option',
      async () => {
        await dialHomePage.openHomePage();
        await dialHomePage.waitForPageLoaded({
          isNewConversationVisible: true,
        });
        await prompts.openEntityDropdownMenu(prompt.name);
        await promptDropdownMenu.selectMenuOption(MenuOptions.share);
      },
    );

    await dialTest.step(
      'Click on "Cancel" button in modal window and verify no shared icon appears on prompt icon',
      async () => {
        await shareModal.closeButton.click();
        await expect
          .soft(
            prompts.getEntityArrowIcon(prompt.name),
            ExpectedMessages.promptIsNotShared,
          )
          .toBeHidden();
      },
    );

    await dialTest.step(
      'Open Share modal again, click outside modal window area and verify no shared icon appears on prompt icon',
      async () => {
        await prompts.openEntityDropdownMenu(prompt.name);
        await promptDropdownMenu.selectMenuOption(MenuOptions.share);
        // eslint-disable-next-line playwright/no-force-option
        await promptBar.draggableArea.click({ force: true });
        await expect
          .soft(
            shareModal.getElementLocator(),
            ExpectedMessages.modalWindowIsClosed,
          )
          .toBeHidden();

        await expect
          .soft(
            prompts.getEntityArrowIcon(prompt.name),
            ExpectedMessages.promptIsNotShared,
          )
          .toBeHidden();
      },
    );

    await dialTest.step(
      'Open Share modal again, click on "Copy" button in modal window, close it and purple shared icon appears on prompt icon',
      async () => {
        await prompts.openEntityDropdownMenu(prompt.name);
        await promptDropdownMenu.selectMenuOption(MenuOptions.share);
        await shareModal.copyLinkButton.click();
        await shareModal.closeButton.click();
        await expect
          .soft(
            prompts.getEntityArrowIcon(prompt.name),
            ExpectedMessages.sharedEntityIconIsVisible,
          )
          .toBeVisible();

        const arrowIconColor = await prompts.getEntityArrowIconColor(
          prompt.name,
        );
        expect
          .soft(arrowIconColor[0], ExpectedMessages.sharedIconColorIsValid)
          .toBe(Colors.textSecondary);
      },
    );

    await dialTest.step(
      'Open Share modal again, click on "Copy" button in modal window and verify only one purple shared icon is shown on prompt icon',
      async () => {
        await prompts.openEntityDropdownMenu(prompt.name);
        await promptDropdownMenu.selectMenuOption(MenuOptions.share);
        await shareModal.copyLinkButton.click();
        await shareModal.closeButton.click();
        const arrowIconsCount = await prompts
          .getEntityArrowIcon(prompt.name)
          .count();
        expect
          .soft(arrowIconsCount, ExpectedMessages.entitiesIconsCountIsValid)
          .toBe(1);
      },
    );
  },
);

dialTest.skip(
  'Shared icon appears in prompt icon if to copy using Ctrl+A, Ctrl+C.\n' +
    'Shared icon stays in prompt icon if to update the prompt.\n',
  async ({
    dialHomePage,
    prompts,
    promptDropdownMenu,
    shareModal,
    page,
    promptData,
    dataInjector,
    promptModalDialog,
    setTestIds,
  }) => {
    setTestIds('EPMRTC-1518', 'EPMRTC-1524');
    let prompt: Prompt;
    await dialTest.step('Prepare a new prompt', async () => {
      prompt = promptData.prepareDefaultPrompt();
      await dataInjector.createPrompts([prompt]);
    });

    await dialTest.step(
      'Open prompt dropdown menu and choose "Share" option',
      async () => {
        await dialHomePage.openHomePage();
        await dialHomePage.waitForPageLoaded();
        await prompts.openEntityDropdownMenu(prompt.name);
        await promptDropdownMenu.selectMenuOption(MenuOptions.share);
      },
    );

    await dialTest.step(
      'Set cursor in URL input and press Ctrl+A/Ctrl+C',
      async () => {
        await shareModal.shareLinkInput.click();
        await page.keyboard.press(keys.ctrlPlusA);
        await page.keyboard.press(keys.ctrlPlusC);
      },
    );

    await dialTest.step(
      'Close modal window and verify purple shared icon appears on prompt icon',
      async () => {
        await shareModal.closeButton.click();
        await expect
          .soft(
            prompts.getEntityArrowIcon(prompt.name),
            ExpectedMessages.sharedEntityIconIsVisible,
          )
          .toBeVisible();

        const arrowIconColor = await prompts.getEntityArrowIconColor(
          prompt.name,
        );
        expect
          .soft(arrowIconColor[0], ExpectedMessages.sharedIconColorIsValid)
          .toBe(Colors.textSecondary);
      },
    );

    await dialTest.step(
      'Update prompt details and verify shared icon stays on prompt icon',
      async () => {
        const newName = GeneratorUtil.randomString(10);
        await prompts.openEntityDropdownMenu(prompt.name);
        await promptDropdownMenu.selectMenuOption(MenuOptions.edit);
        await promptModalDialog.updatePromptDetailsWithButton(
          newName,
          GeneratorUtil.randomString(20),
          GeneratorUtil.randomString(20),
        );
        await expect
          .soft(
            prompts.getEntityArrowIcon(newName),
            ExpectedMessages.sharedEntityIconIsVisible,
          )
          .toBeVisible();

        const arrowIconColor = await prompts.getEntityArrowIconColor(newName);
        expect
          .soft(arrowIconColor[0], ExpectedMessages.sharedIconColorIsValid)
          .toBe(Colors.textSecondary);
      },
    );
  },
);
