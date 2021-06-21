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

    this.params = params;
    this.contentId = contentId;
    this.extras = extras;

    /**
     * Register the DOM elements with H5P.MultiMediaChoice
     */
    this.registerDomElements = () => {
      // Register task introduction text
      if (this.params.taskDescription && this.params.taskDescription !== '') {
        this.introduction = document.createElement('div');
        this.introduction.innerHTML = this.params.taskDescription;
        this.setIntroduction(this.introduction);
      }
    };
  }
}
