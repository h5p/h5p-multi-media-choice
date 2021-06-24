export class MultiMediaChoiceOption {
  constructor(option) {
    this.media = option.media;
    this.disableImageZooming = option.disableImageZooming;
    this.isCorrect = option.correct;
    this.tipsAndFeedback = option.tipsAndFeedback; // TODO: Currently not used

    this.content = this.buildContent();
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
   * Factory method for building the content of option
   * @param {object} option Option / answer object from the editor
   * @returns {HTMLElement} Either [Image] depending on the content type
   * @returns {undefined} Undefined if the content type cannot be created
   */
  createContent() {
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
