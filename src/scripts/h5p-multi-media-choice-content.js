/** Class representing the content */
export default class MultiMediaChoiceContent {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {object} [callbacks = {}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = params;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-multi-media-choice-content');

    // Build n options
    this.options = params.options.map((option) => this.buildOption(option));
    this.optionList = this.buildOptionList(this.options);
    this.content.appendChild(this.optionList);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Build options.
   * @param {MultiMediaChoiceOption[]} options List of option objects.
   * @return {HTMLElement} List view of options.
   */
  buildOptionList(options) {
    const optionList = document.createElement('div');
    optionList.classList.add('h5p-multi-media-choice-options');
    options.forEach((option) => {
      optionList.appendChild(option); // option.getDOM();
    });
    return optionList;
  }

  /**
   * Build option.
   * @param {boolean} singleAnswer Determines if radio buttons or check boxes are used.
   * @return {MultiMediaChoiceOption} Option. //TODO: not correct
   */
  buildOption(singleAnswer) {
    const option = document.createElement('img');
    option.src =
      'https://www.startpage.com/av/proxy-image?piurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F1%2F1a%2FLipton-mug-tea.jpg%2F1200px-Lipton-mug-tea.jpg&sp=1624282543Td4130d998b3c14a93be3ce983180112f1ea9b075aaf2e7c181a0b13cbf1511c8';
    return option;
    // return MultiMediaChoiceOption();
  }

  /**
   * Counts options marked as correct
   * @returns {number} Number of options marked as correct in the editor.
   */
  getNumberOfCorrectOptions() {
    return params.options.filter((option) => option.correct).length;
  }
}
