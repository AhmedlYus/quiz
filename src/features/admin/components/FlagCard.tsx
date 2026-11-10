// One flagged question with its flags (anonymous) and, while flags are open, the resolve form.
import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { QueryCode } from '@/shared/editor';
import { useToast } from '@astryxdesign/core/Toast';
import { Check, Flag } from 'lucide-react';
import { plural } from '@/shared/lib/format';
import { SourceLine } from '@/shared/ui/SourceLine';
import { resolveFlags, type FlaggedQuestion } from '../api';

const LETTERS = 'ABCDEFGH';
const date = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function reasonSummary(q: FlaggedQuestion) {
  const counts = new Map<string, number>();
  for (const f of q.flags) if (f.status === 'open') counts.set(f.reasonLabel, (counts.get(f.reasonLabel) ?? 0) + 1);
  return [...counts].map(([reason, n]) => `${reason}${n > 1 ? ` ×${n}` : ''}`).join(' · ');
}

export function FlagCard({ q, onResolved }: { q: FlaggedQuestion; onResolved: () => void }) {
  const showToast = useToast();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState<'fixed' | 'kept' | null>(null);

  async function resolve(status: 'fixed' | 'kept') {
    setBusy(status);
    try {
      await resolveFlags(q.questionId, status, reply);
      showToast({ body: status === 'fixed' ? 'Marked as fixed. The flaggers will be told.' : 'Kept as is. The flaggers will be told.' });
      onResolved();
    } catch (e) {
      showToast({ body: (e as Error).message, type: 'error' });
      setBusy(null);
    }
  }

  const summary = reasonSummary(q);
  return (
    <Card padding={5}>
      <VStack gap={3}>
        <HStack gap={2} justify="between" align="center" wrap="wrap">
          <Token label={q.topic || 'Removed question'} size="sm" color="blue" />
          <Token
            label={q.open ? plural(q.open, 'open flag') : 'resolved'}
            size="sm"
            color={q.open ? 'orange' : 'green'}
            icon={<Icon icon={Flag} />}
          />
        </HStack>
        <Heading level={3}>{q.question || `(${q.questionId} is no longer in the question bank)`}</Heading>
        {q.code && <QueryCode code={q.code} />}
        {q.inBank && (
          <List>
            {q.options.map((o, i) => (
              <ListItem
                key={i}
                startContent={<Token label={LETTERS[i] ?? String(i + 1)} size="sm" color={i === q.answer ? 'green' : 'gray'} />}
                label={<Text weight={i === q.answer ? 'semibold' : 'normal'}>{o}</Text>}
                endContent={i === q.answer ? <Icon icon={Check} size="sm" color="success" label="Marked answer" /> : undefined}
              />
            ))}
          </List>
        )}
        {q.explanation && <Text color="secondary">{q.explanation}</Text>}
        {q.source && <SourceLine source={q.source} topic={q.topic} />}
        {summary && <Text weight="semibold">{summary}</Text>}
        <List hasDividers>
          {q.flags.map((f, i) => (
            <ListItem
              key={i}
              label={<Text weight={f.status === 'open' ? 'semibold' : 'normal'}>{`${f.reasonLabel} · ${date(f.at)}${f.status === 'open' ? '' : ` · ${f.status}`}`}</Text>}
              description={
                <VStack gap={1}>
                  <Text color={f.note ? 'primary' : 'secondary'}>{f.note || 'No notes'}</Text>
                  {f.reply && <Text type="supporting">Reply: {f.reply}</Text>}
                </VStack>
              }
            />
          ))}
        </List>
        {q.open > 0 && (
          <VStack gap={3}>
            <TextInput label="Reply to the flaggers" isOptional value={reply} onChange={setReply} placeholder="Optional; they see it in their notice" />
            <HStack gap={2} wrap="wrap">
              <Button label="Fixed" variant="primary" icon={<Icon icon={Check} />} isLoading={busy === 'fixed'} isDisabled={busy === 'kept'} onClick={() => void resolve('fixed')} />
              <Button label="Keep as is" isLoading={busy === 'kept'} isDisabled={busy === 'fixed'} onClick={() => void resolve('kept')} />
            </HStack>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}
