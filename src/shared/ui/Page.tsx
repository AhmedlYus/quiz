// Page frame used by every route: heading, optional description, back link and actions, then the
// content capped to a readable width. Widths: narrow (forms, summaries), medium, wide (overviews),
// full (question screens).
import type { ReactNode } from 'react';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';

// full: question screens, which put the question and the answer side by side.
const WIDTHS = { narrow: 640, medium: 960, wide: 1280, full: 1600 } as const;

export type PageProps = {
  title: string;
  description?: ReactNode;
  /** Route of the parent page, e.g. "/oral". Renders a "Back" link above the title. */
  back?: { href: string; label?: string };
  actions?: ReactNode;
  width?: keyof typeof WIDTHS;
  children: ReactNode;
};

export function Page({ title, description, back, actions, width = 'wide', children }: PageProps) {
  return (
    <Layout
      height="auto"
      contentWidth={WIDTHS[width]}
      header={
        <LayoutHeader>
          <VStack gap={2}>
            {back && (
              <HStack>
                <Button
                  label={back.label ?? 'Back'}
                  variant="ghost"
                  size="sm"
                  href={back.href}
                  icon={<Icon icon="chevronLeft" />}
                />
              </HStack>
            )}
            <HStack gap={4} justify="between" align="end" wrap="wrap">
              <VStack gap={1}>
                <Heading level={1}>{title}</Heading>
                {description && <Text color="secondary">{description}</Text>}
              </VStack>
              {actions && (
                <HStack gap={2} wrap="wrap">
                  {actions}
                </HStack>
              )}
            </HStack>
          </VStack>
        </LayoutHeader>
      }
      content={<LayoutContent isScrollable={false}>{children}</LayoutContent>}
    />
  );
}
