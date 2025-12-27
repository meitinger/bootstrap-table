/**
 * Bootstrap Table Event System Utility Library
 * Provides jQuery-style event handling APIs using native JavaScript
 */

import DOMHelper from './dom.js'

class EventHelper {
  /**
   * Add event listener with namespace support
   * @param {Element|string} element - DOM element or selector
   * @param {string} event - Event name with optional namespace (e.g., "click.namespace")
   * @param {Function} handler - Event handler function
   * @param {Object|boolean} [options] - Event options or useCapture flag
   * @returns {Element} The element itself
   */
  static on (element, event, handler, options = {}) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element) return element

    // Validate handler
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function')
    }

    // Parse event type and namespace
    const [eventType, namespace] = event.split('.')

    // Initialize event handlers storage if not exists
    if (!element._eventHandlers) {
      element._eventHandlers = {}
    }
    if (!element._eventHandlers[eventType]) {
      element._eventHandlers[eventType] = []
    }

    // Create wrapped handler to maintain context
    const wrappedHandler = e => {
      handler.call(element, e)
    }

    // Store handler info
    element._eventHandlers[eventType].push({
      handler,
      namespace,
      wrappedHandler,
      original: handler
    })

    // Add native event listener
    element.addEventListener(eventType, wrappedHandler, options)
    return element
  }

  /**
   * Remove event listener with namespace support
   * @param {Element|string} element - DOM element or selector
   * @param {string} event - Event name with optional namespace
   * @param {Function} [handler] - Specific handler to remove (optional)
   * @returns {Element} The element itself
   */
  static off (element, event, handler) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element || !element._eventHandlers) return element

    const [eventType, namespace] = event.split('.')

    if (element._eventHandlers[eventType]) {
      // Find handlers to remove
      const handlersToRemove = element._eventHandlers[eventType].filter(info => {
        const matches =
          (!namespace || info.namespace === namespace) &&
          (!handler || info.original === handler)

        if (matches && info.wrappedHandler) {
          element.removeEventListener(eventType, info.wrappedHandler)
        }

        return matches
      })

      // Remove handlers from array
      element._eventHandlers[eventType] = element._eventHandlers[eventType].filter(info =>
        !handlersToRemove.includes(info)
      )

      // Clean up empty event type arrays
      if (element._eventHandlers[eventType].length === 0) {
        delete element._eventHandlers[eventType]
      }

      // Clean up if no handlers left at all
      if (Object.keys(element._eventHandlers).length === 0) {
        delete element._eventHandlers
      }
    }

    return element
  }

  /**
   * Trigger custom event
   * @param {Element|string} element - DOM element or selector
   * @param {string} event - Event name
   * @param {*} [detail] - Custom data to pass with event
   * @param {Object} [options] - Event options
   * @returns {Element} The element itself
   */
  static trigger (element, event, detail = {}, options = {}) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element) return element

    const customEvent = new CustomEvent(event, {
      detail,
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false
    })

    element.dispatchEvent(customEvent)
    return element
  }

  /**
   * Event delegation - add event listener that works for dynamically added elements
   * @param {Element|string} parent - Parent element or selector
   * @param {string} selector - Child element selector
   * @param {string} event - Event name with optional namespace
   * @param {Function} handler - Event handler function
   * @param {Object|boolean} [options] - Event options or useCapture flag
   * @returns {Element} The parent element
   */
  static delegate (parent, selector, event, handler, options = {}) {
    if (typeof parent === 'string') parent = DOMHelper.$(parent)
    if (!parent) return parent

    const [eventType, namespace] = event.split('.')
    const eventWithNamespace = namespace ? `${eventType}.${namespace}` : eventType

    // Delegate handler that checks if target matches selector
    const delegateHandler = e => {
      const target = e.target.closest(selector)

      if (target && parent.contains(target)) {
        // Set the correct context and pass target as this
        handler.call(target, e)
      }
    }

    // Store delegate handler for potential removal
    if (!parent._delegates) {
      parent._delegates = []
    }
    parent._delegates.push({
      selector,
      eventType,
      namespace,
      handler: delegateHandler
    })

    // Add event listener to parent
    return this.on(parent, eventWithNamespace, delegateHandler, options)
  }

  /**
   * Remove delegated event listener
   * @param {Element|string} parent - Parent element or selector
   * @param {string} selector - Child element selector
   * @param {string} event - Event name with optional namespace
   * @param {Function} [handler] - Specific handler to remove
   * @returns {Element} The parent element
   */
  static undelegate (parent, selector, event, handler) {
    if (typeof parent === 'string') parent = DOMHelper.$(parent)
    if (!parent || !parent._delegates) return parent

    const [eventType, namespace] = event.split('.')
    const eventWithNamespace = namespace ? `${eventType}.${namespace}` : eventType

    // Find and remove matching delegate
    parent._delegates = parent._delegates.filter(delegate => {
      const matches =
        delegate.selector === selector &&
        delegate.eventType === eventType &&
        (!namespace || delegate.namespace === namespace) &&
        (!handler || delegate.handler === handler)

      if (matches) {
        this.off(parent, eventWithNamespace, delegate.handler)
      }

      return !matches
    })

    return parent
  }

  /**
   * One-time event listener - automatically removed after first trigger
   * @param {Element|string} element - DOM element or selector
   * @param {string} event - Event name with optional namespace
   * @param {Function} handler - Event handler function
   * @param {Object|boolean} [options] - Event options or useCapture flag
   * @returns {Element} The element itself
   */
  static one (element, event, handler, options = {}) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element) return element

    const oneTimeHandler = e => {
      // Remove the listener before executing
      this.off(element, event, oneTimeHandler)
      // Execute the original handler
      handler.call(element, e)
    }

    return this.on(element, event, oneTimeHandler, options)
  }

  /**
   * Hover event convenience method - enter and leave handlers
   * @param {Element|string} element - DOM element or selector
   * @param {Function} enterHandler - Mouse enter handler
   * @param {Function} leaveHandler - Mouse leave handler
   * @returns {Element} The element itself
   */
  static hover (element, enterHandler, leaveHandler) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element) return element

    // Use mouseenter and mouseleave which don't bubble
    if (enterHandler) {
      this.on(element, 'mouseenter', enterHandler)
    }
    if (leaveHandler) {
      this.on(element, 'mouseleave', leaveHandler)
    }

    return element
  }

  /**
   * Get all event handlers for an element (for debugging)
   * @param {Element|string} element - DOM element or selector
   * @returns {Object} Event handlers object
   */
  static getHandlers (element) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element) return {}

    return element._eventHandlers || {}
  }

  /**
   * Remove all event listeners from an element
   * @param {Element|string} element - DOM element or selector
   * @param {string} [namespace] - Optional namespace to filter by
   * @returns {Element} The element itself
   */
  static offAll (element, namespace) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element || !element._eventHandlers) return element

    // Get all event types
    const eventTypes = Object.keys(element._eventHandlers)

    eventTypes.forEach(eventType => {
      // Remove all handlers for this event type
      const handlersToRemove = element._eventHandlers[eventType].filter(info => !namespace || info.namespace === namespace)

      handlersToRemove.forEach(info => {
        if (info.wrappedHandler) {
          element.removeEventListener(eventType, info.wrappedHandler)
        }
      })

      // Update handlers array
      element._eventHandlers[eventType] = element._eventHandlers[eventType].filter(info => namespace && info.namespace !== namespace)

      // Clean up if no handlers left
      if (element._eventHandlers[eventType].length === 0) {
        delete element._eventHandlers[eventType]
      }
    })

    // Clean up if no handlers left at all
    if (Object.keys(element._eventHandlers).length === 0) {
      delete element._eventHandlers
    }

    return element
  }

  /**
   * Check if element has event listeners
   * @param {Element|string} element - DOM element or selector
   * @param {string} [event] - Optional event type to check
   * @param {string} [namespace] - Optional namespace to check
   * @returns {boolean} Whether the element has listeners
   */
  static hasListeners (element, event, namespace) {
    if (typeof element === 'string') element = DOMHelper.$(element)
    if (!element || !element._eventHandlers) return false

    if (!event) {
      return Object.keys(element._eventHandlers).length > 0
    }

    const [eventType] = event.split('.')

    if (!element._eventHandlers[eventType]) return false

    if (!namespace) {
      return element._eventHandlers[eventType].length > 0
    }

    return element._eventHandlers[eventType].some(info => info.namespace === namespace)
  }
}

// Export EventHelper class
export default EventHelper
