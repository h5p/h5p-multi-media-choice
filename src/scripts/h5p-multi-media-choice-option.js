import { htmlDecode } from "./h5p-multi-media-choice-util";

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
        return '';
    }
  }

  /**
   * Builds a video player button
   * @returns {HTMLElement} div containing a video player button
   */
  buildVideo() {
    if (this.media.params.sources) {
      const videoButton = document.createElement('button');
      const videoIcon = document.createElement('div'); 
    
      videoButton.classList.add('h5p-multi-media-video-button');
      videoIcon.classList.add('play-icon');
      videoButton.appendChild(videoIcon);
      videoButton.setAttribute('tabindex', '0');

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
      let newDiv = H5P.jQuery('<div>', {
        class:'h5p-multi-media-content-audio-wrapper'
      });
      H5P.jQuery(this.wrapper).append(newDiv);
      
      if (!this.option.poster) {
        newDiv.addClass('h5p-multi-media-content-media-button-centered');
      }

      //Only allow minimalistic playerMode
      this.media.params.playerMode = "minimalistic";
      this.instance = H5P.newRunnable(this.media, this.contentId, newDiv, false);
      this.instance.disableButtonClickEventPropagation();
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

    const image = document.createElement('img');
    image.setAttribute('src', path);
    this.content.setAttribute('aria-label', htmlDecode(alt));
    image.addEventListener('load', this.callbacks.triggerResize);
    this.content.setAttribute('title', htmlDecode(title));
    image.classList.add('h5p-multi-media-choice-media');
    image.setAttribute('alt', htmlDecode(alt));

    if (this.aspectRatio !== 'auto') {
      image.classList.add('h5p-multi-media-choice-media-specific-ratio');
    }

    return image;
  }

  /**
   *  Creates a modal containing a video player
   *  @param {HTMLElement} lastFocus element that had focus before modal opened
   */
  createVideoPlayer(lastFocus) {
    const modal = document.createElement('div');
    const modalContainer = document.createElement('div');
    const modalContent = document.createElement('div');
    const closeButton = document.createElement('button');
    const cross = document.createElement('div');

    modal.classList.add('h5p-multi-media-modal');
    modalContainer.classList.add('modal-container');
    modalContent.classList.add('modal-content');
    closeButton.classList.add('modal-close-button');
    cross.classList.add('icon-cross');
    modal.setAttribute('aria-modal', 'true');
    closeButton.setAttribute('aria-label', this.closeModalText);

    modal.appendChild(modalContainer);
    modalContainer.appendChild(modalContent);
    modalContent.appendChild(closeButton);
    closeButton.appendChild(cross);
    this.frame.appendChild(modal);

    this.media.params.visuals.poster = null;
    let newDiv = H5P.jQuery('<div></div>');
    H5P.jQuery(modalContent).append(newDiv);

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
    window.onresize = function () {
      instance.trigger('resize');
      resizeFrame(modalContent);
    };

    instance.on('ready', function () {
      instance.trigger('resize');
    });

    this.callbacks.pauseAllOtherMedia();
    let resize = () => this.callbacks.triggerResize();

    let closeModal = function () {
      modal.remove();
      window.onkeydown = null;
      window.onclick = null;
      window.onresize = null;
      lastFocus.focus();
      frame.style.minHeight = '0';
      resize();
    };

    // Add elements that should be tabbable is in this list
    const focusableElements = modal.querySelectorAll('.h5p-video,  button:not([disabled])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    window.onkeydown = function (event) {
      if (event.key === 'Escape') {
        closeModal();
      }

      if (event.key === 'Tab' || event.keyCode === 9) { // 9 == TAB 
        // make choice options unavailable from tabs
        if (document.activeElement != firstFocusable && document.activeElement != lastFocusable) {
          firstFocusable.focus();
        }
        if ( event.shiftKey ) /* shift + tab */ {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            event.preventDefault();
          }
        }
        else /* tab */ {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            event.preventDefault();
          }
        }
      }
    };

    window.onclick = function (event) {
      if (event.target == modal || event.target == closeButton || event.target == modalContainer || event.target == cross) {
        closeModal();
      } 
    };
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
    if  (this.instance) {
      this.instance.pause();
    }
  }
}
