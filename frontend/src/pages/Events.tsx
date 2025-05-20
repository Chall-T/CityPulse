import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';

const fetchEvents = async () => {
  const { data } = await api.get('/events');  // Replace with your correct API endpoint
  return data;
};

export default function Events() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error instanceof Error ? error.message : 'An error occurred'}</p>;

  return (
    <div>
      <h1>Events</h1>
      {data && data.length ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>No events found.</p>
      )}
    </div>
  );
}