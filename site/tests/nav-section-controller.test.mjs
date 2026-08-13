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
  const rectangles = new Map([
    ['about', { top: -500, bottom: 20 }],
    ['work', { top: 76, bottom: 860 }],
    ['code', { top: 960, bottom: 1640 }],
    ['contact', { top: 1800, bottom: 2600 }],
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
    document: {
      defaultView: { IntersectionObserver: Observer },
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

  fixture.observers[0].callback([
    { target: fixture.hosts.get('about'), isIntersecting: true },
    { target: fixture.hosts.get('work'), isIntersecting: true },
  ]);
  assert.equal(fixture.links[1].classList.contains('is-active'), true);
  assert.equal(fixture.links[1].getAttribute('aria-current'), 'location');
  assert.equal(fixture.links[0].getAttribute('aria-current'), null);

  cleanup();
  assert.equal(fixture.observers[0].disconnected, true);
});
