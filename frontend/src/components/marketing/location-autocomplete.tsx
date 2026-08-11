'use client';

import { LoaderCircle, LocateFixed, MapPin } from 'lucide-react';
import { KeyboardEvent, useEffect, useId, useState } from 'react';
import {
  getLocationSuggestions,
  LocationSuggestion,
} from '@/lib/shops';

export function LocationAutocomplete({
  value,
  onChange,
  variant = 'filter',
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  variant?: 'hero' | 'filter';
  required?: boolean;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) return;
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    const timer = window.setTimeout(() => {
      getLocationSuggestions(query)
        .then((locations) => {
          if (!active) return;
          setSuggestions(locations);
          setActiveIndex(-1);
        })
        .catch(() => active && setSuggestions([]))
        .finally(() => active && setIsLoading(false));
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, value]);

  const choose = (suggestion: LocationSuggestion) => {
    onChange(suggestion.label);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const useCurrentLocation = () => {
    setIsOpen(true);
    if (!navigator.geolocation) {
      setLocationError('Current location is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            localityLanguage: 'en',
          });
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
          );
          if (!response.ok) throw new Error('Location lookup failed');
          const location = (await response.json()) as {
            locality?: string;
            city?: string;
          };
          const locality = location.locality?.trim();
          const city = location.city?.trim();
          if (!locality && !city) throw new Error('Location was not resolved');

          let label = [locality, city].filter(Boolean).join(', ');
          if (locality) {
            const servicedLocations = await getLocationSuggestions(locality);
            const exact = servicedLocations.find(
              (item) => item.locality.toLowerCase() === locality.toLowerCase(),
            );
            if (exact) label = exact.label;
            else if (city) label = city;
          }
          onChange(label);
          setIsOpen(false);
          setActiveIndex(-1);
        } catch {
          setLocationError('We could not identify your area. Try typing it instead.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it in your browser settings or type an area.'
            : error.code === error.TIMEOUT
              ? 'Finding your location took too long. Please try again.'
              : 'Your current location is unavailable. Try typing an area.',
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        Math.min(current + 1, suggestions.length - 1),
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const hero = variant === 'hero';

  return (
    <div className="relative">
      <label
        className={
          hero
            ? 'group flex min-h-16 items-center gap-3 rounded-xl px-3 transition focus-within:bg-emerald-50'
            : 'grid gap-2 text-sm font-bold text-slate-700'
        }
      >
        {hero && <MapPin className="size-5 shrink-0 text-emerald-600" />}
        <span className={hero ? 'min-w-0 flex-1 pr-44' : ''}>
          <span className={hero ? 'mb-1 block text-xs font-bold text-slate-900' : 'mb-2 block'}>
            Location
          </span>
          <input
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setLocationError('');
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing an area"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            required={required}
            className={
              hero
                ? 'w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400'
                : 'h-11 w-full rounded-xl border border-slate-300 bg-white pl-3 pr-44 font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100'
            }
          />
        </span>
      </label>

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={useCurrentLocation}
        disabled={isLocating}
        className={`group/location absolute right-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-extrabold text-emerald-700 transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-100/80 hover:text-emerald-900 active:scale-100 disabled:cursor-wait disabled:hover:scale-100 ${hero ? 'top-1/2 -translate-y-1/2' : 'bottom-3'}`}
      >
        {isLocating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4 transition-transform duration-200 group-hover/location:rotate-12 group-hover/location:scale-110" />}
        {isLocating ? 'Finding location…' : 'Use my location'}
      </button>

      {isOpen && (value.trim().length >= 2 || locationError) && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl shadow-slate-900/15"
        >
          {locationError && <p role="alert" className="bg-rose-50 px-4 py-3 text-xs font-semibold leading-5 text-rose-700">{locationError}</p>}
          {locationError && value.trim().length >= 2 && <div className="border-t border-slate-100" />}
          {value.trim().length >= 2 && (isLoading ? (
            <p className="px-4 py-3 text-sm font-medium text-slate-500">
              Finding locations…
            </p>
          ) : suggestions.length ? (
            suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.locality}-${suggestion.city}`}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                  index === activeIndex ? 'bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>
                  <strong className="block text-sm text-slate-900">
                    {suggestion.locality}
                  </strong>
                  <small className="text-xs font-medium text-slate-500">
                    {suggestion.city}
                    {suggestion.state ? `, ${suggestion.state}` : ''}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm font-medium text-slate-500">
              No serviced locations found.
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
