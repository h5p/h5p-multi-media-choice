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

    this.numberOfCorrectOptions = params.options.filter(
      option => option.correct
    ).length;

    this.isSingleAnswer =
      this.params.behaviour.questionType === 'auto'
        ? this.numberOfCorrectOptions === 1
        : this.params.behaviour.questionType === 'single';

    this.selected = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-content');

    // Build n options
    this.options = params.options.map(
      (option, index) =>
        new MultiMediaChoiceOption(
          params,
          contentId,
          option,
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
   * Get score
   * @return {number} score based on the behavior settings
   */
  getScore() {
    // One point if no correct options and no selected options
    const self = this;
    if (!self.isAnyAnswerSelected()) {
      return self.isBlankCorrect() ? 1 : 0;
    }

    // Radio buttons, only one answer
    if (self.isSingleAnswer) {
      const selectedIndex = self.getSelectedIndexes()[0];
      return self.getOptions()[selectedIndex].isCorrect() ? 1 : 0;
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

    score = Math.max(0, score); // Negative score not allowed

    return score;
  }

  /**
   * @returns {Object[]} Array of options objects
   */
  getOptions() {
    return this.options;
  }

  /**
   * Returns the selected objects
   * @returns {Number[]} Array of indexes of selected selctables
   */
  getSelectedIndexes() {
    return this.selected;
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
    return this.getSelectedIndexes().length > 0;
  }

  /**
   * Checks if there are no correct answers
   * @returns {boolean} True if there are no correct answers
   */
  isBlankCorrect() {
    return this.options.filter(option => option.isCorrect()).length == 0;
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
   * @param {Number} optionIndex Which option is being selected
   */
  toggleSelected(optionIndex) {
    const placeInSelected = this.selected.indexOf(optionIndex);

    //If already checked remove from selected list. Radio buttons don't get unchecked
    if (placeInSelected !== -1 && !this.isSingleAnswer) {
      this.selected.splice(placeInSelected, 1);
    }
    //if being checked add to selected list. If radio make sure others get unselected.
    else if (placeInSelected === -1) {
      if (this.isSingleAnswer) {
        this.selected = [optionIndex];
      }
      else {
        this.selected.push(optionIndex);
      }
    }
  }

  /**
   * Resets all selected options
   */
  resetSelections() {
    this.selected = [];
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
