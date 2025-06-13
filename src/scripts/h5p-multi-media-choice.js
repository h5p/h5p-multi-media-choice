import MultiMediaChoiceContent from './h5p-multi-media-choice-content';

import { createElement, Util } from './h5p-multi-media-choice-util';
import { getCurrentState, getXAPIData, getAnsweredXAPIEvent } from './h5p-multi-media-choice-xapi';

/**
 * Class for H5P Multi Media Choice.
 */
export default class MultiMediaChoice extends H5P.Question {
  /**
   * @constructor
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('multi-media-choice', { theme: true });

    this.contentId = contentId;
    this.extras = extras;
    this.answerState = extras.previousState && extras.previousState.answers ? extras.previousState.answers : [];

    // Default values are extended
    this.params = Util.extendParams(params);

    // Override subcontent params
    if (Array.isArray(this.params?.options)) {
      for (const option of this.params.options) {
        if (option.media?.library?.includes('H5P.Audio')) {
          option.media.params.fitToWrapper = false; // VA-523: prevent warped button
        }
      }
    }

    this.content = new MultiMediaChoiceContent(
      this.params,
      contentId,
      {
        triggerResize: () => {
          this.trigger('resize');
        },
        triggerInteracted: () => {
          this.triggerXAPI('interacted');
        }
      },
      this.answerState
    );

    this.registerDomElements = () => {
      // Register task media
      if (this.params.media && this.params.media.type && this.params.media.type.library) {
        const media = this.params.media.type;
        // Register task image
        if (media.library.includes('H5P.Image')) {
          if (media.params.file) {
            this.setImage(media.params.file.path, {
              disableImageZooming: params.media.disableImageZooming || false,
              alt: media.params.alt,
              title: media.params.title,
              expandImage: media.params.expandImage,
              minimizeImage: media.params.minimizeImage
            });
          }
        }
        else if (media.library.includes('H5P.Video')) {
          if (media.params.sources) {
            // Register task video
            this.setVideo(media);
          }
        }
        else if (media.library.includes('H5P.Audio')) {
          if (media.params.files) {
            // Register task audio
            this.setAudio(media);
          }
        }
      }

      // Register task introduction text
      if (this.params.question) {
        this.introduction = createElement({type: 'div', attributes: {id: `h5p-media-choice${contentId}`}});
        this.introduction.innerHTML = this.params.question;
        this.setIntroduction(this.introduction);
      }

      this.content.setMultiMediaOptionsPlaceholder(this.getLibraryFilePath('assets'));
      this.setContent(this.content.getDOM()); // Register content with H5P.Question
      this.addButtons();

      this.on('resize', () => this.content.setColumnProperties());
    };

    /**
     * Get latest score
     * @return {number} latest score
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
     */
    this.getScore = () => {
      return this.content.getScore();
    };

    /**
     * Get maximum possible score
     * @return {number} Score necessary for mastering
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
     */

    this.getMaxScore = () => {
      return this.content.getMaxScore();
    };

    /**
     * Let H5P.Question read the specified text
     * @param {string} text Text to read
     */
    this.handleRead = text => {
      this.read(text);
    };

    /**
     * Check answer.
     * @param {object} params Parameters.
     * @param {boolean} [params.skipXAPI] If true, do not send xAPI event.
     */
    this.checkAnswer = (params = {}) => {
      this.content.disableSelectables();

      const score = this.getScore();
      const maxScore = this.getMaxScore();
      const textScore = H5P.Question.determineOverallFeedback(
        this.params.overallFeedback,
        score / maxScore
      );

      this.setFeedback(textScore, score, maxScore, this.params.l10n.result);

      if (this.params.behaviour.enableSolutionsButton && score !== maxScore) {
        this.showButton('show-solution');
      }

      if (this.params.behaviour.enableRetry && score !== maxScore) {
        this.showButton('try-again');
      }

      this.hideButton('check-answer');

      this.content.showSelectedSolutions();

      if (!params.skipXAPI) {
        this.trigger(
          getAnsweredXAPIEvent(
            this,
            this.params.question,
            this.content.getOptions(),
            this.getScore(),
            this.getMaxScore(),
            this.content.isPassed()
          )
        );
      }
    };

