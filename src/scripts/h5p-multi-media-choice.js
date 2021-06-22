import MultiMediaChoiceContent from './h5p-multi-media-choice-content';
import deepExtend from './h5p-multi-media-choice-util';

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
    super('multi-media-choice');

    this.contentId = contentId;
    this.extras = extras;

    // Default values are extended
    this.params = deepExtend(
      {
        question: null,
        behaviour: {
          enableSolutionsButton: true,
          enableRetry: true,
          type: 'auto',
          confirmCheckDialog: false,
          confirmRetryDialog: false,
        },
        l10n: {
          dummy1: 'default dummy text 1',
          dummy2: 'default dummy text 2',
        },
      },
      params
    );

    /**
     * Register the DOM elements with H5P.MultiMediaChoice
     */
    this.registerDomElements = () => {
      // Register task introduction text
      if (this.params.question) {
        this.introduction = document.createElement('div');
        this.introduction.innerHTML = this.params.question;
        this.setIntroduction(this.introduction);
      }

      this.content = new MultiMediaChoiceContent(params, contentId, {});

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());
      this.trigger('resize');
    };
  }
}
