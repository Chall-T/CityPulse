import React, { useRef, useCallback } from 'react';
import { useEventStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventFilters from '../components/EventFilters';

const EventPage: React.FC = () => {
  const { events, loading, nextCursor, fetchEvents } = useEventStore();

  const observerRef = useRef<IntersectionObserver | null>(null);

  // infinite scroll using IntersectionObserver
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          fetchEvents(); // load next page
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, nextCursor, fetchEvents]
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-center mb-10">
        Find and Discover Events
      </h1>

      <EventFilters />

      {loading && events.length === 0 ? (
        <p className="text-center">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-center">No events found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events
            .filter((event) => event.status === 'ACTIVE')
            .map((event, index) => {
              if (index === events.length - 1) {
                // Attach observer to the last event card
                return (
                  <div key={event.id} ref={lastEventElementRef}>
                    <EventCard event={event} />
                  </div>
                );
              } else {
                return <EventCard key={event.id} event={event} />;
              }
            })}
        </div>
      )}

      {loading && events.length > 0 && (
        <p className="text-center mt-4">Loading more events...</p>
      )}
    </main>
  );
};

export default EventPage;
