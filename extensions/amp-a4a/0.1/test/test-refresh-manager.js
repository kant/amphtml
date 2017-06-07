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

import {
  RefreshManager,
  DATA_ATTR_NAME,
} from '../refresh-manager';
import * as sinon from 'sinon';

function getTestElement() {
  const div = window.document.createElement('div');
  div.setAttribute('style', 'width:1px; height:1px;');
  // This is the only network currently opted-in.
  div.setAttribute('type', 'doubleclick');
  div.setAttribute(DATA_ATTR_NAME, '35');
  return div;
}


describe('refresh-manager', () => {
  let clock;
  let mockA4a;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    mockA4a = {
      win: window,
      element: getTestElement(),
      refresh: () => {},
    };
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  it('should call getPublisherSpecifiedRefreshInterval_', () => {
    const getPublisherSpecifiedRefreshIntervalSpy = sandbox.spy(
        RefreshManager.prototype, 'getPublisherSpecifiedRefreshInterval_');
    const refreshManager = new RefreshManager(mockA4a);
    expect(getPublisherSpecifiedRefreshIntervalSpy).to.be.calledOnce;
    expect(refreshManager.refreshInterval_).to.equal('35');
  });

  it('should call getConfiguration_', () => {
    const getConfigurationSpy = sandbox.spy(
        RefreshManager.prototype, 'getConfiguration_');
    const refreshManager = new RefreshManager(mockA4a);
    expect(getConfigurationSpy).to.be.calledOnce;
    expect(refreshManager.config_).to.not.be.null;
  });

  it('should be eligible for refresh', () => {
    const refreshManager = new RefreshManager(mockA4a);
    expect(refreshManager.isEligibleForRefresh()).to.be.true;
  });

  it('should NOT be eligible for refresh', () => {
    mockA4a.element.removeAttribute(DATA_ATTR_NAME);
    const refreshManager = new RefreshManager(mockA4a);
    expect(refreshManager.isEligibleForRefresh()).to.be.false;
  });

  it('should execute the refresh event correctly', () => {
    // Attach element to DOM, as is necessary for request ampdoc.
    window.document.body.appendChild(mockA4a.element);
    const refreshSpy = sandbox.spy(mockA4a, 'refresh');
    const refreshManager = new RefreshManager(mockA4a);
    // So the test doesn't hang for the required minimum 30s interval, or the
    // 1s ActiveView visibility definition.
    refreshManager.config_ = {
      refreshInterval: 0,
      visiblePercentageMin: 0,
      continuousTimeMin: 0,
    };
    return refreshManager.initiateRefreshCycle().then(() => {
      expect(refreshSpy).to.be.calledOnce;
    });
  });
});
