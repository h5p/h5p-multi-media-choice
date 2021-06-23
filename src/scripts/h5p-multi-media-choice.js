import MultiMediaChoiceContent from './h5p-multi-media-choice-content';

import { Util } from './h5p-multi-media-choice-util';

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
        this.setIntroduction(this.introduction);
      }

      this.content = new MultiMediaChoiceContent(params, contentId, {
        triggerResize: () => {
          this.trigger('resize');
        },
      });

      this.setContent(this.content.getDOM()); // Register content with H5P.Question
      this.addButtons();
    };

    /**
     * Check if result has been submitted or input has been given.
     * @return {boolean} True if answer was given
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswersGiven = () => {
      return this.content.isAnswerSelected() || this.content.blankIsCorrect();
    };

    /**
     * Get score.
     * @return {number} latest score.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => {
      // One point if no correct options and no selected options
      if (!this.content.isAnswerSelected()) {
        return this.content.blankIsCorrect() ? 1 : 0;
      }

      // Radio buttons, only one answer
      if (this.content.isSingleAnswer()) {
        return this.isCorrect(this.content.getSelected()[0]) ? 1 : 0;
      }
      // Checkbox buttons, one point if correctly answered
      else if (this.params.behaviour.singlePoint) {
        const selectedIndexes = this.content.getSelectedIndexes();
        for (let i = 0; i < this.params.options.length; i++) {
          if ((this.params.options[i].correct) == (selectedIndexes.indexOf(i) == -1)) {
            return 0;
          }
        }
        return 1;
      }
      // Checkbox buttons. 1 point for correct answer, -1 point for incorrect answer
      else {
        // const selectedIndexes = this.content.getSelectedIndexes();
        let score = 0;
        for (let i = 0; i < this.content.selectables.length; i++) {
          if (this.isCorrect(this.content.selectables[i])) {
            score ++;
          }
          else if (this.isIncorrect(this.content.selectables[i])) {
            score --;
          }
        }
        return score < 0 ? 0 : score;
      }
      //this.content.params.options.forEach(() => {}
    };

    /**
     * Get maximum possible score.
     * @return {number} Score necessary for mastering.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */
    this.getMaxScore = () => {
      if (this.params.behaviour.singlePoint || this.content.isSingleAnswer()) {
        return 1;
      }
      else if (this.content.getNumberOfCorrectOptions() === 0) {
        return 1;
      }
      else {
        return this.content.getNumberOfCorrectOptions();
      }
    };

    /**
     * @param {object} selectable Selectable object
     * @returns {boolean} True if option is selected and correct
     */
    this.isCorrect = selectable => {
      const selectedIndex = this.content.getSelectedIndex(selectable);
      if (this.content.getSelected().includes(selectable) && this.params.options[selectedIndex].correct) {
        return true;
      }
      return false;
    };

    /**
     * @param {object} selectable Selctable object
     * @returns {boolean} True if option is selected and incorrect
     */
    this.isIncorrect = selectable => {
      const selectedIndex = this.content.getSelectedIndex(selectable);
      if (this.content.getSelected().includes(selectable) && !this.params.options[selectedIndex].correct) {
        return true;
      }
      return false;
    };

    /**
     * Let H5P.Question read the specified text.
     * @param {string} text Text to read.
     */
    this.handleRead = (text) => {
      this.read(text);
    };

    /**
     * Show solutions.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = () => {
      this.hideButton('check-answer');
      this.hideButton('show-solution');

      if (this.params.behaviour.showSolutionsRequiresInput && !this.content.isAnswerSelected()) {
        // Require answer before solution can be viewed
        this.updateFeedbackContent(this.params.l10n.noAnswer);
        this.handleRead(this.params.l10n.noAnswer);
      }
      else {
        this.content.showSolutions();
      }

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
