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

import {AmpAdNetworkDoubleclickImpl} from '../amp-ad-network-doubleclick-impl';
import {createElementWithAttributes} from '../../../../src/dom';
import {Services} from '../../../../src/services';
import {utf8Encode} from '../../../../src/utils/bytes';
import {Xhr} from '../../../../src/service/xhr-impl';
// Need the following side-effect import because in actual production code,
// Fast Fetch impls are always loaded via an AmpAd tag, which means AmpAd is
// always available for them. However, when we test an impl in isolation,
// AmpAd is not loaded already, so we need to load it separately.
import '../../../amp-ad/0.1/amp-ad';

/**
 * We're allowing external resources because otherwise using realWin causes
 * strange behavior with iframes, as it doesn't load resources that we
 * normally load in prod.
 * We're turning on ampAdCss because using realWin means that we don't
 * inherit that CSS from the parent page anymore.
 */
const realWinConfig = {
  amp: {
    extensions: ['amp-ad-network-doubleclick-impl'],
  },
  ampAdCss: true,
  allowExternalResources: true,
};


describes.realWin('DoubleClick Fast Fetch Fluid', realWinConfig, env => {
  let impl;
  let multiSizeImpl;
  let element;
  let multiSizeElement;
  let sandbox;
  let xhrMock;

  const initialSize = {width: 0, height: 0};

  beforeEach(() => {
    sandbox = env.sandbox;
    env.win.AMP_MODE.test = true;
    const doc = env.win.document;
    // TODO(a4a-cam@): This is necessary in the short term, until A4A is
    // smarter about host document styling.  The issue is that it needs to
    // inherit the AMP runtime style element in order for shadow DOM-enclosed
    // elements to behave properly.  So we have to set up a minimal one here.
    const ampStyle = doc.createElement('style');
    ampStyle.setAttribute('amp-runtime', 'scratch-fortesting');
    doc.head.appendChild(ampStyle);
    doc.body.appendChild(createElementWithAttributes(
        env.win.document, 'div', {
          'style': 'width: 1px; height: 1000px;',
        }));
    element = createElementWithAttributes(env.win.document, 'amp-ad', {
      'height': 'fluid',
      'type': 'doubleclick',
    });
    doc.body.appendChild(element);
    impl = new AmpAdNetworkDoubleclickImpl(element, env.win.document, env.win);
    multiSizeElement = createElementWithAttributes(env.win.document, 'amp-ad', {
      'height': 'fluid',
      'type': 'doubleclick',
      'data-multi-size': '300x200,150x50',
    });
    doc.body.appendChild(multiSizeElement);
    multiSizeImpl = new AmpAdNetworkDoubleclickImpl(
        multiSizeElement, env.win.document, env.win);
    xhrMock = sandbox.stub(Xhr.prototype, 'fetchJson');

    const getLayout = () => 'fluid';
    impl.getLayout = getLayout;
    multiSizeImpl.getLayout = getLayout;
    impl.experimentalNonAmpCreativeRenderMethod_ = 'safeframe';
  });

  afterEach(() => {
    sandbox.restore();
    impl = null;
    xhrMock = null;
  });

  it('should be fluid enabled', () => {
    impl.buildCallback();
    expect(impl.isFluid_).to.be.true;
  });

  it('should have a supported layout', () => {
    expect(impl.isLayoutSupported()).to.be.true;
  });

  it('should have creativeSize of 0x0', () => {
    impl.buildCallback();
    expect(impl.creativeSize).to.deep.equal(initialSize);
  });

  it('should NOT load delayed impression amp-pixels', () => {
    const fireDelayedImpressionsSpy =
        sandbox.spy(impl, 'fireDelayedImpressions');
    const size = impl.extractSize({
      get(name) {
        switch (name) {
          case 'X-AmpImps':
            return 'https://a.com?a=b,https://b.com?c=d';
          case 'X-AmpRSImps':
            return 'https://c.com?e=f,https://d.com?g=h';
          default:
            return undefined;
        }
      },
      has(name) {
        return !!this.get(name);
      },
    });
    expect(size.width).to.equal(initialSize.width);
    expect(size.height).to.equal(initialSize.height);
    expect(fireDelayedImpressionsSpy).to.not.be.calledOnce;
  });

  it('should contain sz=320x50 in ad request by default', () => {
    impl.buildCallback();
    impl.initiateAdRequest();
    return impl.adPromise_.then(() => {
      expect(impl.adUrl_).to.be.ok;
      expect(impl.adUrl_).to.match(/[&?]sz=320x50/);
    });
  });

  it('should contain mulitple sizes in ad request', () => {
    multiSizeImpl.buildCallback();
    multiSizeImpl.initiateAdRequest();
    return multiSizeImpl.adPromise_.then(() => {
      expect(multiSizeImpl.adUrl_).to.be.ok;
      expect(multiSizeImpl.adUrl_).to.match(
          /[&?]sz=320x50%7C300x200%7C150x50/);
    });
  });

  it('should setup postMessage listeners', () => {
    impl.buildCallback();
    const getXdomainCreativeFrameMessageListenersSpy =
        sandbox.spy(impl, 'getXdomainCreativeFrameMessageListeners');
    return utf8Encode('foo').then(creative => {
      impl.sentinel = 'sentinel';
      return impl.renderViaNameAttrOfXOriginIframe_(creative).then(() => {
        expect(getXdomainCreativeFrameMessageListenersSpy).to.be.calledOnce;
      });
    });
  });

  it('should send initial postMessage', () => {
    impl.buildCallback();
    const connectFluidMessagingChannelSpy =
        sandbox.spy(impl, 'connectFluidMessagingChannel');
    return utf8Encode('foo').then(creative => {
      impl.sentinel = 'sentinel';
      impl.adPromise_ = Promise.resolve();
      impl.creativeBody_ = creative;
      return impl.layoutCallback().then(() => {
        expect(connectFluidMessagingChannelSpy).to.be.calledOnce;
      });
    });
  });

  it('should have an iframe child with initial size 0x0', () => {
    impl.buildCallback();
    return utf8Encode('foo').then(creative => {
      impl.sentinel = 'sentinel';
      impl.adPromise_ = Promise.resolve();
      impl.creativeBody_ = creative;
      return impl.layoutCallback().then(() => {
        const styleString = impl.iframe.getAttribute('style');
        expect(styleString).to.match(/width: 0px/);
        expect(styleString).to.match(/height: 0px/);
      });
    });
  });


  it('should style iframe with width/height 100% and pos: relative', () => {
    impl.buildCallback();
    const rawCreative = `
        <script>
        parent./*OK*/postMessage(
            JSON.stringify(/** @type {!JsonObject} */ ({
              type: 'creative_geometry_update',
              sentinel: 'sentinel',
              width: '1px',
              height: '1px',
            })), '*');
        </script>`;
    return utf8Encode(rawCreative).then(creative => {
      impl.sentinel = 'sentinel';
      impl.initiateAdRequest();
      return impl.adPromise_.then(() => {
        impl.creativeBody_ = creative;
        return impl.layoutCallback().then(() => {
          const styleString = impl.iframe.getAttribute('style');
          expect(styleString).to.match(/width: 100%/);
          expect(styleString).to.match(/height: 100%/);
          expect(styleString).to.match(/position: relative/);
        });
      });
    });
  });

  it('should fire delayed impression ping', () => {
    impl.buildCallback();
    const rawCreative = `
        <script>
        parent./*OK*/postMessage(
            JSON.stringify(/** @type {!JsonObject} */ ({
              type: 'creative_geometry_update',
              sentinel: 'sentinel',
            })), '*');
        parent./*OK*/postMessage(
            JSON.stringify(/** @type {!JsonObject} */ ({
              type: 'creative_geometry_update',
              sentinel: 'sentinel',
              p: '{"width":"1px","height":"1px"}',
            })), '*');
        </script>`;
    const fireDelayedImpressionsSpy =
        sandbox.spy(impl, 'fireDelayedImpressions');
    impl.fluidImpressionUrl_ = 'http://www.foo.bar/';
    impl.attemptChangeSize = () => Promise.resolve();
    return utf8Encode(rawCreative).then(creative => {
      impl.sentinel = 'sentinel';
      impl.initiateAdRequest();
      return impl.adPromise_.then(() => {
        impl.creativeBody_ = creative;
        return impl.layoutCallback().then(() => {
          expect(fireDelayedImpressionsSpy).to.be.calledOnce;
        });
      });
    });
  });

});
