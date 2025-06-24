import React, { useEffect, useState } from 'react';
import { useClusterStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventMapFilters from '../components/EventMapFilters';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EventPage: React.FC = () => {
    const { clusters, fetchClusters, loading } = useClusterStore();
    const [coords, setCoords] = useState<LatLngExpression>([52.510885, 13.3989367]); // Berlin
    const [zoom, setZoom] = useState(10);

    const handleBoundsFetch = (bounds: any, newZoom: number) => {
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();

        fetchClusters({
            minLat: southWest.lat,
            maxLat: northEast.lat,
            minLng: southWest.lng,
            maxLng: northEast.lng,
            zoom: newZoom,
        });
    };

    const MapEvents = () => {
        useMapEvents({
            moveend: (e) => {
                const map = e.target;
                const bounds = map.getBounds();
                const newZoom = map.getZoom();
                setZoom(newZoom);
                handleBoundsFetch(bounds, newZoom);
            },
        });
        return null;
    };

    useEffect(() => {
        // Initial fetch on mount
        fetchClusters({
            minLat: 1.0,
            maxLat: 100.0,
            minLng: 1.0,
            maxLng: 100.0,
            categoryIds: undefined,
            zoom,
        });
    }, []);

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
                    className="h-full w-full rounded-lg"
                >
                    <MapEvents />

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MarkerClusterGroup>
                        {clusters.map((cluster) => (
                            <Marker
                                key={cluster.geohash}
                                position={[cluster.lat, cluster.lng] as LatLngExpression}
                            >
                                <Popup>
                                    <div className="max-w-xs">
                                        <h3 className="font-bold">{cluster.count}</h3>
                                        {/* You can render a mini EventCard here if you want */}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </main>
    );
};

export default EventPage;
