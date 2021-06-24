/** Class representing a multi media option */
export class MultiMediaChoiceOption {
  /**
   * @constructor
   * @param {object} option Option object from the editor
   * @param {boolean} singleAnswer true for radio buttons, false for checkboxes
   * @param {function} onClick callback that fires when the option is selected
   */
  constructor(option, singleAnswer, onClick) {
    this.media = option.media;
    this.disableImageZooming = option.disableImageZooming;
    this.isCorrect = option.correct;
    this.tipsAndFeedback = option.tipsAndFeedback; // TODO: Currently not used

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-container');

    this.selectable = document.createElement('input');
    if (singleAnswer) {
      this.selectable.setAttribute('type', 'radio');
      this.selectable.setAttribute('name', 'options');
    }
    else {
      this.selectable.setAttribute('type', 'checkbox');
    }
    this.selectable.addEventListener('click', onClick);
    this.content.appendChild(this.selectable);

    const mediaContent = this.createMediaContent();
    if (mediaContent) {
      this.content.appendChild(mediaContent);
    }
  }
  /**
   * @returns {boolean} If the options is marked as correct
   */
  isCorrect() {
    return this.isCorrect;
  }

  /**
   * Return the DOM for this class
   * @return {HTMLElement} DOM for this class
   */
  getDOM() {
    return this.content;
  }

  /**
   * Return the selectable element
   * @return {HTMLElement} Input of type radio or checkbox
   */
  get selectable() {
    return this.selectable;
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
   * Builds an image from from media
   * @returns {HTMLElement} Image tag.
   */
  buildImage() {
    if (this.imageParamsAreInvalid(this.option.media.params)) {
      return;
    }

    const {
      alt,
      title,
      file: { path },
    } = this.option.media.params;

    const image = document.createElement('img');
    image.setAttribute('src', H5P.getPath(path, this.contentId));
    image.setAttribute('alt', alt);
    image.addEventListener('load', this.callbacks.triggerResize);
    // Do not show title if title is not specified
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

  /**
   * Test if important keys are present in media params for image.
   * @param {object} imageParams Media params for image from the editor.
   * @return {boolean} True if all three keys are present, false otherwise.
   * @private
   */
  imageParamsAreInvalid(imageParams) {
    return (
      ['alt', 'title', 'file'].filter(key => key in imageParams).length > 0
    );
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
    this.content.classList.add('h5p-multi-media-choice-correct');
    this.content.classList.add('h5p-multi-media-choice-wrong');
  }
}
