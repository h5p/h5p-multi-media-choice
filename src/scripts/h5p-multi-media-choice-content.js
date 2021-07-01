import { MultiMediaChoiceOption } from './h5p-multi-media-choice-option';

/** Class representing the content */
export default class MultiMediaChoiceContent {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {number} contentId Content's id.
   * @param {object} [callbacks = {}] Callbacks.
   * @param {string} assetsFilePath File path to the assets folder
   */
  constructor(params = {}, contentId, callbacks = {}, assetsFilePath) {
    this.params = params;
    this.contentId = contentId;
    this.callbacks = callbacks;
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});
    this.callbacks.triggerInteracted = this.callbacks.triggerInteracted || (() => {});
    this.assetsFilePath = assetsFilePath;

    this.numberOfCorrectOptions = params.options.filter(option => option.correct).length;

    this.isSingleAnswer =
      this.params.behaviour.questionType === 'auto'
        ? this.numberOfCorrectOptions === 1
        : this.params.behaviour.questionType === 'single';

    this.aspectRatio = this.params.behaviour.aspectRatio;

    this.lastSelectedRadioButtonOption = null;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-content');

    // Calculate max alternatives per row
    this.maxAlternativesPerRow = 5; // Default value
    if (this.params.behaviour.maxAlternativesPerRow) {
      this.maxAlternativesPerRow = this.params.behaviour.maxAlternativesPerRow;
    }
    // Max alternatives per row should not be greater than the number of alternatives
    this.maxAlternativesPerRow = Math.min(this.params.options.length, this.maxAlternativesPerRow);

    // Build n options
    this.options = params.options.map(
      (option, index) =>
        new MultiMediaChoiceOption(
          option,
          contentId,
          this.aspectRatio,
          this.isSingleAnswer,
          assetsFilePath,
          {
            onClick: () => this.toggleSelected(index),
            onKeyboardSelect: () => this.toggleSelected(index),
            onKeyboardArrowKey: (optionObj, direction) =>
              this.handleOptionArrowKey(optionObj, index, direction),
            triggerResize: this.callbacks.triggerResize,
          }
        )
    );

    this.content.appendChild(this.buildOptionList(this.options));
  }

  /**
   * Build options.
   * @param {object[]} options List of option objects.
   * @return {HTMLElement} List view of options.
   */
  buildOptionList() {
    const optionList = document.createElement('ul');
    optionList.setAttribute('role', this.isSingleAnswer ? 'radiogroup' : 'group');
    optionList.setAttribute('aria-labelledby', `h5p-mmc${this.contentId}`);
    optionList.classList.add('h5p-multi-media-choice-option-list');
    optionList.style.columnCount = this.maxAlternativesPerRow;

    this.options.forEach(option => {
      optionList.appendChild(option.getDOM());
    });
    return optionList;
  }

  /**
   * Return the DOM for this class
   * @return {HTMLElement} DOM for this class
   */
  getDOM() {
    return this.content;
  }

  /**
   * Return a list of the displayed options
   * @returns {MultiMediaChoiceOption[]} An array of HTML options
   */
  getOptions() {
    return this.options;
  }

  /**
   * Get maximum possible score.
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    if (this.params.behaviour.singlePoint || this.isSingleAnswer) {
      return 1;
    }
    else if (this.isBlankCorrect()) {
      return 1;
    }
    else {
      return this.numberOfCorrectOptions;
    }
  }

  /**
   * Get score
   * @return {number} score based on the behaviour settings
   */
  getScore() {
    // One point if no correct options and no selected options
    const self = this;
    if (!self.isAnyAnswerSelected()) {
      return self.isBlankCorrect() ? 1 : 0;
    }

    // Radio buttons, only one answer
    if (self.isSingleAnswer) {
      return self.lastSelectedRadioButtonOption.isCorrect() ? 1 : 0;
    }

    // Checkbox buttons. 1 point for correct answer, -1 point for incorrect answer
    let score = 0;
    this.options.forEach(option => {
      if (option.isSelected()) {
        option.isCorrect() ? score++ : score--;
      }
    });

    /**
     * Checkbox buttons with single point.
     * One point if (score / number of correct options) is above pass percentage
     */
    if (self.params.behaviour.singlePoint) {
      return (score * 100) / this.numberOfCorrectOptions >= this.params.behaviour.passPercentage
        ? 1
        : 0;
    }

    return Math.max(0, score); // Negative score not allowed
  }

  /**
   * Returns the indexes of the selected options
   * @returns {Number[]} Array of indexes of selected options
   */
  getSelectedIndexes() {
    return this.getSelectedOptions().map(option => this.options.indexOf(option));
  }

  /**
   * Returns the selected options
   * @returns {Object[]} Array of selected options
   */
  getSelectedOptions() {
    return this.options.filter(option => option.isSelected());
  }

  /**
   * Checks if any answer is selected
   * @returns {boolean} True if any answer is selected
   */
  isAnyAnswerSelected() {
    return this.getSelectedOptions().length > 0;
  }

  /**
   * Checks if there are no correct answers
   * @returns {boolean} True if there are no correct answers
   */
  isBlankCorrect() {
    return this.numberOfCorrectOptions === 0;
  }

  /**
   * Checks if the score is above the pass percentage
   * @returns {boolean} True if score is above the pass percentage
   */
  isPassed() {
    return (this.getScore() * 100) / this.getMaxScore() >= this.params.behaviour.passPercentage;
  }

  /**
   * Show which selected options are right and which are wrong
   */
  showSelectedSolutions() {
    this.disableSelectables();
    this.options.forEach(option => option.showSelectedSolution());
  }

  /**
   * Show which unselected options were right
   */
  showUnselectedSolutions() {
    this.options.forEach(option => option.showUnselectedSolution());
  }

  /**
   * Hide the solution(s) cues
   */
  hideSolutions() {
    this.options.forEach(option => option.hideSolution());
  }

  /**
   * Toggles the given option. If the options are radio buttons
   * the previously checked one is unchecked
   * @param {number} optionIndex Which option is being selected
   */
  toggleSelected(optionIndex) {
    const option = this.options[optionIndex];
    if (option.isDisabled()) {
      return;
    }
    if (this.isSingleAnswer) {
      if (option.isSelected()) {
        return; // Disables unchecking radio buttons
      }
      if (this.lastSelectedRadioButtonOption) {
        this.lastSelectedRadioButtonOption.uncheck();
      }
      this.lastSelectedRadioButtonOption = option;
    }
    option.toggle();

    this.callbacks.triggerInteracted();
  }

  /**
   * Resets all selected options
   */
  resetSelections() {
    this.lastSelectedRadioButtonOption = null;
    this.options.forEach(option => {
      option.uncheck();
      option.enable();
    });
  }

  /**
   * Disables all selectables (radio buttons / checkboxes)
   */
  disableSelectables() {
    this.options.forEach(option => option.disable());
  }

  handleOptionArrowKey(option, index, direction) {
    if (
      (index === 0 && (direction === 'Left' || direction === 'Up')) ||
      (index === this.options.length - 1 && (direction === 'Right' || direction === 'Down')) ||
      !['Left', 'Right', 'Up', 'Down'].includes(direction)
    ) {
      return; // Invalid move or invalid direction
    }

    if (direction === 'Left' || direction === 'Up') {
      this.options[index - 1].focus();
    }
    else if (direction === 'Right' || direction === 'Down') {
      this.options[index + 1].focus();
    }
  }
}
