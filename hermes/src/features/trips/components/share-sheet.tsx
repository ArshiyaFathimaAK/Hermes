import { router } from 'expo-router';

import { routes } from '@/navigation/routes';
import { BottomSheet } from '@/ui/bottom-sheet';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';

interface ShareSheetProps {
  link: { token: string; url: string };
  error?: string;
  onSend: () => void;
  onClose: () => void;
}

export function ShareSheet({ link, error, onSend, onClose }: ShareSheetProps) {
  return (
    <BottomSheet
      visible
      title="Share this trip"
      subtitle="Anyone with the link can see this trip, but not change it."
      onClose={onClose}
      footer={<Button icon="share" label="Send link" onPress={onSend} />}>
      <Text selectable variant="label">
        {link.url}
      </Text>
      {error && <Text color="danger">{error}</Text>}
      <Button
        testID="preview-share"
        variant="quiet"
        label="See what they'll see"
        onPress={() => {
          onClose();
          router.push(routes.sharedTrip(link.token));
        }}
      />
    </BottomSheet>
  );
}
