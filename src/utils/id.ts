// RFC 4122 v4 UUID for row ids created on the device (logged_items.id is a uuid).
// Math.random is fine here: these only need to be unique, not unguessable.
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
