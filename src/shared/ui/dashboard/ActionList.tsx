// The other ways to study from an overview, as rows linking to their page.
import { Icon } from '@astryxdesign/core/Icon';
import { Kbd } from '@astryxdesign/core/Kbd';
import { List, ListItem } from '@astryxdesign/core/List';
import type { LucideIcon } from 'lucide-react';

export type Action = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isDisabled?: boolean;
  /** Number key that opens it, shown at the end of the row. */
  shortcut?: string;
};

export function ActionList({ actions }: { actions: Action[] }) {
  return (
    <List hasDividers>
      {actions.map((a) => (
        <ListItem
          key={a.href}
          href={a.href}
          label={a.label}
          description={a.description}
          isDisabled={a.isDisabled}
          startContent={<Icon icon={a.icon} color="secondary" />}
          endContent={a.shortcut ? <Kbd keys={a.shortcut} /> : <Icon icon="chevronRight" color="secondary" />}
        />
      ))}
    </List>
  );
}
