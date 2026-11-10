// Loading and error placeholders for pages and panels.
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <Center>
      <Spinner size="lg" label={label} />
    </Center>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<Icon icon="error" size="lg" color="error" />}
      title="That did not work"
      description={error.message}
      actions={onRetry ? <Button label="Try again" variant="primary" onClick={onRetry} /> : undefined}
    />
  );
}
