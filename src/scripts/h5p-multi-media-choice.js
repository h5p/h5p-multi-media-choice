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
          questionType: 'auto',
          confirmCheckDialog: false,
          confirmRetryDialog: false,
          aspectRatio: 'auto',
          sameAspectRatio: false
        },
        l10n: {
          checkAnswerButtonText: 'Check',
          checkAnswer: 'Check the answers. The responses will be marked as correct, incorrect, or unanswered.',
          showSolutionButtonText: 'Show solution',
          showSolution: 'Show the solution. The task will be marked with its correct solution.',
          retryText: 'Retry',
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
    this.getMaxScore = () => {
      if (this.params.behaviour.singlePoint || this.content.isSingleAnswer()) {
        return 1;
      } else {
        return this.params.options.filter((option) => option.correct).length;
      }
    };

    /**
     * Show solutions.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      this.hideButton('check-answer');
      this.hideButton('show-solution');

      this.content.showSolutions();

      this.trigger('resize');
    };

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
      this.params.l10n.checkAnswerButtonText,
      () => {
        this.checkAnswer();
      },
      true,
      { 'aria-label': this.params.l10n.checkAnswer },
      {}
    );
    this.addButton(
      'show-solution',
      this.params.l10n.showSolutionButtonText,
      () => {
        this.showSolutions();
      },
      false,
      { 'aria-label': this.params.l10n.showSolution },
      {}
    );

    this.addButton(
      'try-again',
      this.params.l10n.retryText,
      () => {
        this.resetTask();
      },
      false,
      { 'aria-label': this.params.l10n.retry },
      {}
    );
  }

  /**
   * Check answer.
   */
  checkAnswer() {
    this.hideButton('check-answer');
    this.content.disableSelectables();

    const score = this.getScore();
    const maxScore = this.getMaxScore();
    const textScore = H5P.Question.determineOverallFeedback(this.params.overallFeedback, score / maxScore);
    const ariaMessage = this.params.l10n.result.replace('@score', score).replace('@total', maxScore);
    this.setFeedback(textScore, score, maxScore, ariaMessage);

    if (this.params.behaviour.enableSolutionsButton) {
      this.showButton('show-solution');
    }

    if (this.params.behaviour.enableRetry) {
      this.showButton('try-again');
    }
  }

  /**
   * Resets the options, score and the buttons hidden by showSolutions()
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.content.resetSelections();
    this.showButton('check-answer');
    this.hideButton('try-again');
    this.hideButton('show-solution');
    this.hideSolutions();
    this.resetScore();
    this.removeFeedback();
  }

  /**
   * Resets the score and hides the score text
   */
  resetScore() {
    //TODO: Add this when scoring has been implemented
  }

  /**
   * Hide the solutions
   */
  hideSolutions() {
    //TODO: Add when solutions has been implemented
  }
}
