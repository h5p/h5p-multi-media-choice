import MultiMediaChoiceContent from './h5p-multi-media-choice-content';

import { Util } from './h5p-multi-media-choice-util';
import { XAPIHandler } from './h5p-multi-mediachoice-xapi';

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
    this.params = Util.extendParams(params);

    this.registerDomElements = () => {
      // Register task introduction text
      if (this.params.question) {
        this.introduction = document.createElement('div');
        this.introduction.innerHTML = this.params.question;
        this.introduction.setAttribute('id', `h5p-mmc${contentId}`);
        this.setIntroduction(this.introduction);
      }

      this.content = new MultiMediaChoiceContent(params, contentId, {
        triggerResize: () => {
          this.trigger('resize');
        },
        triggerInteracted: () => {
          this.triggerXAPI('interacted');
        }
      });

      this.xAPIHandler = new XAPIHandler(this.params, this, this.content, this.introduction.innerText);

      this.setContent(this.content.getDOM()); // Register content with H5P.Question
      this.addButtons();
    };

    /**
     * Check if result has been submitted or input has been given.
     * @return {boolean} True if answer was given
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswersGiven = () => {
      return (
        this.content.isAnyAnswerSelected() || this.content.isBlankCorrect()
      );
    };

    this.getScore = () => {
      return this.content.getScore();
    };

    /**
     * Get maximum possible score.
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => {
      if (this.params.behaviour.singlePoint || this.content.isRadioButtons()) {
        return 1;
      }
      else if (this.content.isBlankCorrect() === 0) {
        return 1;
      }
      else {
        return this.content.getNumberOfCorrectOptions();
      }
    };

    /**
     * Let H5P.Question read the specified text.
     * @param {string} text Text to read.
     */
    this.handleRead = text => {
      this.read(text);
    };

    /**
     * Check answer.
     */
    this.checkAnswer = () => {
      this.hideButton('check-answer');
      this.content.disableSelectables();

      const score = this.getScore();
      const maxScore = this.getMaxScore();
      const textScore = H5P.Question.determineOverallFeedback(
        this.params.overallFeedback,
        score / maxScore
      );
      const selectedOptions = this.content
        .getOptions()
        .filter(options => options.isSelected());

      this.setFeedback(textScore, score, maxScore, this.params.l10n.result);

      if (this.params.behaviour.enableSolutionsButton && score !== maxScore) {
        this.showButton('show-solution');
      }

      if (this.params.behaviour.enableRetry && score !== maxScore) {
        this.showButton('try-again');
      }

      selectedOptions.forEach(option => {
        option.showSolution();
      });

      this.trigger(this.xAPIHandler.getAnsweredXAPIEvent());
    };

    /**
     * Show solutions.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      this.hideButton('check-answer');
      this.hideButton('show-solution');

      if (
        this.params.behaviour.showSolutionsRequiresInput &&
        !this.content.isAnyAnswerSelected()
      ) {
        // Require answer before solution can be viewed
        this.updateFeedbackContent(this.params.l10n.noAnswer);
        this.handleRead(this.params.l10n.noAnswer);
      }
      else {
        this.content.showSolutions();
      }

      this.trigger('resize');
    };

    /**
     * Resets options, buttons and solutions
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.content.resetSelections();
      this.showButton('check-answer');
      this.hideButton('try-again');
      this.hideButton('show-solution');
      this.content.hideSolutions();
      this.removeFeedback();
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
      {
        confirmationDialog: {
          enable: this.params.behaviour.confirmCheckDialog,
          l10n: this.params.l10n.confirmCheck,
          instance: this,
        },
      }
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
      {
        confirmationDialog: {
          enable: this.params.behaviour.confirmRetryDialog,
          l10n: this.params.l10n.confirmRetry,
          instance: this,
        },
      }
    );
  }

  /**
   * Packs the current state of the users interactivity into a
   * serializable object.
   *
   * @public
   */
  getCurrentState() {
    return this.xAPIHandler.getCurrentState();
  }

  /**
   * Retrieves the xAPI data necessary for generating result reports
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return this.xAPIHandler.getXAPIData();
  }
}
