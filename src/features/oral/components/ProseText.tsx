// Text that keeps the line breaks of the source (question prompts like "a) ... b) ...", model
// answers, typed answers): one paragraph per line.
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

export function ProseText({ children, type = 'body' }: { children: string; type?: 'body' | 'large' }) {
  const lines = children.split('\n').filter((l) => l.trim() !== '');
  return (
    <VStack gap={1}>
      {lines.map((line, i) => (
        <Text key={i} as="p" type={type}>
          {line}
        </Text>
      ))}
    </VStack>
  );
}
