import { userWithProfile } from '../rows';

const user = { id: 'u1', name: 'Old', email: 'a@example.com' };

it('takes the name from the profile and keeps the rest of the user', () => {
  expect(userWithProfile(user, { id: 'u1', display_name: 'New Name' })).toEqual({
    id: 'u1',
    name: 'New Name',
    email: 'a@example.com',
  });
});
