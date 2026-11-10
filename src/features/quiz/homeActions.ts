// The overview's other ways to study, with number keys 2-5; key 1 is the main Start button.
import { AlertTriangle, CircleCheck, Layers, Mountain, SlidersHorizontal } from 'lucide-react';
import { plural } from '@/shared/lib/format';
import type { Me } from '@/shared/api/types';
import type { Action } from '@/shared/ui/dashboard/ActionList';

export function homeActions(me: Me): Action[] {
  const { stats, customRun } = me;
  const mistakesNote = [
    stats.mistakes ? `${plural(stats.mistakes, 'question')} to fix` : stats.hard ? null : 'Nothing to fix right now',
    stats.hard ? `${stats.hard} hard for everyone` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return [
    { shortcut: '2', href: '/lectures', label: 'Study a lecture', description: `Focus on one of ${plural(stats.topics, 'lecture')}`, icon: Layers, isDisabled: !stats.total },
    {
      shortcut: '3',
      href: stats.mistakes ? '/mistakes' : '/hard',
      label: 'Study mistakes',
      description: mistakesNote,
      icon: stats.mistakes ? AlertTriangle : Mountain,
      isDisabled: !stats.mistakes && !stats.hard,
    },
    { shortcut: '4', href: '/correct', label: 'Answered right', description: stats.mastered ? `${stats.mastered} questions mastered` : 'Answer some questions first', icon: CircleCheck, isDisabled: !stats.mastered },
    {
      shortcut: '5',
      href: '/custom',
      label: 'Custom round',
      description: customRun && !customRun.finished ? `Resume: ${customRun.position} of ${customRun.total} answered` : 'Pick lectures and length',
      icon: SlidersHorizontal,
      isDisabled: !stats.total,
    },
  ];
}
