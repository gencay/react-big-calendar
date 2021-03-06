import React from 'react'
import BigCalendar from 'react-big-calendar'
import ExampleControlSlot from '../ExampleControlSlot'

const events = [
  {
    id: 0,
    title: 'Board meeting',
    start: new Date(2018, 0, 29, 9, 0, 0),
    end: new Date(2018, 0, 29, 13, 0, 0),
    resourceId: 1,
  },
  {
    id: 1,
    title: 'MS training',
    allDay: true,
    start: new Date(2018, 0, 29, 14, 0, 0),
    end: new Date(2018, 0, 29, 16, 30, 0),
    resourceId: 2,
  },
  {
    id: 2,
    title: 'Team lead meeting',
    start: new Date(2018, 0, 29, 8, 30, 0),
    end: new Date(2018, 0, 29, 12, 30, 0),
    resourceId: 3,
  },
  {
    id: 11,
    title: 'Birthday Party',
    start: new Date(2018, 0, 30, 7, 0, 0),
    end: new Date(2018, 0, 30, 10, 30, 0),
    resourceId: 4,
  },
]

const resourceMap = [
  { id: 1, title: 'Board room' },
  { id: 2, title: 'Training room' },
  { id: 3, title: 'Meeting room 1' },
  { id: 4, title: 'Meeting room 2' },
]

const slotPropGetter = date => {
  const hour = date.getHours()

  if (hour < 8 || hour > 17) {
    // if slot is before/after business hours then gray out the slot
    return {
      style: {
        background: '#f3f2f1',
        height: '4.3rem',
      },
      'aria-label': 'test',
    }
  } else {
    return {
      className: 'business-slot',
      'aria-label': 'test',
    }
  }
}

let Resource = ({ localizer }) => (
  <>
    <BigCalendar
      selectable={true}
      events={events}
      slotPropGetter={slotPropGetter}
      localizer={localizer}
      defaultView={BigCalendar.Views.DAY}
      views={['day', 'work_week']}
      step={60}
      defaultDate={new Date(2018, 0, 29)}
      resources={resourceMap}
      resourceIdAccessor="id"
      resourceTitleAccessor="title"
    />
  </>
)

export default Resource
