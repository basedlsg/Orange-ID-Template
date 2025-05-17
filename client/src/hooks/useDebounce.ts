import { useState, useEffect } from 'react';

/**
 * A custom hook that creates a debounced version of a value.
 * 
 * @param value - The value to be debounced
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value that updates only after the specified delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}