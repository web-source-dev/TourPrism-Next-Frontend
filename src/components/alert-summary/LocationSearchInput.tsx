import React, { useEffect } from 'react';
import { 
  FormControl, 
  TextField, 
  Paper, 
  MenuItem,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface LocationSearchInputProps {
  value: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  } | null;
  setValue: (location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    placeId: string;
  }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({ 
  setValue, 
  value, 
  label = "Location",
  placeholder = "Search for a city...",
  required = false
}) => {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue: setInputValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: "initMap",
    debounce: 300,
    requestOptions: {
      // Limit the results to cities
      types: ['(cities)']
    }
  });

  useEffect(() => {
    if (value?.city) {
      setInputValue(value.city);
    }
  }, [value, setInputValue]);

  const handleSelect = async (description: string) => {
    setInputValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      const cityName = results[0].address_components.find(
        component => component.types.includes('locality')
      )?.long_name || description;

      const countryName = results[0].address_components.find(
        component => component.types.includes('country')
      )?.long_name || '';

      setValue({
        city: cityName,
        country: countryName,
        latitude: lat,
        longitude: lng,
        placeId: results[0].place_id,
      });
    } catch (error) {
      console.error('Error selecting location:', error);
    }
  };

  return (
    <FormControl fullWidth>
      <TextField
        label={label}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={!ready}
        fullWidth
        placeholder={placeholder}
        required={required}
        InputProps={{
          endAdornment: <LocationIcon color="action" />,
        }}
      />
      {status === 'OK' && (
        <Paper elevation={3} sx={{ mt: 1, position: 'absolute', width: '100%', zIndex: 1000 }}>
          {data.map(({ place_id, description }) => (
            <MenuItem 
              key={place_id} 
              onClick={() => handleSelect(description)}
              sx={{ cursor: 'pointer' }}
            >
              {description}
            </MenuItem>
          ))}
        </Paper>
      )}
    </FormControl>
  );
};

export default LocationSearchInput; 