import { htmlDecode } from "./h5p-multi-media-choice-util";
const $ = H5P.jQuery;

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
  constructor(frame, option, contentId, aspectRatio, singleAnswer, missingAltText, callbacks) {
    this.contentId = contentId;
    this.aspectRatio = aspectRatio;
    this.singleAnswer = singleAnswer;
    this.missingAltText = missingAltText;
    this.frame = frame;
    this.option = option;
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
    switch (this.media?.library?.split(' ')[0]) {
      case 'H5P.Image':
        mediaWrapper.appendChild(this.buildImage(this.option));
        
      case 'H5P.Video':
        mediaWrapper.appendChild(this.buildImage(this.option));
        mediaWrapper.appendChild(this.buildVideo(this.option));
        
      case 'H5P.Audio':
        mediaWrapper.appendChild(this.buildImage(this.option));
        mediaWrapper.appendChild(this.buildAudio(this.option));
        
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
  buildVideo(){
    const videoButton = document.createElement('div');
    const videoIcon = document.createElement('i'); 
    if(this.media.params.sources){
      videoButton.classList.add('h5p-multi-media-content-media-button');
      videoButton.classList.add('h5p-multi-media-content-media-button-video');
      videoIcon.classList.add('fa-play');
      videoButton.appendChild(videoIcon);
      let src = H5P.getPath(this.media.params.sources[0].path, this.contentId);
      //const modal = this.createVideoPlayer(src);
      //this.frame.appendChild(modal);
      this.testVideo();
      videoButton.onclick = function(event){
        
        //modal.style.display = 'flex';
        //video.instance = H5P.newRunnable(this.media, this.contentId, this.frame, true);
        event.stopPropagation();
      }
    }
    return videoButton;
  }

  testVideo(){

    // Never fit to wrapper
    const $window = H5P.jQuery.window;
    if (!this.media.params.visuals) {
    this.media.params.visuals = {};
    }
    this.media.params.visuals.fit = false;
    const instance = H5P.newRunnable(this.media, this.contentId, $window, true);

    
    instance.on('loaded', function(event){
      instance.play();
    });
    

    //this.frame.appendChild($attachTo)
    var fromVideo = false; // Hack to avoid never ending loop
    instance.on('resize', function () {
      fromVideo = true;
      this.trigger('resize');
      fromVideo = false;
    });
  

  }

  /**
   * Builds a audio player button
   * @returns {HTMLElement} div containing an audio player button
   */
  buildAudio(){
    const audioButton = document.createElement('div');
    const audioIcon = document.createElement('i');

    

    const $attachTo = H5P.jQuery('#h5p-audio-container'); 
    
    const $window = H5P.jQuery.window;
    if (!this.media.params.visuals) {
    this.media.params.visuals = {};
    }
    this.media.params.visuals.fit = false;
    const instance = H5P.newRunnable(this.media, this.contentId, $window, false);

    

   /* this.frame = {
      $element: $('</div>', {
        'class': 'h5p-multi-media-choice-audio',
      })
    };
    */
   
/*
    if(this.media.params.files){
      audioIcon.classList.add('fa-volume-off');
      audioButton.appendChild(audioIcon);
      audioButton.classList.add('h5p-multi-media-content-media-button');
      instance.on('loaded', function(event){
        instance.attatch($attachTo);

        instance.play();
      })
      audioButton.classList.add('h5p-multi-media-content-media-button-audio'); 
      
      const audio = this.createAudioPlayer(this.media.params.files, this.contentId)
      audioButton.appendChild(audio);
      audioButton.onclick = function(event){
        

        if(audio.classList.contains('h5p-multi-media-content-media-audio-playing')){
          audioIcon.classList.toggle('fa-volume-up');
          audio.pause();
          audio.currentTime = 0;
        }
        else{
          //audio.play();
          
          audioIcon.classList.toggle('fa-volume-up');
        }
        event.stopPropagation();
      }
    }*/
    return audioButton;
  }



  /**
   * Builds an image from from media
   * @returns {HTMLElement} Image tag.
   */
  buildImage() {
    const alt = this.media.params.alt ? this.media.params.alt : '';
    const title = this.media.params.title ? this.media.params.title : '';

    let path = '';
    switch(this.media?.library?.split(' ')[0]){
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
   *  Creates an audio player 
   *  @returns {HTMLElement} Audio tag.
   */
  createAudioPlayer(audio, contentId){
    if(audio){
      const audioPlayer = document.createElement('audio');
    if (audioPlayer.canPlayType !== undefined){
      // Add supported source files.
      for (var i = 0; i < audio.length; i++) {
        if (audioPlayer.canPlayType(audio[i].mime)) {
          var source = document.createElement('source');
          source.src = H5P.getPath(audio[i].path, contentId);
          source.type = audio[i].mime;
          audioPlayer.appendChild(source);
        }
      }
    }
    if (!audioPlayer.children.length) {
      audioPlayer = null; // Not supported
    }
    else {
      audioPlayer.controls = false;
      audioPlayer.preload = 'auto';
      audioPlayer.loop = true;

      var handlePlaying = function () {
        audioPlayer.classList.add('h5p-multi-media-content-media-audio-playing');
        audioPlayer.play();
      };
      var handleStopping = function () {
        audioPlayer.classList.remove('h5p-multi-media-content-media-audio-playing');
        audioPlayer.pause();
      };
      audioPlayer.addEventListener('play', handlePlaying);
      audioPlayer.addEventListener('ended', handleStopping);
      audioPlayer.addEventListener('pause', handleStopping);
    }
    return audioPlayer;
    }
  }

  /**
   *  Creates a modal containing a video player 
   *  
   */
  createVideoPlayer(source){
    const modal = document.createElement('div');
    const modalContent = document.createElement('div');
    const videoContainer= document.createElement('div');
    const closeButton = document.createElement('span');
    const video = document.createElement('video');

    modal.classList.add('h5p-multi-media-content-media-video-modal');
    modalContent.classList.add('h5p-multi-media-content-media-video-modal-content')
    closeButton.classList.add('h5p-multi-media-content-media-video-close');
    video.classList.add('h5p-multi-media-content-media-video-player');

    video.src = source;
    video.autoplay = true;
    video.muted = true;
    modal.appendChild(video);
    modal.style.display = 'none';

    
    closeButton.onClick = function(){
      modal.style.display = 'none';
      handleStopping();
    }
    window.onclick = function(event){
      if(event.target == modal){
        modal.style.display = 'none';
        handleStopping();
      }
    }
    var handlePlaying = function(){
      video.play()
      video.classList.add('h5p-multi-media-content-media-video-playing')
    }
    var handleStopping = function(){
      video.pause()
      video.currentTime = 0;
      video.classList.remove('h5p-multi-media-content-media-video-playing')
    }
    video.onclick = function(){
      if(video.classList.contains('h5p-multi-media-content-media-video-playing')){
        video.pause();
      }else{
        video.play();
      }
    }

    video.addEventListener('play', handlePlaying);
    video.addEventListener('ended', handleStopping);
    video.addEventListener('pause', handleStopping);

    return modal;
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
}
