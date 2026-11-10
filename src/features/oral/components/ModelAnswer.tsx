// The model answer (or model query), other acceptable answers, the examiner's follow-ups and the source.
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { QueryCode } from '@/shared/editor';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { List, ListItem } from '@astryxdesign/core/List';
import { SourceLine } from '@/shared/ui/SourceLine';
import type { Reveal } from '../api';
import { ProseText } from './ProseText';

const Answer = ({ text, isCode }: { text: string; isCode: boolean }) =>
  isCode ? <QueryCode code={text} hasCopyButton /> : <ProseText>{text}</ProseText>;

export function ModelAnswer({ reveal, topic, isQuery }: { reveal: Reveal; topic: string; isQuery: boolean }) {
  return (
    <VStack gap={3}>
      <Heading level={3}>{isQuery ? 'Model query' : 'Model answer'}</Heading>
      <Answer text={reveal.modelAnswer} isCode={isQuery} />
      {reveal.alternatives.length > 0 && (
        <VStack gap={2}>
          <Heading level={4}>Also acceptable</Heading>
          {reveal.alternatives.map((alt, i) => (
            <Answer key={i} text={alt} isCode={isQuery} />
          ))}
        </VStack>
      )}
      {reveal.followUps.length > 0 && (
        <Collapsible
          defaultIsOpen={false}
          trigger={<Text weight="semibold">What the examiner might ask next ({reveal.followUps.length})</Text>}
        >
          <List listStyle="disc">
            {reveal.followUps.map((f, i) => (
              <ListItem key={i} label={<Text>{f}</Text>} />
            ))}
          </List>
        </Collapsible>
      )}
      <SourceLine source={reveal.source} topic={topic} />
    </VStack>
  );
}
