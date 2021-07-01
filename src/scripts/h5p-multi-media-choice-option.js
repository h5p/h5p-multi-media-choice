/** Class representing a multi media option */
export class MultiMediaChoiceOption {
  /**
   * @constructor
   * @param {Object} option Option object from the editor
   * @param {number} contentId Content's id.
   * @param {string} aspectRatio Aspect ratio used if all options should conform to the same size
   * @param {number} maxAlternativesPerRow Max allowed alternatives per row if space is available
   * @param {boolean} singleAnswer true for radio buttons, false for checkboxes
   * @param {Object} [callbacks = {}] Callbacks.
   */
  constructor(
    option,
    contentId,
    aspectRatio,
    maxAlternativesPerRow,
    singleAnswer,
    assetsFilePath,
    callbacks
  ) {
    this.contentId = contentId;
    this.aspectRatio = aspectRatio;
    this.maxAlternativesPerRow = maxAlternativesPerRow;
    this.singleAnswer = singleAnswer;
    this.assetsFilePath = assetsFilePath;

    this.media = option.media;
    this.disableImageZooming = option.disableImageZooming;
    this.correct = option.correct;

    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});
    this.callbacks.onKeyboardSelect = this.callbacks.onKeyboardSelect || (() => {});
    this.callbacks.onKeyboardArrowKey = this.callbacks.onKeyboardArrowKey || (() => {});
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});

    this.listItem = document.createElement('li');
    this.listItem.classList.add('h5p-multi-media-choice-list-item');
    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-option');
    this.listItem.appendChild(this.content);

    if (singleAnswer) {
      this.content.setAttribute('role', 'radio');
    }
    else {
      this.content.setAttribute('role', 'checkbox');
    }
    this.content.setAttribute('aria-checked', 'false');
    this.enable();
    this.content.setAttribute('tabindex', '0');
    this.content.addEventListener('click', this.callbacks.onClick);

    const mediaContent = this.createMediaContent();
    this.content.appendChild(mediaContent);

    this.addKeyboardHandlers(this.content);
  }

  /**
   * Factory method for building the media content of option
   * @param {object} option Option / answer object from the editor
   * @returns {HTMLElement} Either [Image] depending on the content type
   * @returns {undefined} Undefined if the content type cannot be created
   */
  createMediaContent() {
    switch (this.media.metadata.contentType) {
      case 'Image':
        return this.buildImage(this.option);
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
    const alt = this.isEmpty(this.media.params.alt) ? '' : this.media.params.alt;
    const title = this.isEmpty(this.media.params.title) ? '' : this.media.params.alt;

    let path = '';
    if (this.isEmpty(this.media.params.file)) {
      const placeholderAspectRatio = this.aspectRatio === 'auto' ? '1to1' : this.aspectRatio;
      path = `${this.assetsFilePath}/placeholder${placeholderAspectRatio}.svg`;
    }
    else {
      path = H5P.getPath(this.media.params.file.path, this.contentId);
    }

    const image = document.createElement('img');
    image.setAttribute('src', path);
    image.setAttribute('alt', alt);
    image.addEventListener('load', this.callbacks.triggerResize);
    image.setAttribute('title', title);
    image.classList.add('h5p-multi-media-choice-media');

    return image;
  }

  /**
   * Checks if string is empty
   * @param {string} text
   * @returns {boolean} True if empty
   */
  isEmpty(text) {
    return text === null || text === undefined || text === '';
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
   * @return {HTMLElement} DOM for this class
   */
  getDOM() {
    return this.listItem;
  }

  /**
   * Uncheck the selectable of the option
   */
  toggle() {
    if (this.isSelected()) {
      this.content.setAttribute('aria-checked', 'false');
      this.content.classList.remove('h5p-multi-media-choice-selected');
    }
    else {
      this.content.setAttribute('aria-checked', 'true');
      this.content.classList.add('h5p-multi-media-choice-selected');
    }
  }

  /**
   * Uncheck the selectable of the option
   */
  uncheck() {
    this.content.setAttribute('aria-checked', 'false');
    this.content.classList.remove('h5p-multi-media-choice-selected');
  }

  /**
   * Enables the selectable of the option
   */
  enable() {
    this.content.setAttribute('aria-disabled', 'false');
    this.content.classList.add('h5p-multi-media-choice-enabled');
  }

  /**
   * Disable the selectable of the option
   */
  disable() {
    this.content.setAttribute('aria-disabled', 'true');
    this.content.classList.remove('h5p-multi-media-choice-enabled');
  }

  /**
   * Shows if the answer selected is correct or wrong in the UI if selected
   */
  showSelectedSolution() {
    this.content.classList.remove('h5p-multi-media-choice-selected');
    if (this.isSelected()) {
      if (this.correct) {
        this.content.classList.add('h5p-multi-media-choice-correct');
      }
      else {
        this.content.classList.add('h5p-multi-media-choice-wrong');
      }
    }
  }

  /**
   * Shows if the answer was correct in the UI
   */
  showUnselectedSolution() {
    if (this.correct && !this.isSelected()) {
      this.content.classList.add('h5p-multi-media-choice-show-correct');
    }
  }

  /**
   * Hides any information about solution in the UI
   */
  hideSolution() {
    this.content.classList.remove('h5p-multi-media-choice-correct');
    this.content.classList.remove('h5p-multi-media-choice-show-correct');
    this.content.classList.remove('h5p-multi-media-choice-wrong');
  }

  scaleMedia() {
    if (this.aspectRatio !== 'auto') {
      const container = this.content;
      const width = container.clientWidth;
      const border = container.offsetWidth - width;
      const padding = window.getComputedStyle(container).padding.replace('px', '') * 2;
      let [x, y] = this.aspectRatio.split('to');
      let height = ((width - padding) / x) * y;
      container.style.height = height + border + padding + 'px';
    }
  }

  addKeyboardHandlers(content) {
    content.addEventListener('keydown', event => {
      switch (event.code) {
        case 'Enter':
          if (this.isDisabled()) {
            return;
          }

          this.callbacks.onKeyboardSelect(this);
          break;

        case 'Space':
          if (this.isDisabled()) {
            return;
          }

          this.callbacks.onKeyboardSelect(this);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault(); // Disable scrolling
          if (this.getDOM() === this.getDOM().parentNode.firstChild) {
            return;
          }

          this.callbacks.onKeyboardArrowKey(this, event.code.replace('Arrow', ''));
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault(); // Disable scrolling
          if (this.getDOM() === this.getDOM().parentNode.lastChild) {
            return;
          }

          this.callbacks.onKeyboardArrowKey(this, event.code.replace('Arrow', ''));
          break;
      }
    });
  }

  focus() {
    this.content.focus();
  }
}
