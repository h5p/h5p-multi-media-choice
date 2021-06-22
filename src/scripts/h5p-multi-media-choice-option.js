export default class Option {
  /**
   * @constructor
   * @param {boolean} params.behaviour.singleAnswer Should the option be radio (or checkbox)
   * @param {Media} params.media The image or video to display
   * @param {Number} params.optionNr Which option this is. Is used for radio value
   */
  constructor(params) {

    //Display media and either radio or checkbox
    this.optionContainer = document.createElement('div');
    this.selectable = document.createElement('input');
    if(this.params.behaviour.singleAnswer) {
      this.selectable.setAttribute('type', 'radio');
      this.selectable.setAttribute('name', 'options');
      this.selectable.setAttribute('value', params.optionNr);
    }
    else {
      this.selectable.setAttribute('type', 'checkbox');
      //selectable.setAttribute('onClick', () =>{this.toggleSelect()});
    }

    optionContainer.appendChild(selectable);

    //TODO add Media to the optionContainer

  }

  /**
   * Returns the DOM of this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.optionContainer;
  }

  /**
   * Returns the current state of the option
   * @returns {boolean} true if selected, false if not.
   */
  isSelected() {
    return this.selectable.checked;
  }

  select() {
    this.selected = true;
    this.selectable.checked = true;
  }

  unselect() {
    this.selected = false;
    this.selectable.checked = false;
  }
}


// REMOVE BELOW

/**
 * @returns How many answers are marked as correct in the editor.
 */
 let numCorrect = () => {
  correct = 0;
    //Loop through the options in the editor
    for (let i = 0; i < params.options.length; i++) {
    let option = params.options[i];
    //Make sure tips and feedback exsists
    option.tipsAndFeedback = option.tipsAndFeedback || {};
    if(params.options[i].correct)
      correct++;
    }
    return correct;
  }
  let noCorrectChoices = (numCorrect <= 0);
  /**
   * Determines the task type, indicating whether the answers should be
   * radio buttons or checkboxes.
   * @returns true if the options should be displayed as radiobuttons,
   * @returns false if they should be displayed as checkboxes
   */
  this.params.behaviour.singleAnswer = () => {
    if(this.params.type === 'auto')
      return numCorrect === 1;
    return params.behaviour.type === 'single';
  }
