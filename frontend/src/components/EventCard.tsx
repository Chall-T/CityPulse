import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { CalendarDays, MapPin } from 'lucide-react';

export const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <Link
      to={`/events/${event.id}`}
      className="bg-white rounded-2xl shadow p-4 flex flex-col hover:shadow-lg transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      draggable={false}
    >
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-48 object-cover rounded-xl mb-4 pointer-events-none select-none"
          draggable={false}
        />
      )}

      <div className="text-sm text-gray-500 mb-2 flex gap-2 flex-wrap">
        {event.categories.map((category) => (
          <span key={category.id}>
            {category.emoji} {category.name}
          </span>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {event.title}
      </h3>

      <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4" />
        {new Date(event.dateTime).toLocaleString()}
      </div>

      <div className="text-sm text-gray-600 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {event.location}
      </div>
    </Link>
  );
};
