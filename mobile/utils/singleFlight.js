import { useCallback, useRef } from 'react';

/**
 * Lets a handler run once at a time. While it is running (and for a short cooldown after), more taps are
 * ignored. Works for async handlers (waits for the promise) and plain ones (just the cooldown), so a
 * double tap can never fire the same action twice.
 */
export const useSingleFlight = (handler, cooldownMs = 500) => {
    const busy = useRef(false);
    const latest = useRef(handler);
    latest.current = handler;

    return useCallback(
        (...args) => {
            if (busy.current) return undefined;
            busy.current = true;

            let result;
            try {
                result = latest.current?.(...args);
            } catch (error) {
                busy.current = false;
                throw error;
            }

            Promise.resolve(result)
                .catch(() => {})
                .finally(() => {
                    setTimeout(() => {
                        busy.current = false;
                    }, cooldownMs);
                });

            return result;
        },
        [cooldownMs]
    );
};

// A fresh key per user action. The server uses it to recognise a repeat of the same request.
export const newIdempotencyKey = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 8)}`;
