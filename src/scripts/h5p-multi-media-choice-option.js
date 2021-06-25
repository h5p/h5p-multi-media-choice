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

    this.media = option.media;
    this.disableImageZooming = option.disableImageZooming;
    this.correct = option.correct;
    this.tipsAndFeedback = option.tipsAndFeedback; // TODO: Currently not used

    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});

    this.isValid = true; // If the media content is valid or not

    this.content = document.createElement('li');

    if (singleAnswer) {
      this.content.setAttribute('role', 'radio');
    }
    else {
      this.content.setAttribute('role', 'checkbox');
    }
    this.content.setAttribute('aria-checked', false);
    this.content.setAttribute('aria-disabled', false);
    this.content.addEventListener('click', this.callbacks.onClick);

    this.container = document.createElement('div');
    this.container.classList.add('h5p-multi-media-choice-option-container');
    this.content.appendChild(this.container);

    const mediaContent = this.createMediaContent();
    if (!mediaContent) {
      this.isValid = false;
      return;
    }
    this.container.appendChild(mediaContent);

    // Set the width to control the max number of options per row.
    setTimeout(() => {
      const style = window.getComputedStyle(this.content) || this.content.currentStyle;
      this.content.style.width = 'calc(' + 100 / this.maxAlternativesPerRow + '% - ' + (style.marginLeft + style.marginRight) + ')';
    }, 0);
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
      this.content.setAttribute('aria-checked', false);
    }
    else {
      this.content.setAttribute('aria-checked', true);
    }
  }

  /**
   * Unchecks the selectable of the option
   */
  uncheck() {
    this.content.setAttribute('aria-checked', false);
  }

  /**
   * Enables the selectable of the option
   */
  enable() {
    this.content.setAttribute('aria-disabled', false);
  }

  /**
   * Disable the selectable of the option
   */
  disable() {
    this.content.setAttribute('aria-disabled', true);
  }

  /**
   * Shows if the answer is correct or wrong in the UI
   */
  showSolution() {
    if (this.correct) {
      this.container.classList.add('h5p-multi-media-choice-correct');
    }
    else {
      this.container.classList.add('h5p-multi-media-choice-wrong');
    }
  }

  /**
   * Hides any information about solution in the UI
   */
  hideSolution() {
    this.container.classList.remove('h5p-multi-media-choice-correct');
    this.container.classList.remove('h5p-multi-media-choice-wrong');
  }

  scaleMedia() {
    if (this.aspectRatio !== '') {
      const container = this.content;
      const width = container.clientWidth;
      const borderWidth = 3;
      const checkboxWidth = 19;
      let values = this.aspectRatio.split('to');
      let height = ((width - checkboxWidth) / values[0]) * values[1];
      //Calculate width based on height and 2*border pixel values
      container.style.height = height + borderWidth * 2 + 'px';
    }
  }
}
