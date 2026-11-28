/** An image source for a photo address, or nothing when there's no photo. */
export const photoSource = (address?: string) => (address ? { uri: address } : undefined);
