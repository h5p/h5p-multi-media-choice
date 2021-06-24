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

    this.selected = [];
    this.selectables = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-content');

    // Build n options
    this.options = params.options.map(option => this.buildOption(option));
    this.content = this.buildOptionList(this.options);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Returns the selected objects
   * @returns {Object[]} A list of selectable-objects that are selected
   */
  getSelected() {
    return this.selectables.filter(selectable => selectable.checked);
  }

  /**
   * Returns the indexes of the selected objects
   * @returns {Number[]} List of indexes of selected selctables
   */
  getSelectedIndexes() {
    const selected = this.getSelected();
    return selected.map(selected => this.getIndex(selected));
  }

  /**
   * Return the index of the given selctable
   * @param {object} selectable Selectable object
   * @returns {number} Index of the selectable
   */
  getIndex(selectable) {
    return this.selectables.indexOf(selectable);
  }

  /**
   * Checks if any answer is selcted
   * @returns {boolean} True if any answer is selected
   */
  isAnswerSelected() {
    return this.getSelected().length > 0;
  }

  /**
   * Checks if there are no correct answers
   * @returns {boolean} True if there are no correct answers
   */
  blankIsCorrect() {
    for (let i = 0; i < this.params.options.length; i++) {
      if (this.params.options[i].correct) {
        return false;
      }
    }
    return true;
  }

  /**
   * Show the correct solution(s)
   */
  showSolutions() {
    this.disableSelectables();

    const self = this;
    this.params.options.forEach(function (option, index) {
      if (option.correct) {
        self.options[index].classList.add('h5p-multi-media-choice-correct');
      }
      else {
        self.options[index].classList.add('h5p-multi-media-choice-wrong');
      }
    });
  }

  /**
   * Hides the solution(s)
   */
  hideSolutions() {
    const self = this;
    this.params.options.forEach(function (option, index) {
      if (option.correct) {
        self.options[index].classList.remove('h5p-multi-media-choice-correct');
      }
      else {
        self.options[index].classList.remove('h5p-multi-media-choice-wrong');
      }
    });
  }

  /**
   * Build options.
   * @param {object[]} options List of option objects.
   * @return {HTMLElement} List view of options.
   */
  buildOptionList(options) {
    const optionList = document.createElement('ul');
    optionList.setAttribute(
      'role',
      this.isSingleAnswer() ? 'radiogroup' : 'group'
    );
    optionList.classList.add('h5p-multi-media-choice-options');
    options.forEach(option => {
      if (option) {
        optionList.appendChild(option);
      }
    });
    return optionList;
  }

  /**
   * Builds a selectable option containing media.
   * @param {object} option Option object from the editor.
   * @return {HTMLElement} Option.
   */
  buildOption(option) {
    const optionContainer = document.createElement('div');
    optionContainer.classList.add('h5p-multi-media-choice-container');

    const selectable = document.createElement('input');
    if (this.isSingleAnswer()) {
      selectable.setAttribute('type', 'radio');
      selectable.setAttribute('name', 'options');
    }
    else {
      selectable.setAttribute('type', 'checkbox');
    }

    const optionIndex = this.selectables.length;
    const self = this;
    selectable.addEventListener('click', function () {
      self.toggleSelected(optionIndex);
    });
    this.selectables.push(selectable);
    optionContainer.appendChild(selectable);

    const media = this.buildMedia(option);
    if (media) {
      optionContainer.appendChild(media);
      return optionContainer;
    }
  }

  /**
   * Builds a media element based on option.
   * @param {object} option Option object from the editor.
   * @returns {HTMLElement} Either [Image] depending on option.
   */
  buildMedia(option) {
    switch (option.media.metadata.contentType) {
      case 'Image':
        return this.buildImage(option);
      default:
        return undefined;
    }
  }

  /**
   * Builds an image from options.
   * @param {object} option Option object from the editor.
   * @returns {HTMLElement} Image.
   */
  buildImage(option) {
    if (this.imageParamsAreValid(option.media.params)) {
      const {
        alt,
        title,
        file: { path },
      } = option.media.params;

      const image = document.createElement('img');
      image.setAttribute('src', H5P.getPath(path, this.contentId));
      image.setAttribute('alt', alt);
      image.addEventListener('load', this.callbacks.triggerResize);
      //Do not show title if title is not specified
      if (title != null) {
        image.setAttribute('title', title);
      }

      image.classList.add('h5p-multi-media-choice-media');
      if (this.params.behaviour.sameAspectRatio) {
        image.classList.add(
          `h5p-multi-media-choice-media-${this.params.behaviour.aspectRatio}`
        );
      }

      return image;
    }
    return null;
  }

  /**
   * Test if important keys are present in media params for image.
   * @param {object} imageParams Media params for image from the editor.
   * @return {boolean} True if all three keys are present, false otherwise.
   * @private
   */
  imageParamsAreValid(imageParams) {
    return (
      ['alt', 'title', 'file'].filter(key => key in imageParams).length > 0
    );
  }

  /**
   * Counts options marked as correct
   * @returns {Number} Number of options marked as correct in the editor.
   */
  getNumberOfCorrectOptions() {
    return this.params.options.filter(option => option.correct).length;
  }

  /**
   * Determines the question type, indicating whether the answers should be
   * radio buttons or checkboxes.
   * @returns  true if the options should be displayed as radio buttons,
   * @returns  false if they should be displayed as checkboxes
   */
  isSingleAnswer() {
    if (this.params.behaviour.questionType === 'auto') {
      return this.getNumberOfCorrectOptions() === 1;
    }
    return this.params.behaviour.questionType === 'single';
  }

  /**
   * Toggles the given option. If the options are radio buttons
   * the previously checked one is unchecked
   * @param {Number} optionIndex Which option is being selected
   */
  toggleSelected(optionIndex) {
    const placeInSelected = this.selected.indexOf(optionIndex);

    //If already checked remove from selected list. Radio buttons don't get unchecked
    if (placeInSelected !== -1 && !this.isSingleAnswer()) {
      this.selected.splice(placeInSelected, 1);
    }
    //if being checked add to selected list. If radio make sure others get unselected.
    else if (placeInSelected === -1) {
      if (this.isSingleAnswer()) {
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
    this.selectables.forEach(selectable => (selectable.checked = false));
    this.enableSelectables();
  }

  enableSelectables() {
    this.selectables.forEach(selectable => (selectable.disabled = false));
  }

  disableSelectables() {
    this.selectables.forEach(selectable => (selectable.disabled = true));
  }
}
