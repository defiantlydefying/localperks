// A result belongs to one exact note, agreement version, and request generation.
export function createScopeGate() {
  let generation = 0;
  return {
    invalidate() {
      generation++;
    },
    start(snapshot) {
      return { ...snapshot, generation: ++generation };
    },
    current(ticket, snapshot) {
      return (
        ticket.generation === generation &&
        ticket.id === snapshot.id &&
        ticket.version === snapshot.version &&
        ticket.note === snapshot.note
      );
    },
  };
}
