/**
 * Utility class for multi media choice
 */
export class Util {
  /**
   * Extends params
   * @param {object} params params from the editor
   * @returns {object} params with defaults included
   */
  static extendParams(params) {
    return Util.deepExtend(
      {
        question: 'No question text provided',
        behaviour: {
          enableSolutionsButton: true,
          enableRetry: true,
          questionType: 'auto',
          confirmCheckDialog: false,
          confirmRetryDialog: false,
          aspectRatio: 'auto',
          maxAlternativesPerRow: 4
        },
        l10n: {
          checkAnswerButtonText: 'Check',
          submitAnswerButtonText: 'Submit',
          checkAnswer:
            'Check the answers. The responses will be marked as correct, incorrect, or unanswered.',
          showSolutionButtonText: 'Show solution',
          showSolution: 'Show the solution. The task will be marked with its correct solution.',
          correctAnswer: 'Correct answer',
          wrongAnswer: 'Wrong answer',
          shouldCheck: 'Should have been checked',
          shouldNotCheck: 'Should not have been checked',
          noAnswer: 'Please answer before viewing the solution',
          retryText: 'Retry',
          retry: 'Retry the task. Reset all responses and start the task over again.',
          result: 'You got :num out of :total points',
          confirmCheck: {
            header: 'Finish?',
            body: 'Are you sure you want to finish?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Finish'
          },
          confirmRetry: {
            header: 'Retry?',
            body: 'Are you sure you wish to retry?',
            cancelLabel: 'Cancel',
            confirmLabel: 'Retry'
          },
          missingAltText: 'Alt text missing'
        }
      },
      params
    );
  }

  /**
   * Merge the contents of two or more objects together and return it
   * @param {object} out
   */
  static deepExtend(out) {
    out = out || {};

    for (let i = 1; i < arguments.length; i++) {
      const obj = arguments[i];

      if (!obj) {
        continue;
      }

      if (Array.isArray(obj)) {
        out = obj;
      }

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (typeof obj[key] === 'object') {
            out[key] = Util.deepExtend(out[key], obj[key]);
          }
          else {
            out[key] = obj[key];
          }
        }
      }
    }

    return out;
  }
}

/**
 * Get plain text
 *
 * @param {string} html
 */
export const htmlDecode = html => {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent;
};

/**
 * Helper for creating a dom element
 */
export const createElement = ({type, classList = [], attributes = {}}) => {
  const element = document.createElement(type);

  // Add class names
  classList.forEach(className => {
    element.classList.add(className);
  });

  // Add attributes
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  return element;
}
