import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface GoogleMapViewProps {
  lat: number;
  lng: number;
  height?: string;
  width?: string;
}

const containerStyle = (height: string, width: string) => ({
  width,
  height,
});

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ lat, lng, height = '300px', width = '100%' }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyC-B6bmF23ye6nqImQVQAHTXEOhLeWu0-M', // Replace with env var in production
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle(height, width)}
      center={{ lat, lng }}
      zoom={16}
      mapTypeId={google.maps.MapTypeId.HYBRID}
    >
      <Marker position={{ lat, lng }} />
    </GoogleMap>
  ) : (
    <div>Loading map...</div>
  );
};

export default GoogleMapView;
