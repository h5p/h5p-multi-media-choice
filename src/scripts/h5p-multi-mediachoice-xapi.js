/**
 * Class handling necessary xAPI triggers and functions
 */
export class XAPIHandler {
  /**
   * @constructor
   * @param {Object} params Parameters
   * @param {MultiMediaChoice} app Instance of the main class
   * @param {MultiMediaChoiceContent} content Instance of the content class
   */
  constructor(params, app, content, question) {
    this.params = params;
    this.app = app;
    this.content = content;
    this.question = question;
  }

  /**
   * Packs the current state of the users interactivity into a
   * serializable object.
   *
   * @public
   */
  getCurrentState() {
    const state = { answers: this.content.getSelectedIndexes().toString() };
    // TODO: Update this if answers are randomized
    return state;
  }

  /**
   * Retrieves the xAPI data necessary for generating result reports
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    const xAPIEvent = this.getAnsweredXAPIEvent();
    return { statement: xAPIEvent.data.statement };
  }

  /**
   * Generates the xAPI event for answered.
   */
  getAnsweredXAPIEvent() {
    const xAPIEvent = this.app.createXAPIEventTemplate('answered');
    this.addQuestionToXAPI(xAPIEvent);
    this.addResponseToXAPI(xAPIEvent);
    return xAPIEvent;
  }

  /**
   * Adds the question to the definition part of an xAPIEvent
   *
   * @param {H5P.XAPIEvent} xAPIEvent to add a question to
   */
  addQuestionToXAPI(xAPIEvent) {
    const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
    definition.description = {
      'en-US': this.question
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'choice';

    definition.choices = this.getChoices();
    definition.correctResponsePattern = this.getCorrectOptions();
  }

  /**
   * Adds the response to the definition part of an xAPIEvent
   *
   * @param {H5P.XAPIEvent} xAPIEvent to add a response to
   */
  addResponseToXAPI(xAPIEvent) {
    const maxScore = this.app.getMaxScore();
    const score = this.app.getScore();
    const success = (100 * score / maxScore) >= this.params.behaviour.passPercentage;

    xAPIEvent.setScoredResult(score, maxScore, this.app, true, success);

    let response = '';
    const selectedIndexes = this.content.getSelectedIndexes();
    for (let i = 0; i < selectedIndexes.length; i++) {
      if (response !== '') {
        // [,] is the required deliminator between multiple answers
        response += '[,]';
      }
      response += selectedIndexes[i]; // TODO: Update if randomized answers are added
    }
    xAPIEvent.data.statement.result.response = response;
  }

  /**
   * Creates a list of choice objects with id and description
   * @returns {Object[]} List of options the player could choose from
   */
  getChoices() { // TODO: Update if answers are randomized
    const choices = [];
    const displayedOptions = this.content.getOptions();
    for (let i = 0; i < this.params.options.length; i++) {
      const description = displayedOptions[i].getDescription();
      choices[i] = {
        id: i + '',
        description: {
          'en-US': description
        }
      };
    }
    return choices;
  }

  /**
   * Creates a list of correct response patterns for an xAPI event
   * @returns {String[]} Correct response patterns for the task
   */
  getCorrectOptions() { // TODO: Update if answers are randomized
    const correctOptions = [];
    for (let i = 0; i < this.params.options.length; i++) {
      const option = this.params.options[i];
      if (option.correct) {
        // If the user is only allowed to choose one answer
        if (this.content.isSingleAnswer) {
          correctOptions.push('' + i);
        }
        // If the user can pick several answers
        else {
          if (correctOptions.length) {
            // [,] is the deliminator required between all the
            // options the user has to choose to get a full score
            correctOptions[0] += '[,]';
          }
          else {
            correctOptions.push('');
          }
          correctOptions[0] += i;
        }
      }
    }
    return correctOptions;
  }
}
