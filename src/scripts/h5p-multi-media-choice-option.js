/** Class representing a multi media option */
export class MultiMediaChoiceOption {
  /**
   * @constructor
   * @param {Object} option Option object from the editor
   * @param {number} contentId Content's id.
   * @param {string} aspectRatio Aspect ratio used if all options should conform to the same size
   * @param {number} maxAlternativesPerRow Max allowed alternatives pers row if space is availiable
   * @param {boolean} singleAnswer true for radio buttons, false for checkboxes
   * @param {Object} [callbacks = {}] Callbacks.
   */
  constructor(
    option,
    contentId,
    aspectRatio,
    maxAlternativesPerRow,
    singleAnswer,
    callbacks
  ) {
    this.contentId = contentId;
    this.aspectRatio = aspectRatio;
    this.maxAlternativesPerRow = maxAlternativesPerRow;
    this.singleAnswer = singleAnswer;

    this.media = option.media;
    this.disableImageZooming = option.disableImageZooming;
    this.correct = option.correct;
    this.tipsAndFeedback = option.tipsAndFeedback; // TODO: Currently not used

    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});
    this.callbacks.onKeyboardSelect =
      this.callbacks.onKeyboardSelect || (() => {});
    this.callbacks.onKeyboardArrowKey =
      this.callbacks.onKeyboardArrowKey || (() => {});
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});

    this.isValid = true; // If the media content is valid or not

    this.content = document.createElement('li');
    this.content.classList.add('h5p-multi-media-choice-option-container');

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
    if (!mediaContent) {
      this.isValid = false;
      return;
    }
    this.content.appendChild(mediaContent);

    // Set the width to control the max number of options per row.
    setTimeout(() => {
      const computedStyle =
        window.getComputedStyle(this.content) || this.content.currentStyle;
      this.content.style.width =
        'calc(' +
        100 / this.maxAlternativesPerRow +
        '% - (' +
        computedStyle.marginLeft +
        ' + ' +
        computedStyle.marginRight +
        '))';
    }, 0);

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
      default:
        return undefined;
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
    if (this.imageParamsAreInvalid(this.media.params)) {
      return;
    }

    const {
      alt,
      title,
      file: { path },
    } = this.media.params;

    const image = document.createElement('img');
    image.setAttribute('src', H5P.getPath(path, this.contentId));
    image.setAttribute('alt', alt);
    image.addEventListener('load', this.callbacks.triggerResize);
    // Do not show title if title is not specified
    if (title !== null) {
      image.setAttribute('title', title);
    }

    image.classList.add('h5p-multi-media-choice-media');

    return image;
  }

  /**
   * Test if important keys missing in media params for image
   * @param {object} imageParams Media params for image from the editor
   * @return {boolean} False if any of the three keys are present, true otherwise
   * @private
   */
  imageParamsAreInvalid(imageParams) {
    return (
      ['alt', 'title', 'file'].filter(key => key in imageParams).length === 0
    );
  }

  /**
   * @returns {boolean} True if the option is single answer
   */
  isSingleAnswer() {
    return this.singleAnswer;
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
    return this.content;
  }

  /**
   * Unchecks the selectable of the option
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
   * Unchecks the selectable of the option
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
    this.content.classList.remove('h5p-multi-media-choice-selected');
  }

  /**
   * Disable the selectable of the option
   */
  disable() {
    this.content.setAttribute('aria-disabled', 'true');
    this.content.classList.remove('h5p-multi-media-choice-enabled');
  }

  /**
   * Shows if the answer is correct or wrong in the UI
   */
  showSolution() {
    this.content.classList.remove('h5p-multi-media-choice-selected');
    if (this.correct) {
      this.content.classList.add('h5p-multi-media-choice-correct');
    }
    else {
      this.content.classList.add('h5p-multi-media-choice-wrong');
    }
  }

  /**
   * Hides any information about solution in the UI
   */
  hideSolution() {
    this.content.classList.remove('h5p-multi-media-choice-correct');
    this.content.classList.remove('h5p-multi-media-choice-wrong');
  }

  scaleMedia() {
    if (this.aspectRatio !== '') {
      const container = this.content;
      const width = container.clientWidth;
      const borderWidths = container.offsetWidth - width; // 2 * border-radius since left and right border is inluced
      let [x, y] = this.aspectRatio.split('to');
      let height = (width / x) * y;
      // Calculate width based on height and borders pixel values
      container.style.height = height + borderWidths + 'px';
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
          if (this.getDOM() === this.getDOM().parentNode.firstChild) {
            return;
          }

          this.callbacks.onKeyboardArrowKey(this, 'left');
          break;

        case 'ArrowRight':
          if (this.getDOM() === this.getDOM().parentNode.lastChild) {
            return;
          }

          this.callbacks.onKeyboardArrowKey(this, 'right');
          break;
      }
    });
  }

  focus() {
    this.content.focus();
  }
}
