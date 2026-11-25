import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { darkColors, lightColors } from '../colors';

const pageColor = () =>
  StyleSheet.flatten(screen.getByTestId('account-screen').props.style).backgroundColor;

it('switches theme from Account, without needing to sign in', async () => {
  await renderRouter('./src/app', { initialUrl: '/account' });
  expect(pageColor()).toBe(lightColors.background);
  await fireEvent.press(screen.getByText('Dark'));
  expect(pageColor()).toBe(darkColors.background);
  await fireEvent.press(screen.getByText('Light'));
  expect(pageColor()).toBe(lightColors.background);
  await fireEvent.press(screen.getByText('Auto'));
});
