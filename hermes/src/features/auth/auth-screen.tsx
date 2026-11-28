import { StyleSheet, View } from 'react-native';

import { config } from '@/config';
import { goBack, routes } from '@/navigation/routes';
import { spacing } from '@/theme';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';

import { useAuthForm } from './use-auth-form';

const COPY = {
  'sign-in': {
    title: 'Sign in',
    submit: 'Sign in',
    switchLabel: 'New here? Create an account',
    switchRoute: routes.signUp,
  },
  'sign-up': {
    title: 'Create an account',
    submit: 'Create account',
    switchLabel: 'Have an account? Sign in',
    switchRoute: routes.signIn,
  },
} as const;

export function AuthScreen({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const form = useAuthForm(mode);
  const copy = COPY[mode];

  return (
    <Screen testID={`${mode}-screen`}>
      <SheetHeader
        title={copy.title}
        subtitle="Save things to trips and share your plans."
        onClose={goBack}
      />
      <View style={styles.fields}>
        {mode === 'sign-up' && (
          <TextField
            label="Name"
            value={form.values.name}
            error={form.errors.name}
            onChangeText={(text) => form.setField('name', text)}
            autoComplete="name"
          />
        )}
        <TextField
          label="Email"
          value={form.values.email}
          error={form.errors.email}
          onChangeText={(text) => form.setField('email', text)}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextField
          label="Password"
          value={form.values.password}
          error={form.errors.password}
          onChangeText={(text) => form.setField('password', text)}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          secureTextEntry
          onSubmitEditing={form.submit}
        />
      </View>
      {form.formError && <Text color="danger">{form.formError}</Text>}
      <View style={styles.actions}>
        <Button testID="auth-submit" label={copy.submit} disabled={form.busy} onPress={form.submit} />
        <Button
          testID="continue-as-guest"
          variant="quiet"
          label="Continue without an account"
          onPress={form.continueAsGuest}
        />
        {config.demoSignIn && (
          <Button
            testID="demo-sign-in"
            variant="soft"
            label="Skip with a demo account"
            disabled={form.busy}
            onPress={form.signInAsDemo}
          />
        )}
        <Button
          variant="plain"
          label={copy.switchLabel}
          onPress={() => form.switchTo(copy.switchRoute)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  actions: { gap: spacing.md },
});
