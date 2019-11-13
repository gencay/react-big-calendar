import sortBy from 'lodash/sortBy'

class Event {
  constructor(data, { accessors, slotMetrics }) {
    const {
      start,
      startDate,
      end,
      endDate,
      top,
      height,
    } = slotMetrics.getRange(accessors.start(data), accessors.end(data))

    this.start = start
    this.end = end
    this.startMs = +startDate
    this.endMs = +endDate
    this.top = top
    this.height = height
    this.data = data

    this.column = 0
    this.totalColumns = 1
  }

  /**
   * The event's width without any overlap.
   */
  get _width() {
    let availableWidth = 100
    if (this.container) {
      availableWidth = 100 - (this.container._width + this.container.xOffset)
    }

    // The container event's width is determined by the maximum number of
    // events in any of its rows.
    if (this.totalColumns - this.column > 0) {
      return availableWidth / (this.totalColumns - this.column)
    }

    return availableWidth
  }

  /**
   * The event's calculated width, possibly with extra width added for
   * overlapping effect.
   */
  get width() {
    const noOverlap = this._width
    const overlap = Math.min(100, this._width)

    // Containers can always grow.
    if (!this.container && this.rows && this.rows.length > 0) {
      return overlap
    }

    // Rows can grow if they have leaves.
    if (this.container && this.rows) {
      return this.rows.length > 0 ? overlap : noOverlap
    }

    // Leaves can grow unless they're the last item in a row.
    if (this.row) {
      const { leaves } = this.row
      const index = leaves.indexOf(this)
      return index === leaves.length - 1 ? noOverlap : overlap
    }
    return noOverlap
  }

  get xOffset() {
    if (this.container) {
      return this.container._width + this.container.xOffset
    }

    return 0
  }
}

function sortByRender(events) {
  const sortedByTime = sortBy(events, ['startMs', e => -e.endMs])

  const sorted = []
  while (sortedByTime.length > 0) {
    const event = sortedByTime.shift()
    sorted.push(event)

    for (let i = 0; i < sortedByTime.length; i++) {
      const test = sortedByTime[i]

      // Still inside this event, look for next.
      if (event.endMs > test.startMs) continue

      // We've found the first event of the next event group.
      // If that event is not right next to our current event, we have to
      // move it here.
      if (i > 0) {
        const event = sortedByTime.splice(i, 1)[0]
        sorted.push(event)
      }

      // We've already found the next event group, so stop looking.
      break
    }
  }

  return sorted
}

function findContainers(eventToFind, events, minimumStartDifference) {
  const resultContainers = []
  let q = []
  let vertices = new Map()

  events.forEach(e => {
    q.push(e)
    if (!vertices.has(e)) {
      vertices.set(e, e)
    }
  })

  while (q.length > 0) {
    let container = q.shift()
    if (containsEvent(eventToFind, container, minimumStartDifference)) {
      resultContainers.push(container)
    }
    if (container.rows) {
      container.rows.forEach(r => {
        if (!vertices.has(r)) {
          q.push(r)
          vertices.set(r, r)
        }
      })
    }
  }

  return resultContainers
}

function containsEvent(event, container, minimumStartDifference) {
  return (
    (container.end > event.start && event.end > container.start) ||
    Math.abs(event.start - container.start) < minimumStartDifference
  )
}

function updateTotalColumnsOnAncestors(container, totalColumns) {
  if (container) {
    container.totalColumns = totalColumns
    if (
      container.matchingContainers &&
      container.matchingContainers.length > 0
    ) {
      container.matchingContainers.forEach(c => {
        updateTotalColumnsOnAncestors(c, totalColumns)
      })
    }
  }
}

function getStyledEvents({
  events,
  minimumStartDifference,
  slotMetrics,
  accessors,
}) {
  // Create proxy events and order them so that we don't have
  // to fiddle with z-indexes.
  const proxies = events.map(
    event => new Event(event, { slotMetrics, accessors })
  )
  const eventsInRenderOrder = sortByRender(proxies)

  // Group overlapping events, while keeping order.
  // Every event is always one of: container, row or leaf.
  // Containers can contain rows, and rows can contain leaves.
  const containerEvents = []
  for (let i = 0; i < eventsInRenderOrder.length; i++) {
    const event = eventsInRenderOrder[i]

    // Check if this event can go into a container event.
    const matchingContainers = findContainers(
      event,
      containerEvents,
      minimumStartDifference
    )

    // Couldn't find a container — that means this event is a container.
    if (!matchingContainers.length) {
      event.rows = []
      event.column = 0
      containerEvents.push(event)
      continue
    }

    // find the max column container
    let maxColumnContainer = matchingContainers[0]
    matchingContainers.forEach(c => {
      if (c.column > maxColumnContainer.column) {
        maxColumnContainer = c
      }
    })

    maxColumnContainer.rows = maxColumnContainer.rows || []
    maxColumnContainer.rows.push(event)

    event.column = maxColumnContainer.column + 1
    matchingContainers.forEach(c => {
      updateTotalColumnsOnAncestors(c, event.column + 1)
    })

    // Found a container for the event.
    event.container = maxColumnContainer
    event.matchingContainers = matchingContainers
  }

  // Return the original events, along with their styles.
  return eventsInRenderOrder.map(event => ({
    event: event.data,
    style: {
      top: event.top,
      height: event.height,
      width: event.width,
      xOffset: event.xOffset,
    },
  }))
}

export { getStyledEvents }
