import React, { useEffect, useRef, useState } from 'react';
import { useEventStore, useFilterStore, useMapPinsStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventMapFilters from '../components/EventMapFilters';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { LatLngExpression, Map as LeafletMap } from 'leaflet';
import type { Event } from '../types/event';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

const EventPage: React.FC = () => {
    const { pins, fetchPins, loading } = useMapPinsStore();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const { fetchEventById } = useEventStore();

    const { selectedCategories, dateRange } = useFilterStore();

    const [coords, setCoords] = useState<LatLngExpression>([52.510885, 13.3989367]); // Berlin
    const [zoom, setZoom] = useState(12);
    const mapRef = useRef<LeafletMap | null>(null);
    // console.log(pins)

    const handleBoundsFetch = (bounds: any, newZoom: number) => {
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();
        fetchPins({
            minLat: southWest.lat,
            maxLat: northEast.lat,
            minLng: southWest.lng,
            maxLng: northEast.lng,
            categoryIds: selectedCategories,
            fromDate: dateRange.from,
            toDate: dateRange.to,

        });
    };

    const didInitialFetch = useRef(false);

    const MapEvents = () => {
        const map = useMap();

        useMapEvents({
            moveend: () => {
                // Only fetch on moves after initial fetch
                if (didInitialFetch.current) {
                    const bounds = map.getBounds();
                    const zoom = map.getZoom();
                    setZoom(zoom);
                    handleBoundsFetch(bounds, zoom);
                }
            },
        });

        useEffect(() => {
            if (!didInitialFetch.current && map && map.getBounds) {
                const bounds = map.getBounds();
                const currentZoom = map.getZoom();
                setZoom(currentZoom);
                handleBoundsFetch(bounds, currentZoom);
                didInitialFetch.current = true; // mark initial fetch done
            }
        }, [map]);

        return null;
    };
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (selectedEvent) {
            map.scrollWheelZoom.disable();
            map.dragging.disable();
            map.doubleClickZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            map.touchZoom.disable();
        } else {
            map.scrollWheelZoom.enable();
            map.dragging.enable();
            map.doubleClickZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            map.touchZoom.enable();
        }
    }, [selectedEvent]);

    return (
        <main className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="text-4xl font-bold text-center mb-10">Find and Discover Events</h1>

            <EventMapFilters />

            <div className="h-[600px] w-full mt-10 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                        <div className="text-lg font-semibold text-gray-600">Loading events...</div>
                    </div>
                )}

                <MapContainer
                    center={coords}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    maxBounds={[[51.0, 10.0], [55.0, 15.5]]} // Berlin area bounds
                    minZoom={7}
                    className="h-full w-full rounded-lg"
                    ref={(mapInstance) => {
                        if (mapInstance) {
                            mapRef.current = mapInstance;
                        }
                    }}
                >


                    <MapEvents />

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MarkerClusterGroup>
                        {pins.map((pin) => (
                            <Marker
                                key={pin.id}
                                position={[pin.lat, pin.lng] as LatLngExpression}
                                eventHandlers={{
                                    click: async () => {
                                        const event = await fetchEventById(pin.id);
                                        if (event) {
                                            // If coords are missing, try to get them from the pin
                                            if (!event.coords || !event.coords.coordinates) {
                                                const fallbackPin = pins.find(p => p.id === pin.id);
                                                if (fallbackPin) {
                                                    event.coords = {
                                                        type: 'Point',
                                                        coordinates: [fallbackPin.lng, fallbackPin.lat],
                                                    };
                                                }
                                            }
                                            setSelectedEvent(event);
                                        }
                                    }
                                }}

                            />
                        ))}
                    </MarkerClusterGroup>
                    {selectedEvent && selectedEvent.coords && selectedEvent.coords.coordinates && (
                        <Popup
                            position={[selectedEvent.coords?.coordinates[1], selectedEvent.coords?.coordinates[0]] as LatLngExpression}
                            eventHandlers={{
                                remove: () => setSelectedEvent(null), // When popup is closed
                            }}
                        >
                            <div className="max-w-xs">
                                <EventCard event={selectedEvent} />
                            </div>
                        </Popup>
                    )}
                </MapContainer>
            </div>
        </main>
    );
};

export default EventPage;
