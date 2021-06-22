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

    this.selected = [];
    this.selectables = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-content');

    // Build n options
    this.options = params.options.map((option) => this.buildOption(option));
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
   * Return the indexes of the selected options
   * @returns {Number[]} A list of indexes
   */
  getSelected() {
    return this.selected;
  }

  /**
   * Build options.
   * @param {object[]} options List of option objects.
   * @return {HTMLElement} List view of options.
   */
  buildOptionList(options) {
    const optionList = document.createElement('div');
    optionList.classList.add('h5p-multi-media-choice-options');
    options.forEach((option) => {
      if (option) {
        optionList.appendChild(option);
      }
    });
    return optionList;
  }

  /**
   * Build option.
   * @param {object} option Option object from the editor.
   * @param {number} key Option object from the editor.
   * @return {HTMLElement} Option.
   */
  buildOption(option) {
    const optionContainer = document.createElement('div');

    const selectable = document.createElement('input');
    if(this.singleAnswer()) {
      selectable.setAttribute('type', 'radio');
      selectable.setAttribute('name', 'options');
    }
    else
      selectable.setAttribute("type", "checkbox");

    const optionIndex = this.selectables.length;
    const self = this;
    selectable.addEventListener('click', function () {
      self.toggleSelected(optionIndex);
    });
    this.selectables.push(selectable);
    optionContainer.appendChild(selectable);

    if (this.mediaParamsAreValid(option.media.params)) {
      const {
        alt,
        title,
        file: { path },
      } = option.media.params;

      const image = document.createElement('img');
      image.setAttribute('src', H5P.getPath(path, this.contentId));
      image.setAttribute('alt', alt);
      image.setAttribute('title', title);
      image.classList.add('h5p-multi-media-choice-media');
      image.classList.add(`h5p-multi-media-choice-media-${this.params.behaviour.aspectRatio}`)
      optionContainer.appendChild(image);

      return optionContainer;
    }
  }

  /**
   * Test if important keys are present in media params.
   * @param {object} mediaParams Media params from the editor.
   * @return {boolean} True if all keys are present, false otherwise.
   * @private
   */
  mediaParamsAreValid(mediaParams) {
    return (
      ['alt', 'title', 'file'].filter((key) => key in mediaParams).length > 0
    );
  }

  /**
   * Counts options marked as correct
   * @returns {number} Number of options marked as correct in the editor.
   */
  getNumberOfCorrectOptions() {
    return this.params.options.filter((option) => option.correct).length;
  }

  /**
   * Determines the task type, indicating whether the answers should be
   * radio buttons or checkboxes.
   * @returns true if the options should be displayed as radiobuttons,
   * @returns false if they should be displayed as checkboxes
   */
   singleAnswer() {
    if(this.params.behaviour.type === 'auto')
      return this.getNumberOfCorrectOptions() === 1;
    return this.params.behaviour.type === 'single';
  }

  /**
   * Toggles the given option. If the options are radio buttons
   * the previously checked one is unchecked
   * @param {Number} optionIndex Which option is being selected
   */
  toggleSelected(optionIndex) {
    const option = this.selectables[optionIndex];
    if (option.checked) {
      const selIndex = this.selected.indexOf(optionIndex);
      if (selIndex > -1)
        this.selected.splice(selIndex, 1);
    }
    else {
      if (this.singleAnswer() && this.selected.length > 0) {
        this.selectables[this.selected[0]].checked = false;
        this.selected = {optionIndex};
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
    this.selected = {};
    this.selectables.forEach(function (selectable, index) {
      selectable.checked = false;
    });
  }
}
