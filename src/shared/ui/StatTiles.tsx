// Row of key numbers (e.g. mastered, mistakes, points). Reflows to one column on phones.
import type { ReactNode } from 'react';
import { Grid } from '@astryxdesign/core/Grid';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';

export type Stat = {
  label: string;
  value: number | string;
  /** With a total, the tile shows "value / total" and a progress bar. */
  total?: number;
  description?: ReactNode;
  variant?: 'accent' | 'success' | 'warning' | 'error' | 'neutral';
};

export function StatTiles({ stats, label }: { stats: Stat[]; label: string }) {
  return (
    <Grid columns={{ minWidth: 180, max: 4 }} gap={3} aria-label={label} role="group">
      {stats.map((s) => (
        <Card key={s.label} padding={4}>
          <VStack gap={2}>
            <Text type="supporting">{s.label}</Text>
            <HStack gap={1} align="end">
              <Text type="display-3" hasTabularNumbers>
                {s.value}
              </Text>
              {s.total != null && (
                <Text color="secondary" hasTabularNumbers>
                  / {s.total}
                </Text>
              )}
            </HStack>
            {s.total != null && typeof s.value === 'number' && (
              <ProgressBar label={s.label} isLabelHidden value={s.value} max={Math.max(1, s.total)} variant={s.variant ?? 'success'} />
            )}
            {s.description && <Text type="supporting">{s.description}</Text>}
          </VStack>
        </Card>
      ))}
    </Grid>
  );
}
