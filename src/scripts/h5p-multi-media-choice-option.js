/** Class representing a multi media option */
export class MultiMediaChoiceOption {
  /**
   * @constructor
   * @param {object} params Parameters from editor
   * @param {number} contentId Content's id.
   * @param {object} option Option object from the editor
   * @param {boolean} singleAnswer true for radio buttons, false for checkboxes
   * @param {object} [callbacks = {}] Callbacks.
   */
  constructor(params, contentId, option, singleAnswer, callbacks) {
    this.params = params;
    this.contentId = contentId;
    this.media = option.media;
    this.disableImageZooming = option.disableImageZooming;
    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});

    this.isValid = true; // If the media content is valid or not
    this.isCorrect = option.correct;
    this.tipsAndFeedback = option.tipsAndFeedback; // TODO: Currently not used

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-option-container');

    this.selectable = document.createElement('input');
    if (singleAnswer) {
      this.selectable.setAttribute('type', 'radio');
      this.selectable.setAttribute('name', 'options');
    }
    else {
      this.selectable.setAttribute('type', 'checkbox');
    }
    this.selectable.addEventListener('click', this.callbacks.onClick);
    this.content.appendChild(this.selectable);

    const mediaContent = this.createMediaContent();
    if (!mediaContent) {
      this.isValid = false;
      return;
    }
    this.content.appendChild(mediaContent);

    //sets the width to control the max number of options per row. 2em is from the margins
    this.content.style.width =
      'calc(' + 100 / this.params.behaviour.maxAlternativesPerRow + '% - 2em)';
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
    if (this.params.behaviour.sameAspectRatio) {
      image.classList.add(
        `h5p-multi-media-choice-media-${this.params.behaviour.aspectRatio}`
      );
    }

    return image;
  }

  /**
   * Test if important keys are present in media params for image.
   * @param {object} imageParams Media params for image from the editor.
   * @return {boolean} True if all three keys are present, false otherwise.
   * @private
   */
  imageParamsAreInvalid(imageParams) {
    return (
      ['alt', 'title', 'file'].filter(key => key in imageParams).length === 0
    );
  }

  /**
   * @returns {boolean} If the options is marked as correct
   */
  isChecked() {
    return this.selectable.checked;
  }

  /**
   * Return the DOM for this class
   * @return {HTMLElement} DOM for this class
   */
  getDOM() {
    return this.content;
  }

  uncheck() {
    this.selectable.checked = false;
  }

  enable() {
    this.selectable.disabled = false;
  }

  disable() {
    this.selectable.disabled = true;
  }

  /**
   * Shows if the answer is correct or wrong in the UI
   */
  showSolution() {
    if (this.isCorrect) {
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
}
