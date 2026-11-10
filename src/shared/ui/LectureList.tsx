// Lectures as rows: number, name, progress and an optional line of buttons. Compact rows link to
// the lecture and fit the overview's syllabus column; full rows carry their own actions.
import type { ReactNode } from 'react';
import { List, ListItem } from '@astryxdesign/core/List';
import { Heading } from '@astryxdesign/core/Heading';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { pct, splitLecture } from '../lib/format';

export type LectureItem = {
  topic: string;
  done: number;
  total: number;
  /** Replaces the default "3/10 mastered" line. */
  meta?: string;
  /** Added after the default line, e.g. "3 mistakes". */
  note?: string | null;
  /** Defaults to having questions; otherwise the row reads "Coming soon". */
  isReady?: boolean;
  href?: string;
  actions?: ReactNode;
};

type Props = {
  items: LectureItem[];
  /** "mastered" or "solid". */
  doneLabel: string;
  title?: string;
  isCompact?: boolean;
};

export function LectureList({ items, doneLabel, title, isCompact = false }: Props) {
  return (
    <List header={title ? <Heading level={2}>{title}</Heading> : undefined} hasDividers density={isCompact ? 'compact' : 'balanced'}>
      {items.map((it) => {
        const { number, name } = splitLecture(it.topic || 'Other');
        const ready = it.isReady ?? it.total > 0;
        const meta = it.meta ?? (it.total > 0 ? [`${it.done}/${it.total} ${doneLabel}`, it.note].filter(Boolean).join(' · ') : 'Coming soon');
        return (
          <ListItem
            key={it.topic}
            href={it.total > 0 ? it.href : undefined}
            isDisabled={!it.total}
            align="start"
            startContent={<Token label={number ?? '·'} size="sm" color={ready ? 'blue' : 'gray'} description={number ? `Lecture ${number}` : undefined} />}
            label={isCompact ? <Text maxLines={2}>{name}</Text> : name}
            description={
              <VStack gap={1}>
                <Text type="supporting">{meta}</Text>
                {ready && <ProgressBar label={`${name}: ${doneLabel}`} isLabelHidden value={pct(it.done, it.total)} variant="success" />}
              </VStack>
            }
            endContent={it.actions}
          />
        );
      })}
    </List>
  );
}
