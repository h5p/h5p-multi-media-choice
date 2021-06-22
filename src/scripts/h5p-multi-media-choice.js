import MultiMediaChoiceContent from './h5p-multi-media-choice-content';

import deepExtend from './h5p-multi-media-choice-util';

/**
 * Class for H5P Multi Media Choice.
 */
export default class MultiMediaChoice extends H5P.Question {
  /**
   * @constructor
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('multi-media-choice');

    this.contentId = contentId;
    this.extras = extras;

    // Default values are extended
    this.params = deepExtend(
      {
        question: null,
        behaviour: {
          enableSolutionsButton: true,
          enableRetry: true,
          type: 'auto',
          confirmCheckDialog: false,
          confirmRetryDialog: false,
        },
        l10n: {
          checkText: 'Check',
          check: 'Check the answers. The responses will be marked as correct, incorrect, or unanswered.',
          showSolution: 'Show the solution. The task will be marked with its correct solution.',
          retry: 'Retry the task. Reset all responses and start the task over again.',
          result: 'You got @score out of @total points',
        },
      },
      params
    );

    /**
     * Get score.
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => 1; //TODO: Placeholder

    /**
     * Get maximum possible score.
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => 2; //TODO: Placeholder

    this.registerDomElements = () => {
      // Register task introduction text
      if (this.params.question) {
        this.introduction = document.createElement('div');
        this.introduction.innerHTML = this.params.question;
        this.setIntroduction(this.introduction);
      }

      this.content = new MultiMediaChoiceContent(params, contentId, {});

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());

      this.addButtons();

      this.trigger('resize');
    };
  }

  /**
   * Add the buttons that are passed to H5P.Question
   */
  addButtons() {
    this.addButton(
      'check-answer',
      this.params.l10n.checkText,
      () => {
        this.checkAnswer();
      },
      true,
      { 'aria-label': this.params.l10n.check },
      {}
    );
  }

  /**
   * Check answer.
   */
  checkAnswer() {
    this.hideButton('check-answer');
    const score = this.getScore();
    const maxScore = this.getMaxScore();
    const textScore = H5P.Question.determineOverallFeedback(this.params.overallFeedback, score / maxScore);
    const ariaMessage = this.params.l10n.result.replace('@score', score).replace('@total', maxScore);
    this.setFeedback(textScore, score, maxScore, ariaMessage);
  }
}
