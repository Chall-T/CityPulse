import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { CalendarDays, MapPin } from 'lucide-react';
import { formatEventDate } from '../utils/date'
import { apiClient } from '../lib/ApiClient';


export const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  return (
    <Link
      to={`/events/${event.id}`}
      className="bg-white rounded-2xl shadow p-4 flex flex-col hover:shadow-lg transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer overflow-hidden max-w-xs min-h-[320px]"
      draggable={false}
    >
      {/* Image wrapper with aspect ratio */}
      <div className="relative w-full aspect-[16/10] mb-4 rounded-xl overflow-hidden">
        <img
          src={event?.imageUrl ? `${apiClient.baseURL}${event.imageUrl}` : '/missingEvent.png'}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {Array.isArray(event.categories) && event.categories.length > 0 && (
        <div className="text-sm text-gray-500 mb-2 flex gap-2 flex-wrap overflow-hidden">
          {event.categories.map((category) => (
            <span key={category.id} className="truncate max-w-full whitespace-nowrap">
              {category.emoji} {category.name}
            </span>
          ))}
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate" title={event.title}>
        {event.title}
      </h3>

      <div className="text-sm text-gray-600 flex items-center gap-2 mb-1 truncate">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">
          {formatEventDate(new Date(event.dateTime))}
        </span>
      </div>

      <div className="text-sm text-gray-600 flex items-center gap-2 truncate">
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{event.location}</span>
      </div>
    </Link>
  );
};
