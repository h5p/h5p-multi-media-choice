import { MultiMediaChoiceOption } from './h5p-multi-media-choice-option';

/** Class representing the content */
export default class MultiMediaChoiceContent {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {number} contentId Content's id.
   * @param {object} [callbacks = {}] Callbacks.
   */
  constructor(params = {}, contentId, callbacks = {}) {
    this.params = params;
    this.contentId = contentId;
    this.callbacks = callbacks;
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});
    this.callbacks.triggerInteracted =
      this.callbacks.triggerInteracted || (() => {});

    this.numberOfCorrectOptions = params.options.filter(
      option => option.correct
    ).length;

    this.isSingleAnswer =
      this.params.behaviour.questionType === 'auto'
        ? this.numberOfCorrectOptions === 1
        : this.params.behaviour.questionType === 'single';

    this.aspectRatio = this.params.behaviour.sameAspectRatio
      ? this.params.behaviour.aspectRatio
      : '';

    this.lastSelected = null;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-content');

    // Build n options
    this.options = params.options.map(
      (option, index) =>
        new MultiMediaChoiceOption(
          option,
          contentId,
          this.aspectRatio,
          Math.min(this.params.behaviour.maxAlternativesPerRow, this.params.options.length),
          this.isSingleAnswer,
          {
            onClick: () => this.toggleSelected(index),
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
    optionList.setAttribute(
      'role',
      this.isSingleAnswer ? 'radiogroup' : 'group'
    );
    optionList.setAttribute('aria-labelledby', `h5p-mmc${this.contentId}`);
    optionList.classList.add('h5p-multi-media-choice-options');
    this.options.forEach(option => {
      if (option.isValid) {
        optionList.appendChild(option.getDOM());
      }
    });
    return optionList;
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
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
      return self.lastSelected.isCorrect() ? 1 : 0;
    }

    // Checkbox buttons, one point if correctly answered
    else if (self.params.behaviour.singlePoint) {
      let score = 1;
      self.options.forEach(option => {
        if (option.isCorrect() && !option.isSelected()) {
          score = 0;
        }
        else if (!option.isCorrect() && option.isSelected()) {
          score = 0;
        }
      });
      return score;
    }

    // Checkbox buttons. 1 point for correct answer, -1 point for incorrect answer
    let score = 0;
    self.options.forEach(option => {
      if (option.isSelected()) {
        option.isCorrect() ? score++ : score--;
      }
    });

    return Math.max(0, score); // Negative score not allowed;
  }

  /**
   * Returns the indexes of the selected options
   * @returns {Number[]} Array of indexes of selected options
   */
  getSelectedIndexes() {
    return this.getSelectedOptions().map(option =>
      this.options.indexOf(option)
    );
  }

  /**
   * Returns the selected objects
   * @returns {Object[]} Array of selected options
   */
  getSelectedOptions() {
    return this.options.filter(option => option.isSelected());
  }

  /**
   * @returns {boolean} True if the options are displayed as radio buttons
   */
  isRadioButtons() {
    return this.isSingleAnswer;
  }

  /**
   * Checks if any answer is selcted
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
    return this.options.filter(option => option.isCorrect()).length === 0;
  }

  /**
   * @returns {number} Number of correct options
   */
  getNumberOfCorrectOptions() {
    return this.numberOfCorrectOptions;
  }

  /**
   * Show the correct solution(s)
   */
  showSolutions() {
    this.disableSelectables();
    this.options.forEach(option => option.showSolution());
  }

  /**
   * Show the correct solution(s)
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
        return;
      }
      if (!this.lastSelected) {
        this.lastSelected = option;
      }
      else {
        this.lastSelected.toggle();
        this.lastSelected = option;
      }
    }
    option.toggle();

    this.callbacks.triggerInteracted();
  }

  /**
   * Resets all selected options
   */
  resetSelections() {
    this.lastSelected = null;
    this.options.forEach(option => option.uncheck());
    this.enableSelectables();
  }

  /**
   * Enables all selectables (radio buttons / checkboxes)
   */
  enableSelectables() {
    this.options.forEach(option => option.enable());
  }

  /**
   * Disables all selectables (radio buttons / checkboxes)
   */
  disableSelectables() {
    this.options.forEach(option => option.disable());
  }
}
