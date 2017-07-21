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

/** @const {string} */
export const AMP_ANALYTICS_3P_EVENT_MESSAGES_TYPE = 'AA3pEvtMsgs';

/** @typedef {!Object<!string,!Array<!string>>} */
export let AmpAnalytics3pEventMap;
// Maps transport IDs to events. For instance if the creative with transport
// ID 2 sends "hi" and "hello" and the creative with transport ID 3 sends
// "goodbye" then the map would look like:
// Example:
// {
//   "2": ["hi", "hello" ],
//   "3": ["goodbye" ]
// }

