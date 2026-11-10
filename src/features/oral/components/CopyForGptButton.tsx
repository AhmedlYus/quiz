// "Copy for GPT": copies a ready-made examiner prompt (built on click, so it has the latest answers).
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { useToast } from '@astryxdesign/core/Toast';
import { Copy } from 'lucide-react';
import { copyText } from '@/shared/lib/clipboard';

export function CopyForGptButton({
  build,
  label = 'Copy for GPT',
  variant = 'secondary',
  size = 'md',
  isDisabled = false,
}: {
  build: () => string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  isDisabled?: boolean;
}) {
  const showToast = useToast();
  const copy = async () => {
    const ok = await copyText(build());
    showToast({
      body: ok ? 'Prompt copied. Paste it into ChatGPT.' : 'Could not copy. Select the text and copy it by hand.',
      type: ok ? 'info' : 'error',
    });
  };
  return <Button label={label} variant={variant} size={size} isDisabled={isDisabled} icon={<Icon icon={Copy} />} clickAction={copy} />;
}
