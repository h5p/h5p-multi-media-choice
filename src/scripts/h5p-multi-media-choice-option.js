import { createElement, htmlDecode } from "./h5p-multi-media-choice-util";

/** Class representing a multi media option */
export class MultiMediaChoiceOption {
  /**
   * @constructor
   * @param {HTMLElement} frame Frame where video modal will spawn
   * @param {object} option Option object from the editor
   * @param {number} contentId Content's id
   * @param {string} aspectRatio Aspect ratio used if all options should conform to the same size
   * @param {boolean} singleAnswer true for radio buttons, false for checkboxes
   * @param {string} missingAltText translatable string for missing alt text
   * @param {string} closeModalText translatable string for closing modal text
   * @param {boolean} assetsFilePath //TODO: what is this?
   * @param {object} [callbacks = {}] Callbacks.
   */
  constructor(frame, option, contentId, aspectRatio, singleAnswer, missingAltText, closeModalText, callbacks) {
    this.contentId = contentId;
    this.aspectRatio = aspectRatio;
    this.singleAnswer = singleAnswer;
    this.missingAltText = missingAltText;
    this.closeModalText = closeModalText;

    this.frame = frame;
    this.option = option;
    this.media = option.media;
    this.correct = option.correct;

    this.callbacks = callbacks || {};
    this.callbacks.onClick = this.callbacks.onClick || (() => {});
    this.callbacks.onKeyboardSelect = this.callbacks.onKeyboardSelect || (() => {});
    this.callbacks.onKeyboardArrowKey = this.callbacks.onKeyboardArrowKey || (() => {});
    this.callbacks.triggerResize = this.callbacks.triggerResize || (() => {});
    this.callbacks.pauseAllOtherMedia = this.callbacks.pauseAllOtherMedia || (() => {});

    this.wrapper = createElement({type: 'div', classList: ['h5p-multi-media-choice-option', 'h5p-cardholder']});
    this.content = createElement({
      type: 'li',
      classList: ['h5p-multi-media-choice-list-item'],
      attributes: {
        role: singleAnswer ? 'radio' : 'checkbox',
        'aria-checked': 'false'
      }
    });

    this.content.appendChild(this.wrapper);
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
    const mediaWrapper = createElement({type: 'div', classList: ['h5p-multi-media-choice-media-wrapper']});
    if (this.aspectRatio !== 'auto') {
      mediaWrapper.classList.add('h5p-multi-media-choice-media-wrapper-specific-ratio');
      mediaWrapper.classList.add(`h5p-multi-media-choice-media-wrapper-${this.aspectRatio}`);
    }
    switch (this.media?.library?.split(' ')[0]) {
      case 'H5P.Image':
        mediaWrapper.appendChild(this.buildImage(this.option));
        break;
      case 'H5P.Video':
        mediaWrapper.appendChild(this.buildImage(this.option));
        this.wrapper.appendChild(this.buildVideo(this.option));
        break;
      case 'H5P.Audio':
        mediaWrapper.appendChild(this.buildImage(this.option));
        this.buildAudio();
        break;
    }
    return mediaWrapper;
  }

  /**
   * Returns the appropriate description depending on the content type
   * @returns {string} the description of the option
   */
  getDescription() {
    switch (this.media.library.split(' ')[0]) {
      case 'H5P.Image':
        return this.media.params.alt || this.missingAltText; // Alternative text
      default:
        return this.media?.metadata?.title;
    }
  }

  /**
   * Builds a video player button
   * @returns {HTMLElement} div containing a video player button
   */
  buildVideo() {
    if (this.media.params.sources) {
      const videoButton = createElement({
        type: 'button',
        classList: ['h5p-multi-media-video-button'],
        attributes: {
          tabindex: '0'
        }
      });
      const videoIcon = createElement({type: 'div', classList: ['play-icon']});
      videoButton.appendChild(videoIcon);

      if (!this.media?.params?.visuals?.poster?.path) {
        videoButton.classList.add('h5p-multi-media-content-media-button-centered');
      }

      videoButton.onclick = function (e) {
        e.stopPropagation();
      };
      videoButton.addEventListener('click', (event) => {
        const lastFocus = document.activeElement;
        const modal = this.createVideoPlayer(lastFocus);

        modal.setAttribute('tabindex', '0');
        modal.focus();
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        event.stopPropagation();
      });

      return videoButton;
    }
    return document.createElement('div');
  }

