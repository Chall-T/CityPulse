import React, { useEffect, useState } from 'react';
import { useEventStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { LatLngExpression } from 'leaflet';

const EventPage: React.FC = () => {
    const { events, fetchEvents, loading } = useEventStore();
    const [coords, setCoords] = useState<LatLngExpression>([52.510885, 13.3989367]); // Berlin
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return (
        <main className="max-w-7xl mx-auto px-4 py-10">
            {/* Title */}
            <h1 className="text-4xl font-bold text-center mb-10">Find and Discover Events</h1>

            <EventFilters />

            {/* Map */}
            <div className="h-[600px] w-full mt-10">
                <MapContainer
                    center={coords as LatLngExpression}
                    zoom={10}
                    scrollWheelZoom={true}
                    className="h-full w-full rounded-lg"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MarkerClusterGroup>
                        {/* {events.map((event) => (
              <Marker
                key={event.id}
                position={[event.latitude, event.longitude] as LatLngExpression}
              >
                <Popup>
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                  </div>
                </Popup>
              </Marker>
            ))} */}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </main>
    );
};

export default EventPage;
