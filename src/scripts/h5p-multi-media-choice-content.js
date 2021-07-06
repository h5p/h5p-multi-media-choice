import { MultiMediaChoiceOption } from './h5p-multi-media-choice-option';

const optionMinWidth = 210;

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
    this.maxAlternativesPerRow = this.params.behaviour.maxAlternativesPerRow;

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
            onKeyboardArrowKey: direction => this.handleOptionArrowKey(index, direction),
            triggerResize: this.callbacks.triggerResize
          }
        )
    );
    this.optionList = this.buildOptionList(this.options);
    this.content.appendChild(this.optionList);
    this.setTabIndexes();
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
   * Returns whether the user can select only a single answer
   * @returns {boolean} True if only a single answer can be selcted
   */
  singleAnswer() {
    return this.isSingleAnswer;
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
    if (this.params.behaviour.singlePoint || this.isSingleAnswer || this.isBlankCorrect()) {
      return 1;
    }
    return this.numberOfCorrectOptions;
  }

  /**
   * Get score
   * @return {number} score based on the behaviour settings
   */
  getScore() {
    // One point if no correct options and no selected options
    if (!this.isAnyAnswerSelected()) {
      return this.isBlankCorrect() ? 1 : 0;
    }

    // Radio buttons, only one answer
    if (this.isSingleAnswer) {
      return this.lastSelectedRadioButtonOption.isCorrect() ? 1 : 0;
    }

    // Checkbox buttons. 1 point for correct answer, -1 point for incorrect answer
    let score = 0;
    this.options.forEach(option => {
      if (option.isSelected()) {
        option.isCorrect() ? score++ : score--;
      }
    });

    score = Math.max(0, score); // Negative score not allowed

    /**
     * Checkbox buttons with single point.
     * One point if (score / number of correct options) is above pass percentage
     */
    if (this.params.behaviour.singlePoint) {
      return (score * 100) / this.numberOfCorrectOptions >= this.params.behaviour.passPercentage
        ? 1
        : 0;
    }

    return score;
  }

  /**
   * Returns the selected options
   * @returns {object[]} Array of selected options
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
    this.options.forEach(option =>
      option.showSelectedSolution({
        correctAnswer: this.params.l10n.correctAnswer,
        wrongAnswer: this.params.l10n.wrongAnswer
      })
    );
  }

  /**
   * Show which unselected options were right
   */
  showUnselectedSolutions() {
    this.options.forEach(option =>
      option.showUnselectedSolution({
        shouldCheck: this.params.l10n.shouldCheck,
        shouldNotCheck: this.params.l10n.shouldNotCheck
      })
    );
  }

  /**
   * Focuses on an unselected solution (if present)
   * This is useful for the screen reader especially
   */
  focusUnselectedSolution() {
    const unselectedSolution = document.getElementsByClassName(
      'h5p-multi-media-choice-show-correct'
    )[0];
    if (unselectedSolution) {
      unselectedSolution.focus();
    }
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
        this.lastSelectedRadioButtonOption.setTabIndex(-1);
      }
      this.lastSelectedRadioButtonOption = option;
      this.lastSelectedRadioButtonOption.setTabIndex(0);
    }
    option.toggle();

    this.callbacks.triggerInteracted();
  }

  /**
   * Resets all selected options
   */
  resetSelections() {
    this.lastSelectedRadioButtonOption = null;
    this.setTabIndexes();
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
    this.setTabIndexes(-1);
  }

  /**
   * Set the tabindex of every option.
   * For checkbox options, all options are tabbable.
   * For radio button options, only the first option is tabbable.
   *
   * @param {number} [value=null] Tabindex to set to all options.
   */
  setTabIndexes(value = null) {
    if (this.isSingleAnswer) {
      this.options.forEach(option => option.setTabIndex(value !== null ? value : -1));
      this.options[0].setTabIndex(value !== null ? value : 0);
    }
    else {
      this.options.forEach(option => option.setTabIndex(value !== null ? value : 0));
    }
  }

  /**
   * Handle arrow keys pressed on options
   *
   * @param {number} index Index of option pressed
   * @param {string} direction Direction of arrow key pressed
   */
  handleOptionArrowKey(index, direction) {
    if (!['Left', 'Right', 'Up', 'Down'].includes(direction)) {
      return; // Invalid move or invalid direction
    }

    const directions = {
      Right: 1,
      Down: 1,
      Left: -1,
      Up: -1
    };

    const directionVector = directions[direction];
    const nextIndex = index + directionVector;

    this.toggleSelected(nextIndex);
    this.options[nextIndex].focus();
    this.options[nextIndex].setTabIndex(0);
    this.options[index].setTabIndex(-1);
  }

  /**
   * Set row height for an element in grid
   * @param  {HTMLElement} item
   */
  resizeGridItem(item) {
    // Reset grid height to get the real height
    item.style.gridRowEnd = '';
    const rowHeight = 5;
    const rowSpan = Math.ceil((item.getBoundingClientRect().height) / (rowHeight));

    item.style.gridRowEnd = 'span ' + rowSpan;
  }

  /**
   * Set the number of columns and each element's size
   */
  setColumnProperties() {
    const columnSpaceCount = this.optionList.getBoundingClientRect().width / optionMinWidth;

    // Find the number of columns from whichever is smaller: space, max values and number of options
    const columns = Math.floor(Math.min(columnSpaceCount, this.maxAlternativesPerRow, this.options.length));

    this.optionList.style.gridTemplateColumns = `repeat(${columns}, minmax(${optionMinWidth}px, 1fr))`;

    for (let x = 0; x < this.options.length; x++) {
      this.resizeGridItem(this.options[x].getDOM());
    }
  }
}
