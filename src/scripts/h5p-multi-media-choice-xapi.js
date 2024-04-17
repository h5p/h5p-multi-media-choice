import { htmlDecode } from './h5p-multi-media-choice-util';

/**
 * Packs the current state of the users interactivity into a serializable object.
 *
 * @param {Number[]} selectedIndexes Array of indexes of selected options
 */
export function getCurrentState(selectedIndexes) {
  return { answers: selectedIndexes };
}

/**
 * Retrieves the xAPI data necessary for generating result reports
 *
 * @param {object} app Multi media choice object
 * @param {string} question Question text
 * @param {object[]} options Array containing the option objects
 * @param {number} score Score given for answering the question
 * @param {number} maxScore Maximum possible score that can be achieved for the question
 * @param {boolean} success True if the task was passed according to passPercentage
 */
export function getXAPIData(app, question, options, score, maxScore, success) {
  const xAPIEvent = getAnsweredXAPIEvent(app, question, options, score, maxScore, success);
  return { statement: xAPIEvent.data.statement };
}

/**
 * Generates the xAPI event for answered.
 *
 * @param {object} app Multi media choice object
 * @param {string} question Question text
 * @param {object[]} options Array containing the option objects
 * @param {number} score Score given for answering the question
 * @param {number} maxScore Maximum possible score that can be achieved for the question
 * @param {boolean} success True if the task was passed according to passPercentage
 */
export function getAnsweredXAPIEvent(app, question, options, score, maxScore, success) {
  const xAPIEvent = app.createXAPIEventTemplate('answered');

  addQuestionToXAPI(xAPIEvent, options, question);
  xAPIEvent.setScoredResult(score, maxScore, app, true, success);
  addResponseToXAPI(xAPIEvent, options);
  return xAPIEvent;
}

/**
 * Adds the question to the definition part of an xAPIEvent
 *
 * @param {H5P.XAPIEvent} xAPIEvent to add a question to
 * @param {object[]} options Array containing the option objects
 * @param {string} question Question text
 */
function addQuestionToXAPI(xAPIEvent, options, question) {
  const definition = xAPIEvent.getVerifiedStatementValue(['object', 'definition']);
  definition.description = {
    'en-US': question,
  };
  definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
  definition.interactionType = 'choice';

  definition.choices = getChoices(options);
  definition.correctResponsesPattern = [getCorrectOptions(options)];
}

/**
 * Adds the response to the definition part of an xAPIEvent
 *
 * @param {H5P.XAPIEvent} xAPIEvent to add a response to
 * @param {object[]} options Array containing the option objects
 */
function addResponseToXAPI(xAPIEvent, options) {
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
 *
 * @param {object[]} options Array containing the option objects
 * @returns {object[]} List of options the player could choose from
 */
function getChoices(options) {
  return options.map((option, index) => ({
    id: index.toString(),
    description: {
      'en-US': htmlDecode(option.getDescription())
    }
  }));
}

/**
 * Creates a list of correct response patterns for an xAPI event
 *
 * @param {object[]} options Array containing the option objects
 * @returns {String[]} Correct response patterns for the task
 */
function getCorrectOptions(options) {
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
