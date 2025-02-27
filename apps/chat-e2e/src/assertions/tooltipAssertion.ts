import { ExpectedMessages } from '@/src/testData';
import { Tooltip } from '@/src/ui/webElements/tooltip';
import { expect } from '@playwright/test';

export class TooltipAssertion {
  readonly tooltip: Tooltip;

  constructor(tooltip: Tooltip) {
    this.tooltip = tooltip;
  }

  public async assertTooltipContent(expectedContent: string) {
    expect
      .soft(
        await this.tooltip.getContent(),
        ExpectedMessages.tooltipContentIsValid,
      )
      .toBe(expectedContent);
  }
}
