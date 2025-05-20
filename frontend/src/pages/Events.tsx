import React, { useEffect } from 'react';
import { useEventStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';

const Home: React.FC = () => {
  const { events, fetchEvents, loading } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  console.log("events", events);
  if (events.length === 0) { return <p className="text-center">No events found.</p>; }
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-center mb-10">Find and Discover Events</h1>

      {loading ? (
        <p className="text-center">Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Home;
