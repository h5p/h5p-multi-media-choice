/**
 * Class for H5P MultiMediaChoice.
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
  }
 }