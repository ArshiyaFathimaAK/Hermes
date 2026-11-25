import { router } from 'expo-router';

import { goBack, routes } from '@/navigation/routes';
import { Button } from '@/ui/button';
import { Message } from '@/ui/message';
import { Screen } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';
import { TextField } from '@/ui/text-field';

import { useEditProfile } from './use-edit-profile';

export function EditProfileScreen() {
  const { user, name, setName, error, busy, save } = useEditProfile();
  return (
    <Screen testID="edit-profile-screen">
      <SheetHeader title="Edit profile" onClose={goBack} />
      {user ? (
        <>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            error={error}
            autoComplete="name"
            onSubmitEditing={save}
          />
          <Button testID="save-profile" label="Save" disabled={busy} onPress={save} />
        </>
      ) : (
        <Message
          title="Sign in to edit your profile"
          action={{ label: 'Sign in', onPress: () => router.replace(routes.signIn) }}
        />
      )}
    </Screen>
  );
}