    /**
     * Show solutions.
     * @param {boolean} shouldRespectRequireInputFlag Determine from where this function being called
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
     */
    this.showSolutions = (shouldRespectRequireInputFlag = false) => {
      this.hideButton('check-answer');
      this.hideButton('show-solution');

      const showSolutions = () => {
        this.content.showSelectedSolutions();
        this.content.showUnselectedSolutions();
        this.content.focusUnselectedSolution();
      };

      // require input for solution behavior is not valid if the request is originated
      // from compound content type
      if (shouldRespectRequireInputFlag) {
        if (this.params.behaviour.showSolutionsRequiresInput
          && !this.content.isAnyAnswerSelected()) {
          // Require answer before solution can be viewed
          this.updateFeedbackContent(this.params.l10n.noAnswer);
          this.handleRead(this.params.l10n.noAnswer);
        }
        else {
          showSolutions();
        }
      }
      else {
        // Call from outside (from compound content type)
        this.checkAnswer({ skipXAPI: true });
        this.hideButton('show-solution');
        this.hideButton('try-again');

        showSolutions();
      }

      this.trigger('resize');
    };

    /**
     * Resets options, buttons and solutions
     *
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
     */
    this.resetTask = () => {
      this.content.resetSelections();
      this.showButton('check-answer');
      this.hideButton('try-again');
      this.hideButton('show-solution');
      this.content.hideSolutions();
      this.removeFeedback();
    };

    /**
     * Get answer given
     * Contract.
     *
     * @return {boolean} True, if all answers have been given.
     * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
     */
    this.getAnswerGiven = () => {
      return this.content.getAnswerGiven();
    };
  }

  /**
   * Add the buttons that are passed to H5P.Question
   */
  addButtons() {
    if (this.params.behaviour.enableCheckButton == undefined || this.params.behaviour.enableCheckButton) {
      this.addButton(
        'check-answer',
        this.params.l10n.checkAnswerButtonText,
        () => {
          this.checkAnswer();
        },
        true,
        { 'aria-label': this.params.l10n.checkAnswer },
        {
          confirmationDialog: {
            enable: this.params.behaviour.confirmCheckDialog,
            l10n: this.params.l10n.confirmCheck,
            instance: this
          },
          contentData: this.extras,
          textIfSubmitting: this.params.l10n.submitAnswerButtonText,
          icon: 'check',
        }
      );
    }
    this.addButton(
      'show-solution',
      this.params.l10n.showSolutionButtonText,
      () => {
        this.showSolutions(true);
      },
      false,
      { 'aria-label': this.params.l10n.showSolution },
      {
        styleType: 'secondary',
        icon: 'show-results'        
      }
    );

    this.addButton(
      'try-again',
      this.params.l10n.retryText,
      () => {
        this.resetTask();
      },
      false,
      { 'aria-label': this.params.l10n.retry },
      {
        confirmationDialog: {
          enable: this.params.behaviour.confirmRetryDialog,
          l10n: this.params.l10n.confirmRetry,
          instance: this
        },
        icon: 'retry',
        styleType: 'secondary'
      }
    );
  }

  /**
   * Packs the current state of the users interactivity into a
   * serializable object.
   * @public
   */
  getCurrentState() {
    return getCurrentState(this.content.getSelectedIndexes());
  }

  /**
   * Retrieves the xAPI data necessary for generating result reports
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return getXAPIData(
      this,
      this.params.question,
      this.content.getOptions(),
      this.getScore(),
      this.getMaxScore(),
      this.content.isPassed()
    );
  }

  /**
   * Retrieve title of the content type
   */
  getTitle() {
    return H5P.createTitle((this.extras && this.extras.metadata && this.extras.metadata.title) ? this.extras.metadata.title : 'Image Choice');
  }
}
