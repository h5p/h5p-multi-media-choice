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
    this.callbacks.triggerInteracted = this.callbacks.triggerInteracted || (() => {});

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
            triggerResize: this.callbacks.triggerResize
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
   * Return a list of the displayed options
   * @returns {MultiMediaChoiceOption[]} An array of HTML options
   */
  getOptions() {
    return this.options;
  }

  getScore() {
    // One point if no correct options and no selected options
    if (!this.isAnyAnswerSelected()) {
      return this.isBlankCorrect() ? 1 : 0;
    }

    // Radio buttons, only one answer
    if (this.isSingleAnswer) {
      return this.getSelected()[0].isCorrect ? 1 : 0;
    }

    let score = 0;
    this.options.forEach(option => {
      if (option.isChecked()) {
        option.isCorrect ? score++ : score--;
      }
    }, 0);

    score = Math.max(0, score); // Negative score not allowed
    if (this.params.behaviour.singlePoint) {
      // Checkbox buttons, one point if correctly answered
      score = Math.min(1, score);
    }

    // Checkbox buttons. 1 point for correct answer, -1 point for incorrect answer
    return score;
  }

  /**
   * Returns the selected objects
   * @returns {Object[]} A list of selectable-objects that are selected
   */
  getSelected() {
    return this.options.filter(option => option.isChecked());
  }

  /**
   * Returns the indexes of the selected objects
   * @returns {Number[]} List of indexes of selected selctables
   */
  getSelectedIndexes() {
    const selectedOptions = this.getSelected();
    return selectedOptions.map(option => this.options.indexOf(option));
  }

  /**
   * Checks if any answer is selcted
   * @returns {boolean} True if any answer is selected
   */
  isAnyAnswerSelected() {
    return this.getSelected().length > 0;
  }

  /**
   * Checks if there are no correct answers
   * @returns {boolean} True if there are no correct answers
   */
  isBlankCorrect() {
    return this.options.filter(option => option.isCorrect).length == 0;
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

    this.callbacks.triggerInteracted();
  }

  /**
   * Resets all selected options
   */
  resetSelections() {
    this.selected = [];
    this.options.forEach(option => option.uncheck());
    this.enableSelectables();
  }

  enableSelectables() {
    this.options.forEach(option => option.enable());
  }

  disableSelectables() {
    this.options.forEach(option => option.disable());
  }
}