  /**
   * Builds an option for audio
   * @returns {HTMLElement} image with an audio button on top
   */
  buildAudio() {
    if (this.media.params.files) {
      const $audioWrapper = H5P.jQuery('<div>', {
        class:'h5p-multi-media-content-audio-wrapper' + (this.option.poster ? '' : ' h5p-multi-media-content-media-button-centered')
      });
      H5P.jQuery(this.wrapper).append($audioWrapper);

      //Only allow minimalistic playerMode
      this.media.params.playerMode = "minimalistic";
      this.media.params.propagateButtonClickEvents = false;
      this.media.params.autoplay = false;
      this.instance = H5P.newRunnable(this.media, this.contentId, $audioWrapper, false);

      this.instance.audio.addEventListener('play', () => {
        this.callbacks.pauseAllOtherMedia();
      });
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
    switch (this.media?.library?.split(' ')[0]) {
      case 'H5P.Image':
        if (this.media.params.file) {
          path = H5P.getPath(this.media.params.file.path, this.contentId);
        }
        break;
      case 'H5P.Video':
        if (this.media.params.visuals.poster) {
          path = H5P.getPath(this.media.params.visuals.poster.path, this.contentId);
        }
        break;
      case 'H5P.Audio':
        if (this.option.poster) {
          path = H5P.getPath(this.option.poster.path, this.contentId);
        }
        break;
    }

    const htmlDecodedAlt = htmlDecode(alt);
    const image = createElement({
      type: 'img',
      classList: ['h5p-multi-media-choice-media'],
      attributes: {
        src: path,
        alt: htmlDecodedAlt
      }
    });

    if (this.aspectRatio !== 'auto') {
      image.classList.add('h5p-multi-media-choice-media-specific-ratio');
    }

    image.addEventListener('load', this.callbacks.triggerResize);

    this.content.setAttribute('aria-label', htmlDecodedAlt);
    this.content.setAttribute('title', htmlDecode(title));

    return image;
  }

  /**
   *  Creates a modal containing a video player
   *  @param {HTMLElement} lastFocus element that had focus before modal opened
   */
  createVideoPlayer(lastFocus) {
    const modal = createElement({type: 'div', classList: ['h5p-multi-media-modal'], attributes: {'aria-modal': 'true'}});
    const modalContainer = createElement({type: 'div', classList: ['h5p-multi-media-choice-modal-container']});
    const modalContent = createElement({type: 'div', classList: ['h5p-multi-media-choice-modal-content']});
    const closeButton = createElement({type: 'button', classList: ['modal-close-button'], attributes: {'aria-label': this.closeModalText}});
    const cross = createElement({type: 'div', classList: ['icon-cross']});

    modal.appendChild(modalContainer);
    modalContainer.appendChild(modalContent);
    modalContent.appendChild(closeButton);
    closeButton.appendChild(cross);
    this.frame.appendChild(modal);

    this.media.params.visuals.poster = undefined;
    let newDiv = H5P.jQuery('<div></div>');
    H5P.jQuery(modalContent).append(newDiv);

    // Disable fit to wrapper
    this.media.params.visuals.fit = false;

    if (!this.instance) {
      this.instance = H5P.newRunnable(this.media, this.contentId, newDiv, true);
    }
    else {
      this.instance.attach(newDiv);
      this.instance.trigger('resize');
    }
    const instance = this.instance;
    let frame = this.frame;
    // Resize frame if content of modal grows bigger than frame
    let resizeFrame = (modalContent) => this.resizeWindow(modalContent);

    const handleResize = function () {
      instance.trigger('resize');
      resizeFrame(modalContent);
    };

    window.addEventListener('resize', handleResize);

    this.callbacks.pauseAllOtherMedia();
    let resize = () => this.callbacks.triggerResize();

    instance.on(this.media.params?.sources[0]?.mime === 'video/Panopto' ? 'containerLoaded' : 'loaded', (e) => {
      resize();
      resizeFrame(modalContent);
    });

    let closeModal = function () {
      modal.remove();
      window.removeEventListener('keydown', handleKeyDown);
      frame.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      lastFocus.focus();
      frame.style.minHeight = '0';
      resize();
    };

    closeButton.addEventListener('click', closeModal);

    // Add elements that should be tabbable is in this list
    const focusableElements = modal.querySelectorAll('.h5p-video, button:not([disabled])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = function (event) {
      if (event.key === 'Escape') {
        closeModal();
      }

      if (event.key === 'Tab' || event.keyCode === 9) { // 9 == TAB
        // make choice options unavailable from tabs
        if (document.activeElement != firstFocusable && document.activeElement != lastFocusable) {
          firstFocusable.focus();
          event.preventDefault();
        }
        else if (event.shiftKey) /* shift + tab */ {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            event.preventDefault();
          }
        }
        else /* tab */ {
          // Uploaded videos have their own tab handling
          if (document.activeElement === lastFocusable && lastFocusable.nodeName !== 'VIDEO') {
            firstFocusable.focus();
            event.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const handleClick = function (event) {
      if (event.target == modal || event.target == modalContainer) {
        closeModal();
      }
    };

    frame.addEventListener('click', handleClick);

    resize();
    this.resizeWindow(modalContent);
    return modal;
  }

  /**
   * Resizes window if it is too small for modal
   */
  resizeWindow(modalContent) {
    if (this.frame.offsetHeight - 50 < modalContent.offsetHeight) {
      this.frame.style.minHeight = modalContent.offsetHeight + 150 + 'px';
    }
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
    this.accessibilitySolutionText = createElement({type: 'span', classList: ['hidden-accessibility-solution-text']});
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

          if (!(document.activeElement.tagName === 'BUTTON')) {
            event.preventDefault(); // Disable scrolling
            this.callbacks.onKeyboardSelect(this);
          }
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          if (!this.singleAnswer) {
            return;
          }
          event.preventDefault(); // Disable scrolling
          if (this.getDOM() === this.getDOM().parentNode.firstChild) {
            return;
          }
          this.callbacks.onKeyboardArrowKey(event.code.replace('Arrow', ''));
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          if (!this.singleAnswer) {
            return;
          }
          event.preventDefault(); // Disable scrolling
          if (this.getDOM() === this.getDOM().parentNode.lastChild) {
            return;
          }
          this.callbacks.onKeyboardArrowKey(event.code.replace('Arrow', ''));
          break;
      }
    });
  }

  /**
   * Pauses the audio/video
   */
  pauseMedia()  {
    if (this.instance) {
      this.instance.pause();
    }
  }
}
