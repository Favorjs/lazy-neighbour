// A tiny event bus so a change made on one screen (cancel, accept, pay...) shows up on every list at once.
//   { type: 'removed', id }   take this errand out of any list right now
//   { type: 'changed' }       something changed on the server: reload the lists
const listeners = new Set();

export const errandEvents = {
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
    emit(event) {
        listeners.forEach((fn) => fn(event));
    },
};
