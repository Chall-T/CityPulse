import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useEventStore, useFilterStore, useMapPinsStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventMapFilters from '../components/EventMapFilters';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { LatLngExpression, Map as LeafletMap } from 'leaflet';
import type { Event, MapPin } from '../types/event';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';

const EventPage: React.FC = () => {
    const { pins, fetchPins, loading } = useMapPinsStore();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const { fetchEventById } = useEventStore();

    const [displayPins, setDisplayPins] = useState<MapPin[]>([]);
    const prevPinsRef = useRef<MapPin[]>([]);

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

    const pinsAreEqual = (a: MapPin[], b: MapPin[]) => {
        if (a.length !== b.length) return false;

        const sortById = (arr: MapPin[]) => [...arr].sort((x, y) => x.id.localeCompare(y.id));

        const sortedA = sortById(a);
        const sortedB = sortById(b);

        return sortedA.every((pin, i) =>
            pin.id === sortedB[i].id &&
            pin.lat === sortedB[i].lat &&
            pin.lng === sortedB[i].lng
        );
    };
    useEffect(() => {
        const validPins = pins.filter(
            (pin) => typeof pin.lat === 'number' && typeof pin.lng === 'number'
        );

        if (!pinsAreEqual(validPins, prevPinsRef.current)) {
            prevPinsRef.current = validPins;
            setDisplayPins(validPins);
        }
    }, [pins]);

    const MapEvents = () => {
        const map = useMap();

        // Ensure only one fetch happens on mount
        const moveEndSkipped = useRef(false);

        useMapEvents({
            moveend: () => {
                // Skip the first moveend after initial fetch
                if (didInitialFetch.current && moveEndSkipped.current) {
                    const bounds = map.getBounds();
                    const zoom = map.getZoom();
                    setZoom(zoom);
                    handleBoundsFetch(bounds, zoom);
                } else {
                    moveEndSkipped.current = true;
                }
            },
        });

        useEffect(() => {
            if (!didInitialFetch.current && map && map.getBounds) {
                const bounds = map.getBounds();
                const currentZoom = map.getZoom();
                setZoom(currentZoom);
                handleBoundsFetch(bounds, currentZoom);
                didInitialFetch.current = true;
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

    const memoizedMarkers = useMemo(() => (
        <MarkerClusterGroup>
            {displayPins.map((pin) => (
                <Marker
                    key={pin.id}
                    position={[pin.lat, pin.lng] as LatLngExpression}
                    eventHandlers={{
                        click: async () => {
                            const event = await fetchEventById(pin.id);
                            if (event) {
                                setSelectedEvent(event);
                            }
                        },
                    }}
                />
            ))}
        </MarkerClusterGroup>
    ), [displayPins]);


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
                    minZoom={9}
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

                    {memoizedMarkers}

                    {selectedEvent && selectedEvent.lat && selectedEvent.lng && (
                        <Popup
                            position={[selectedEvent.lat, selectedEvent.lng] as LatLngExpression}
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
