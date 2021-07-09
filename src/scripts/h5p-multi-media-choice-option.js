/** Class representing a multi media option */
export class MultiMediaChoiceOption {
  /**
   * @constructor
   * @param {object} option Option object from the editor
   * @param {number} contentId Content's id
   * @param {string} aspectRatio Aspect ratio used if all options should conform to the same size
   * @param {boolean} singleAnswer true for radio buttons, false for checkboxes
   * @param {boolean} assetsFilePath //TODO: what is this?
   * @param {object} [callbacks = {}] Callbacks.
   */
  constructor(option, contentId, aspectRatio, singleAnswer, assetsFilePath, callbacks) {
    this.contentId = contentId;
    this.aspectRatio = aspectRatio;
    this.singleAnswer = singleAnswer;
    this.assetsFilePath = assetsFilePath;

    this.media = option.media;
    this.correct = option.correct;

    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});
    this.callbacks.onKeyboardSelect = this.callbacks.onKeyboardSelect || (() => {});
    this.callbacks.onKeyboardArrowKey = this.callbacks.onKeyboardArrowKey || (() => {});
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});

    this.content = document.createElement('li');
    this.content.classList.add('h5p-multi-media-choice-list-item');
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('h5p-multi-media-choice-option');
    this.content.appendChild(this.wrapper);

    if (singleAnswer) {
      this.content.setAttribute('role', 'radio');
    }
    else {
      this.content.setAttribute('role', 'checkbox');
    }
    this.content.setAttribute('aria-checked', 'false');
    this.enable();
    this.content.addEventListener('click', this.callbacks.onClick);

    const mediaContent = this.createMediaContent();
    this.wrapper.appendChild(mediaContent);

    this.addKeyboardHandlers();
  }

  /**
   * Factory method for building the media content of option
   * @param {object} option Option / answer object from the editor
   * @returns {HTMLElement} Either [Image] depending on the content type
   * @returns {undefined} Undefined if the content type cannot be created
   */
  createMediaContent() {
    const mediaWrapper = document.createElement('div');
    mediaWrapper.classList.add('h5p-multi-media-choice-media-wrapper');
    if (this.aspectRatio !== 'auto') {
      mediaWrapper.classList.add('h5p-multi-media-choice-media-wrapper-specific-ratio');
      mediaWrapper.classList.add(`h5p-multi-media-choice-media-wrapper-${this.aspectRatio}`);
    }
    switch (this.media.metadata.contentType) {
      case 'Image':
        mediaWrapper.appendChild(this.buildImage(this.option));
        return mediaWrapper;
    }
  }

  /**
   * Returns the appropriate description depending on the content type
   * @returns {string} the description of the option
   */
  getDescription() {
    switch (this.media.metadata.contentType) {
      case 'Image':
        return this.media.params.alt; // Alternative text
      default:
        return '';
    }
  }

  /**
   * Builds an image from from media
   * @returns {HTMLElement} Image tag.
   */
  buildImage() {
    const alt = this.media.params.alt ? this.media.params.alt : '';
    const title = this.media.params.title ? this.media.params.title : '';

    let path = '';
    if (!this.media.params.file) {
      const placeholderAspectRatio = this.aspectRatio === 'auto' ? '1to1' : this.aspectRatio;
      path = `${this.assetsFilePath}/placeholder${placeholderAspectRatio}.svg`;
    }
    else {
      path = H5P.getPath(this.media.params.file.path, this.contentId);
    }

    const image = document.createElement('img');
    image.setAttribute('src', path);
    this.content.setAttribute('aria-label', alt);
    image.addEventListener('load', this.callbacks.triggerResize);
    this.content.setAttribute('title', title);
    image.classList.add('h5p-multi-media-choice-media');

    if (this.aspectRatio !== 'auto') {
      image.classList.add('h5p-multi-media-choice-media-specific-ratio');
    }

    return image;
  }

  /**
   * @returns {boolean} If the options is selected
   */
  isSelected() {
    return this.content.getAttribute('aria-checked') === 'true';
  }

  /**
   * @returns {boolean} True if the option is correct
   */
  isCorrect() {
    return this.correct;
  }

  /**
   * @returns {boolean} True if the option is disabled
   */
  isDisabled() {
    return this.content.getAttribute('aria-disabled') === 'true';
  }

  /**
   * Return the DOM for this class
   *
   * @return {HTMLElement} DOM for this class
   */
  getDOM() {
    return this.content;
  }

  /**
   * Sets the tab index to either -1 or 0
   * If anything else is passed as an argument, then 0 will be used
   * @param {number} tabIndex -1 or 0
   */
  setTabIndex(tabIndex) {
    switch (tabIndex) {
      case -1:
        this.content.setAttribute('tabindex', '-1');
        break;
      case 0:
        this.content.setAttribute('tabindex', '0');
        break;
      default:
        this.content.setAttribute('tabindex', '0');
    }
  }

  /**
   * Uncheck the selectable of the option
   */
  toggle() {
    if (this.isSelected()) {
      this.content.setAttribute('aria-checked', 'false');
      this.wrapper.classList.remove('h5p-multi-media-choice-selected');
    }
    else {
      this.content.setAttribute('aria-checked', 'true');
      this.wrapper.classList.add('h5p-multi-media-choice-selected');
    }
  }

  /**
   * Uncheck the selectable of the option
   */
  uncheck() {
    this.content.setAttribute('aria-checked', 'false');
    this.wrapper.classList.remove('h5p-multi-media-choice-selected');
  }

  /**
   * Set focus to this object
   */
  focus() {
    this.content.focus();
  }

  /**
   * Enables the selectable of the option
   */
  enable() {
    this.content.setAttribute('aria-disabled', 'false');
    this.wrapper.classList.add('h5p-multi-media-choice-enabled');
  }

  /**
   * Disable the selectable of the option
   */
  disable() {
    this.content.setAttribute('aria-disabled', 'true');
    this.content.setAttribute('tabindex', '-1');
    this.wrapper.classList.remove('h5p-multi-media-choice-enabled');
  }

  /**
   * Shows if the answer selected is correct or wrong in the UI and screen reader if selected
   */
  showSelectedSolution({ correctAnswer, wrongAnswer }) {
    this.wrapper.classList.remove('h5p-multi-media-choice-selected');
    if (this.isSelected()) {
      if (this.correct) {
        this.wrapper.classList.add('h5p-multi-media-choice-correct');
        this.addAccessibilitySolutionText(correctAnswer);
      }
      else {
        this.wrapper.classList.add('h5p-multi-media-choice-wrong');
        this.addAccessibilitySolutionText(wrongAnswer);
      }
    }
  }

  /**
   * Shows if the answer was correct in the UI and screen reader
   */
  showUnselectedSolution({ shouldCheck, shouldNotCheck }) {
    if (!this.isSelected()) {
      if (this.correct) {
        this.wrapper.classList.add('h5p-multi-media-choice-show-correct');
        this.addAccessibilitySolutionText(shouldCheck);
      }
      else {
        this.addAccessibilitySolutionText(shouldNotCheck);
      }
    }
  }

  /**
   * Adds solution feedback for screen reader
   */
  addAccessibilitySolutionText(solutionText) {
    this.accessibilitySolutionText = document.createElement('span');
    this.accessibilitySolutionText.classList.add('hidden-accessibility-solution-text');
    this.accessibilitySolutionText.innerText = `${solutionText}.`;
    this.wrapper.appendChild(this.accessibilitySolutionText);
  }

  /**
   * Hides any information about solution in the UI and screen reader
   */
  hideSolution() {
    this.wrapper.classList.remove('h5p-multi-media-choice-correct');
    this.wrapper.classList.remove('h5p-multi-media-choice-show-correct');
    this.wrapper.classList.remove('h5p-multi-media-choice-wrong');
    if (this.accessibilitySolutionText) {
      if (this.accessibilitySolutionText.parentNode) {
        this.accessibilitySolutionText.parentNode.removeChild(this.accessibilitySolutionText);
      }
    }
  }

  /**
   * Handlers for pressed keys on options
   * @param {HTMLElement} content Option HTML element
   */
  addKeyboardHandlers() {
    this.content.addEventListener('keydown', event => {
      switch (event.key) {
        case 'Enter':
        case ' ': // The space key
          if (this.isDisabled()) {
            return;
          }

          event.preventDefault(); // Disable scrolling
          this.callbacks.onKeyboardSelect(this);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          if (!this.singleAnswer) {
            return;
          }
          event.preventDefault(); // Disable scrolling
          this.callbacks.onKeyboardArrowKey(event.code.replace('Arrow', ''));
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          if (!this.singleAnswer) {
            return;
          }
          event.preventDefault(); // Disable scrolling
          this.callbacks.onKeyboardArrowKey(event.code.replace('Arrow', ''));
          break;
      }
    });
  }
}
