/**
 * Class handling necessary xAPI triggers and functions
 */
export class XAPIHandler {
  /**
   * Packs the current state of the users interactivity into a
   * serializable object.
   *
   * @public
   */
  getCurrentState(selectedIndexes) {
    const state = { answers: selectedIndexes.toString() };
    // TODO: Update this if answers are randomized
    return state;
  }

  /**
   * Retrieves the xAPI data necessary for generating result reports
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData(app, question, options, score, maxScore, success) {
    const xAPIEvent = this.getAnsweredXAPIEvent(
      app,
      question,
      options,
      score,
      maxScore,
      success
    );
    return { statement: xAPIEvent.data.statement };
  }

  /**
   * Generates the xAPI event for answered.
   */
  getAnsweredXAPIEvent(app, question, options, score, maxScore, success) {
    const xAPIEvent = app.createXAPIEventTemplate('answered');

    this.addQuestionToXAPI(xAPIEvent, options, question);
    xAPIEvent.setScoredResult(score, maxScore, app, true, success);
    this.addResponseToXAPI(xAPIEvent, options);
    return xAPIEvent;
  }

  /**
   * Adds the question to the definition part of an xAPIEvent
   *
   * @param {H5P.XAPIEvent} xAPIEvent to add a question to
   */
  addQuestionToXAPI(xAPIEvent, options, question) {
    const definition = xAPIEvent.getVerifiedStatementValue([
      'object',
      'definition',
    ]);
    definition.description = {
      'en-US': question,
    };
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'choice';

    definition.choices = this.getChoices(options);
    definition.correctResponsePattern = this.getCorrectOptions(options);
  }

  /**
   * Adds the response to the definition part of an xAPIEvent
   * @param {H5P.XAPIEvent} xAPIEvent to add a response to
   */
  addResponseToXAPI(xAPIEvent, options) {
    xAPIEvent.data.statement.result.response = options
      .flatMap(function (option, index) {
        if (option.isSelected()) {
          return index;
        }
        return [];
      })
      .toString()
      .replaceAll(',', '[,]'); // [,] is the deliminator used when multiple answers are corect
  }

  /**
   * Creates a list of choice objects with id and description
   * @returns {Object[]} List of options the player could choose from
   */
  getChoices(options) {
    return options.map((option, index) => ({
      id: index.toString(),
      description: {
        'en-US': option.getDescription(),
      },
    }));
  }

  /**
   * Creates a list of correct response patterns for an xAPI event
   * @returns {String[]} Correct response patterns for the task
   */
  getCorrectOptions(options) {
    return options
      .flatMap(function (option, index) {
        if (option.isCorrect()) {
          return index;
        }
        return [];
      })
      .toString()
      .replaceAll(',', '[,]'); // [,] is the deliminator used when multiple answers are corect
  }
}
