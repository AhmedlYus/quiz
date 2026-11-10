// "Source: …" line under an explanation or model answer, with an info tip explaining page numbers.
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { InfoTip } from '@astryxdesign/core/InfoTip';
import { useCourse } from '../session/SessionContext';
import { explainSource } from '../course/sources';

export function SourceLine({ source, topic }: { source: string; topic?: string | null }) {
  const course = useCourse();
  if (!source) return null;
  const info = explainSource(source, topic, course);
  const tip = info
    ? [
        ...info.notes.map((n) => `${n.label} ${n.text}`),
        info.editions.length ? `${info.editions.length === 1 ? 'Edition' : 'Editions'}: ${info.editions.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : null;
  return (
    <HStack gap={1} align="center">
      <Text type="supporting">Source: {source}</Text>
      {tip && <InfoTip content={tip} label="About these page numbers" />}
    </HStack>
  );
}
