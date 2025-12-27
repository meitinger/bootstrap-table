/**
 * Unit tests for EventHelper utility
 */

import { beforeEach, describe, expect, it } from 'vitest'
import EventHelper from '@/utils/events.js'
import DOMHelper from '@/utils/dom.js'

// Setup test environment
beforeEach(() => {
  // Clear document body before each test
  document.body.innerHTML = ''
})

describe('EventHelper', () => {
  describe('Basic event handling', () => {
    it('should add and trigger event listener', () => {
      const element = DOMHelper.create('<div id="test">Test</div>')
      let clicked = false

      EventHelper.on(element, 'click', () => {
        clicked = true
      })

      EventHelper.trigger(element, 'click')
      expect(clicked).toBe(true)
    })

    it('should add event listener with selector', () => {
      document.body.innerHTML = '<div id="test">Test</div>'
      let clicked = false

      EventHelper.on('#test', 'click', () => {
        clicked = true
      })

      DOMHelper.$('#test').click()
      expect(clicked).toBe(true)
    })

    it('should remove specific event listener', () => {
      const element = DOMHelper.create('<div></div>')
      let clickCount = 0

      const handler1 = () => clickCount++
      const handler2 = () => clickCount++

      EventHelper.on(element, 'click', handler1)
      EventHelper.on(element, 'click', handler2)

      EventHelper.trigger(element, 'click')
      expect(clickCount).toBe(2)

      EventHelper.off(element, 'click', handler1)
      EventHelper.trigger(element, 'click')
      expect(clickCount).toBe(3)
    })

    it('should handle multiple event types', () => {
      const element = DOMHelper.create('<div></div>')
      const events = []

      EventHelper.on(element, 'click', () => events.push('click'))
      EventHelper.on(element, 'mouseover', () => events.push('mouseover'))

      EventHelper.trigger(element, 'click')
      EventHelper.trigger(element, 'mouseover')

      expect(events).toEqual(['click', 'mouseover'])
    })
  })

  describe('Namespace support', () => {
    it('should add namespaced events', () => {
      const element = DOMHelper.create('<div></div>')
      let clicked = false

      EventHelper.on(element, 'click.namespace', () => {
        clicked = true
      })

      EventHelper.trigger(element, 'click')
      expect(clicked).toBe(true)
    })

    it('should remove events by namespace', () => {
      const element = DOMHelper.create('<div></div>')
      let ns1Count = 0
      let ns2Count = 0

      EventHelper.on(element, 'click.ns1', () => ns1Count++)
      EventHelper.on(element, 'click.ns2', () => ns2Count++)

      EventHelper.trigger(element, 'click')
      expect(ns1Count).toBe(1)
      expect(ns2Count).toBe(1)

      EventHelper.off(element, 'click.ns1')
      EventHelper.trigger(element, 'click')
      expect(ns1Count).toBe(1)
      expect(ns2Count).toBe(2)
    })

    it('should handle multiple namespaces', () => {
      const element = DOMHelper.create('<div></div>')
      let count = 0

      EventHelper.on(element, 'click.ns1.ns2', () => count++)
      EventHelper.trigger(element, 'click')
      expect(count).toBe(1)
    })

    it('should remove all events with namespace', () => {
      const element = DOMHelper.create('<div></div>')
      let clickCount = 0
      let mouseoverCount = 0

      EventHelper.on(element, 'click.ns', () => clickCount++)
      EventHelper.on(element, 'mouseover.ns', () => mouseoverCount++)
      EventHelper.on(element, 'keydown', () => {})

      EventHelper.offAll(element, 'ns')

      EventHelper.trigger(element, 'click')
      EventHelper.trigger(element, 'mouseover')

      expect(clickCount).toBe(0)
      expect(mouseoverCount).toBe(0)
    })
  })

  describe('Event delegation', () => {
    it('should delegate events to child elements', () => {
      const container = DOMHelper.create('<div><button class="btn">Click</button></div>')
      let clicked = false
      let targetText = ''

      EventHelper.delegate(container, '.btn', 'click', e => {
        clicked = true
        targetText = e.target.textContent
      })

      const button = container.querySelector('.btn')

      button.click()

      expect(clicked).toBe(true)
      expect(targetText).toBe('Click')
    })

    it('should work with dynamically added elements', () => {
      const container = DOMHelper.create('<div></div>')
      const clicks = []

      EventHelper.delegate(container, '.item', 'click', e => {
        clicks.push(e.target.textContent)
      })

      // Add button dynamically
      const button1 = DOMHelper.create('<button class="item">Item 1</button>')

      DOMHelper.append(container, button1)
      button1.click()

      // Add another button dynamically
      const button2 = DOMHelper.create('<button class="item">Item 2</button>')

      DOMHelper.append(container, button2)
      button2.click()

      expect(clicks).toEqual(['Item 1', 'Item 2'])
    })

    it('should not trigger on non-matching elements', () => {
      const container = DOMHelper.create('<div><button class="btn">Click</button><span>No match</span></div>')
      let clicked = false

      EventHelper.delegate(container, '.btn', 'click', () => {
        clicked = true
      })

      const span = container.querySelector('span')

      span.click()

      expect(clicked).toBe(false)
    })

    it('should support delegated event namespacing', () => {
      const container = DOMHelper.create('<div><button class="btn">Click</button></div>')
      let clicked = false

      EventHelper.delegate(container, '.btn', 'click.ns', () => {
        clicked = true
      })

      const button = container.querySelector('.btn')

      button.click()

      expect(clicked).toBe(true)
    })

    it('should undelegate events', () => {
      const container = DOMHelper.create('<div><button class="btn">Click</button></div>')
      let clickCount = 0

      const handler = () => clickCount++

      EventHelper.delegate(container, '.btn', 'click.ns', handler)

      const button = container.querySelector('.btn')

      button.click()
      expect(clickCount).toBe(1)

      EventHelper.undelegate(container, '.btn', 'click.ns')
      button.click()
      expect(clickCount).toBe(1)
    })
  })

  describe('Custom events and data', () => {
    it('should trigger custom events with data', () => {
      const element = DOMHelper.create('<div></div>')
      let receivedData = null

      EventHelper.on(element, 'custom', e => {
        receivedData = e.detail
      })

      const data = { message: 'Hello', value: 42 }

      EventHelper.trigger(element, 'custom', data)

      expect(receivedData).toEqual(data)
    })

    it('should support event bubbling', () => {
      const parent = DOMHelper.create('<div><span>Child</span></div>')
      const child = parent.querySelector('span')
      const events = []

      EventHelper.on(parent, 'click', () => events.push('parent'))
      EventHelper.on(child, 'click', () => events.push('child'))

      child.click()

      expect(events).toEqual(['child', 'parent'])
    })

    it('should support cancelable events', () => {
      const element = DOMHelper.create('<div></div>')
      let defaultPrevented = false

      EventHelper.on(element, 'custom', e => {
        e.preventDefault()
        defaultPrevented = e.defaultPrevented
      })

      EventHelper.trigger(element, 'custom', {}, { cancelable: true })

      expect(defaultPrevented).toBe(true)
    })
  })

  describe('Convenience methods', () => {
    it('should handle one-time events with one()', () => {
      const element = DOMHelper.create('<div></div>')
      let count = 0

      EventHelper.one(element, 'click', () => {
        count++
      })

      EventHelper.trigger(element, 'click')
      EventHelper.trigger(element, 'click')

      expect(count).toBe(1)
    })

    it('should handle hover events', () => {
      const element = DOMHelper.create('<div></div>')
      let entered = false
      let left = false

      EventHelper.hover(element, () => {
        entered = true
      }, () => {
        left = true
      })

      // Simulate mouseenter and mouseleave
      EventHelper.trigger(element, 'mouseenter')
      EventHelper.trigger(element, 'mouseleave')

      expect(entered).toBe(true)
      expect(left).toBe(true)
    })

    it('should handle hover with only enter handler', () => {
      const element = DOMHelper.create('<div></div>')
      let entered = false

      EventHelper.hover(element, () => {
        entered = true
      })

      EventHelper.trigger(element, 'mouseenter')

      expect(entered).toBe(true)
    })

    it('should handle hover with only leave handler', () => {
      const element = DOMHelper.create('<div></div>')
      let left = false

      EventHelper.hover(element, null, () => {
        left = true
      })

      EventHelper.trigger(element, 'mouseleave')

      expect(left).toBe(true)
    })
  })

  describe('Event handler management', () => {
    it('should store event handlers on element', () => {
      const element = DOMHelper.create('<div></div>')
      const handler = () => {}

      EventHelper.on(element, 'click', handler)

      const handlers = EventHelper.getHandlers(element)

      expect(handlers.click).toBeDefined()
      expect(handlers.click.length).toBe(1)
    })

    it('should support multiple handlers for same event', () => {
      const element = DOMHelper.create('<div></div>')
      let count = 0

      EventHelper.on(element, 'click', () => count++)
      EventHelper.on(element, 'click', () => count++)
      EventHelper.on(element, 'click', () => count++)

      EventHelper.trigger(element, 'click')

      expect(count).toBe(3)
    })

    it('should remove all events with offAll()', () => {
      const element = DOMHelper.create('<div></div>')
      let clickCount = 0
      let mouseoverCount = 0

      EventHelper.on(element, 'click', () => clickCount++)
      EventHelper.on(element, 'mouseover', () => mouseoverCount++)

      EventHelper.offAll(element)

      EventHelper.trigger(element, 'click')
      EventHelper.trigger(element, 'mouseover')

      expect(clickCount).toBe(0)
      expect(mouseoverCount).toBe(0)
    })

    it('should check if element has listeners', () => {
      const element = DOMHelper.create('<div></div>')

      expect(EventHelper.hasListeners(element)).toBe(false)

      EventHelper.on(element, 'click', () => {})

      expect(EventHelper.hasListeners(element)).toBe(true)
      expect(EventHelper.hasListeners(element, 'click')).toBe(true)
      expect(EventHelper.hasListeners(element, 'mouseover')).toBe(false)

      EventHelper.on(element, 'click.ns', () => {})
      expect(EventHelper.hasListeners(element, 'click', 'ns')).toBe(true)
      expect(EventHelper.hasListeners(element, 'click', 'other')).toBe(false)
    })

    it('should clean up event storage when empty', () => {
      const element = DOMHelper.create('<div></div>')
      const handler = () => {}

      EventHelper.on(element, 'click', handler)
      expect(element._eventHandlers).toBeDefined()

      EventHelper.off(element, 'click', handler)
      expect(element._eventHandlers).toBeUndefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle null/undefined elements gracefully', () => {
      expect(() => {
        EventHelper.on(null, 'click', () => {})
      }).not.toThrow()

      expect(() => {
        EventHelper.off(undefined, 'click', () => {})
      }).not.toThrow()

      expect(() => {
        EventHelper.trigger(null, 'click')
      }).not.toThrow()
    })

    it('should handle non-existent selectors gracefully', () => {
      expect(() => {
        EventHelper.on('#nonexistent', 'click', () => {})
      }).not.toThrow()

      expect(() => {
        EventHelper.off('#nonexistent', 'click', () => {})
      }).not.toThrow()
    })

    it('should handle removing non-existent handlers', () => {
      const element = DOMHelper.create('<div></div>')
      const handler = () => {}

      expect(() => {
        EventHelper.off(element, 'click', handler)
      }).not.toThrow()

      expect(() => {
        EventHelper.off(element, 'nonexistent', handler)
      }).not.toThrow()
    })

    it('should handle event without handler', () => {
      const element = DOMHelper.create('<div></div>')

      expect(() => {
        EventHelper.on(element, 'click', null)
      }).toThrow()

      expect(() => {
        EventHelper.on(element, 'click', undefined)
      }).toThrow()
    })

    it('should maintain handler execution order', () => {
      const element = DOMHelper.create('<div></div>')
      const order = []

      EventHelper.on(element, 'click', () => {
        order.push('first')
      })

      EventHelper.on(element, 'click', () => {
        order.push('second')
      })

      EventHelper.on(element, 'click', () => {
        order.push('third')
      })

      element.click()

      expect(order).toEqual(['first', 'second', 'third'])
    })

    it('should maintain correct this context', () => {
      const element = DOMHelper.create('<div></div>')
      let context = null

      EventHelper.on(element, 'click', function () {
        context = this
      })

      element.click()

      expect(context).toBe(element)
    })
  })
})
