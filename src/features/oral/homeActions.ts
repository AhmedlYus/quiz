// The oral overview's other ways to practise, besides the main round.
import { CircleCheck, GraduationCap, Layers, SlidersHorizontal, Target } from 'lucide-react';
import type { OralSettings } from '@/shared/api/types';
import { plural } from '@/shared/lib/format';
import type { Action } from '@/shared/ui/dashboard/ActionList';
import type { Overview } from './api';

export function homeActions({ stats, runs }: Overview, oral: OralSettings): Action[] {
  const needsWork = stats.partial + stats.missed;
  const none = !stats.playable;
  return [
    {
      href: '/oral/exam',
      label: 'Exam simulation',
      description:
        runs.exam && !runs.exam.finished
          ? 'An exam is in progress. Pick up where you left off'
          : `${plural(oral.exam.questions, 'question')} from different lectures, answered one by one`,
      icon: GraduationCap,
      isDisabled: none,
    },
    { href: '/oral/lectures', label: 'Study a lecture', description: 'One lecture at a time', icon: Layers, isDisabled: none },
    {
      href: '/oral/needs-work',
      label: 'Needs work',
      description: needsWork ? `${plural(needsWork, 'question')} to go over again` : 'Nothing yet. Rate some answers first',
      icon: Target,
      isDisabled: !needsWork,
    },
    {
      href: '/oral/solid',
      label: 'Solid answers',
      description: stats.solid ? `${plural(stats.solid, 'answer')} rated solid` : 'Rate an answer solid to see it here',
      icon: CircleCheck,
      isDisabled: !stats.solid,
    },
    {
      href: '/oral/custom',
      label: 'Custom round',
      description: runs.custom && !runs.custom.finished ? `Resume: ${runs.custom.position} of ${runs.custom.total} answered` : 'Pick lectures, question types and length',
      icon: SlidersHorizontal,
      isDisabled: none,
    },
  ];
}
