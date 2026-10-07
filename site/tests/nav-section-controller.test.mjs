import assert from 'node:assert/strict';
import test from 'node:test';

import { bindSectionNavigation, selectCurrentSection } from '../src/scripts/nav-section-controller.mjs';

function entry(id, top, bottom, isIntersecting = true) {
  return {
    target: { id },
    isIntersecting,
    boundingClientRect: { top, bottom },
  };
}

test('selectCurrentSection chooses the visible chapter nearest the sticky navigation line', () => {
  const current = selectCurrentSection([
    entry('about', -600, 36),
    entry('work', 76, 840),
    entry('code', 960, 1640),
  ]);

  assert.equal(current, 'work');
});

test('selectCurrentSection compares each visible chapter start instead of its full interval', () => {
  const current = selectCurrentSection([
    entry('about', -500, 500),
    entry('work', 82, 900),
  ]);

  assert.equal(current, 'work');
});

test('selectCurrentSection uses the previous chapter when no valid visible host remains', () => {
  const current = selectCurrentSection([
    entry('archive', 70, 160),
    entry('code', 100, 180, false),
    { target: { id: 'contact' }, isIntersecting: true, boundingClientRect: { top: '80', bottom: 120 } },
    null,
  ], 'code');

  assert.equal(current, 'code');
});

function createLink(id, current) {
  const attributes = new Map(current ? [['aria-current', current]] : []);
  const classes = new Set();
  return {
    href: `/#${id}`,
    classList: {
      contains: (name) => classes.has(name),
      toggle: (name, active) => active ? classes.add(name) : classes.delete(name),
    },
    getAttribute: (name) => name === 'href' ? `/#${id}` : attributes.get(name) ?? null,
    removeAttribute: (name) => attributes.delete(name),
    setAttribute: (name, value) => attributes.set(name, value),
  };
}

function createDocument() {
  const observers = [];
  const events = new Map();
  const removedEvents = [];
  const animationFrames = new Map();
  const cancelledFrames = [];
  let nextFrame = 1;
  const rectangles = new Map([
    ['about', { top: 0, bottom: 800 }],
    ['work', { top: 900, bottom: 1700 }],
    ['code', { top: 1800, bottom: 2600 }],
    ['contact', { top: 2700, bottom: 3500 }],
  ]);
  const hosts = new Map(['about', 'work', 'code', 'contact'].map((id) => [id, {
    id,
    getBoundingClientRect: () => rectangles.get(id),
  }]));
  const links = ['about', 'work', 'code', 'contact'].map((id) => createLink(id));

  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observers.push(this);
    }

    observe() {}

    disconnect() {
      this.disconnected = true;
    }
  }

  return {
    observers,
    links,
    hosts,
    rectangles,
    events,
    removedEvents,
    animationFrames,
    cancelledFrames,
    runNextFrame() {
      const [id, callback] = animationFrames.entries().next().value;
      animationFrames.delete(id);
      callback();
    },
    document: {
      defaultView: {
        IntersectionObserver: Observer,
        innerHeight: 900,
        addEventListener: (type, listener) => events.set(type, listener),
        removeEventListener: (type, listener) => {
          if (events.get(type) === listener) events.delete(type);
          removedEvents.push(type);
        },
        requestAnimationFrame: (callback) => {
          const id = nextFrame++;
          animationFrames.set(id, callback);
          return id;
        },
        cancelAnimationFrame: (id) => {
          cancelledFrames.push(id);
          animationFrames.delete(id);
        },
      },
      getElementById: (id) => hosts.get(id) ?? null,
      querySelectorAll: (selector) => selector === '[data-nav-section]' ? links : [],
    },
  };
}

test('bindSectionNavigation shares one observer, marks location, and disconnects on cleanup', () => {
  const fixture = createDocument();
  const cleanup = bindSectionNavigation(fixture.document);

  bindSectionNavigation(fixture.document);
  assert.equal(fixture.observers.length, 1);

  fixture.rectangles.set('about', { top: -500, bottom: -20 });
  fixture.rectangles.set('work', { top: 76, bottom: 860 });
  fixture.observers[0].callback([{ target: fixture.hosts.get('work'), isIntersecting: true }]);
  fixture.runNextFrame();
  assert.equal(fixture.links[1].classList.contains('is-active'), true);
  assert.equal(fixture.links[1].getAttribute('aria-current'), 'location');
  assert.equal(fixture.links[0].getAttribute('aria-current'), null);

  cleanup();
  assert.equal(fixture.observers[0].disconnected, true);
});

test('general project panel is observed and announced for English and Portuguese chapter links', () => {
  for (const prefix of ['', '/pt-br']) {
    const fixture = createDocument();
    const projectLink = createLink('projects');
    const readAttribute = projectLink.getAttribute;
    projectLink.getAttribute = (name) => name === 'href' ? `${prefix}/#projects` : readAttribute(name);
    fixture.links.splice(1, 0, projectLink);
    fixture.rectangles.set('about', { top: -600, bottom: -20 });
    fixture.hosts.set('projects', { id: 'projects', getBoundingClientRect: () => ({ top: 80, bottom: 890 }) });
    const cleanup = bindSectionNavigation(fixture.document);
    fixture.runNextFrame();
    assert.equal(projectLink.getAttribute('aria-current'), 'location');
    assert.equal(projectLink.classList.contains('is-active'), true);
    assert.equal(fixture.links[0].getAttribute('aria-current'), null);
    assert.equal(selectCurrentSection([], 'projects'), 'projects');
    cleanup();
  }
});

test('scroll updates a visible chapter start with one coalesced animation frame and cleans up', () => {
  const fixture = createDocument();
  const cleanup = bindSectionNavigation(fixture.document);

  fixture.runNextFrame();
  fixture.rectangles.set('about', { top: -500, bottom: -20 });
  fixture.rectangles.set('work', { top: 76, bottom: 860 });
  const onScroll = fixture.events.get('scroll');
  onScroll();
  onScroll();
  onScroll();

  assert.equal(fixture.animationFrames.size, 1);
  fixture.runNextFrame();
  assert.equal(fixture.links[1].getAttribute('aria-current'), 'location');

  onScroll();
  cleanup();
  assert.equal(fixture.animationFrames.size, 0);
  assert.equal(fixture.cancelledFrames.length, 1);
  assert.equal(fixture.events.has('scroll'), false);
  assert.deepEqual(fixture.removedEvents, ['scroll']);
  assert.equal(fixture.observers[0].disconnected, true);
});

test('cleanup seals stale observer callbacks without scheduling frames or changing navigation', () => {
  const fixture = createDocument();
  const cleanup = bindSectionNavigation(fixture.document);

  fixture.runNextFrame();
  const staleCallback = fixture.observers[0].callback;
  const before = fixture.links.map((link) => ({
    active: link.classList.contains('is-active'),
    current: link.getAttribute('aria-current'),
  }));

  cleanup();
  cleanup();
  staleCallback([]);

  assert.equal(fixture.animationFrames.size, 0);
  assert.deepEqual(fixture.links.map((link) => ({
    active: link.classList.contains('is-active'),
    current: link.getAttribute('aria-current'),
  })), before);
  assert.deepEqual(fixture.removedEvents, ['scroll']);
  assert.equal(fixture.observers[0].disconnected, true);
});
