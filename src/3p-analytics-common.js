/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** @enum {string} */
export const AMP_ANALYTICS_3P_MESSAGE_TYPE = {
  CREATIVE: 'C',
  EVENT: 'E',
  RESPONSE: 'R',
};

/** @typedef {!Object<!string, !string>} */
export let AmpAnalytics3pNewCreative;
// Example:
// {
//   "2": "ThisIsExtraData",
//   ...
// }

/** @typedef {!Object<!string,!Array<!string>>} */
export let AmpAnalytics3pEvent;
// Example:
// {
//   "2": ["viewed=true&...etc.", ... ],
//   ...
// }

/** @typedef {JsonObject} */
export let AmpAnalytics3pResponse;
// Example:
// {"status":"received","somethingElse":"42"}

/**
 * A class for holding AMP Analytics third-party vendors responses to frames.
 */
export class ResponseMap {
  /**
   * Add a response
   * @param {!string} frameType The identifier for the third-party frame that
   * responded
   * @param {!string} creativeUrl The URL of the creative being responded to
   * @param {Object} response What the response was
   */
  static add(ampDoc, frameType, creativeUrl, response) {
    const map = ampDoc.getAnchorClickListenerBinding();
    map[frameType] = map[frameType] || {};
    map[frameType][creativeUrl] = response;
  }

  /**
   * Gets the most recent response given by a certain frame to a certain
   * creative
   * @param {!string} frameType The identifier for the third-party frame
   * whose response is sought
   * @param {!string} creativeUrl The URL of the creative that the sought
   * response was about
   * @returns {?Object}
   */
  static get(ampDoc, frameType, creativeUrl) {
    const map = ampDoc.getAnchorClickListenerBinding();
    if (map[frameType] && map[frameType][creativeUrl]) {
      return map[frameType][creativeUrl];
    }
    return {};
  }

  /**
   * Remove a response, for instance if a third-party frame is being destroyed
   * @param {!string} frameType The identifier for the third-party frame
   * whose responses are to be removed
   */
  static remove(ampDoc, frameType) {
    const map = ampDoc.getAnchorClickListenerBinding();
    if (map[frameType]) {
      delete map[frameType];
    }
  }
}