import React from 'react';
import { useEventStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventFilters from '../components/EventFilters';

const EventPage: React.FC = () => {
  const { events, loading } = useEventStore();


  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* Title */}
      <p className="gritty-text text-green-600 text-2xl font-bold font-body">
        Gritty Text!
      </p>
      <h1 className="text-4xl font-bold text-center mb-10">Find and Discover Events</h1>

      <EventFilters />

      {loading ? (
        <p className="text-center">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-center">No events found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.filter(event => event.status === 'ACTIVE').map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
};

export default EventPage;
