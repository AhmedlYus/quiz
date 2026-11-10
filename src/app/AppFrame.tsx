// App chrome: one slim top bar. Each mode's overview page is the hub for everything in that
// mode, so there is no side navigation. The mode switch only appears when course.json turns on
// more than one mode; the account menu holds the rest (help, leaderboard, admin, log out).
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav, TopNavHeading } from '@astryxdesign/core/TopNav';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Badge } from '@astryxdesign/core/Badge';
import { CircleHelp, Code, Flag, ListChecks, LogOut, Mic, Monitor, Moon, Sun, Trophy } from 'lucide-react';
import { useSession } from '@/shared/session/SessionContext';
import { useColorMode, type ColorMode } from '@/shared/session/colorMode';
import { enabledModes, MODE_HOME, modeOfPath, type StudyMode } from './modes';
import { navigate, useLocationPath } from './router';

const MODE_ICONS: Record<StudyMode, LucideIcon> = { quiz: ListChecks, oral: Mic, query: Code };

export function AppFrame({ children }: { children: ReactNode }) {
  const { course, me, signOut } = useSession();
  const { mode: colorMode, setMode: setColorMode } = useColorMode();
  const path = useLocationPath();
  const modes = enabledModes(course);
  const current = modeOfPath(path);
  const mode = modes.includes(current) ? current : modes[0];
  const home = MODE_HOME[mode];
  const modeLabel: Record<StudyMode, string> = { quiz: 'Quiz', oral: 'Oral', query: course.oral?.query?.title ?? 'Queries' };

  const help =
    mode === 'quiz'
      ? { label: 'Rules and points', icon: CircleHelp, href: '/rules' }
      : course.modes.oral
        ? { label: 'How oral mode works', icon: CircleHelp, href: '/oral/help' }
        : null;
  const menuItems = [
    ...(help ? [help] : []),
    ...(course.modes.quiz && course.features.leaderboard ? [{ label: 'Leaderboard', icon: Trophy, href: '/leaderboard' }] : []),
    ...(me?.user.admin
      ? [{ label: 'Flagged questions', icon: Flag, href: '/flags', endContent: me.openFlags ? <Badge label={String(me.openFlags)} variant="warning" /> : undefined }]
      : []),
    { type: 'divider' as const },
    { label: 'Log out', icon: LogOut, onClick: () => void signOut() },
  ];

  const nav = (
    <TopNav
      label="Main"
      heading={<TopNavHeading heading={course.code} subheading={course.name} headingHref={home} />}
      centerContent={
        modes.length > 1 ? (
          <SegmentedControl label="Study mode" value={mode} onChange={(v) => navigate(MODE_HOME[v as StudyMode])}>
            {modes.map((m) => (
              <SegmentedControlItem key={m} value={m} label={modeLabel[m]} icon={<Icon icon={MODE_ICONS[m]} />} />
            ))}
          </SegmentedControl>
        ) : undefined
      }
      endContent={
        <HStack gap={2} align="center">
          <SegmentedControl label="Color mode" value={colorMode} onChange={(v) => setColorMode(v as ColorMode)} size="sm">
            <SegmentedControlItem value="light" label="Light" icon={<Icon icon={Sun} />} isLabelHidden />
            <SegmentedControlItem value="system" label="System" icon={<Icon icon={Monitor} />} isLabelHidden />
            <SegmentedControlItem value="dark" label="Dark" icon={<Icon icon={Moon} />} isLabelHidden />
          </SegmentedControl>
          {me && <DropdownMenu button={{ label: me.user.nickname, variant: 'ghost' }} alignment="end" items={menuItems} />}
        </HStack>
      }
    />
  );

  return (
    <AppShell topNav={nav} height="fill" variant="surface">
      {children}
    </AppShell>
  );
}
