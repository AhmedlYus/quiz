// Tells the player when a question they flagged has been fixed or reviewed.
import { Banner } from '@astryxdesign/core/Banner';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import type { Notice } from '@/shared/api/types';
import { useSession } from '@/shared/session/SessionContext';
import { markNoticesSeen } from '../api';

export function NoticesBanner({ notices }: { notices: Notice[] }) {
  const { me, setMe } = useSession();
  if (!notices.length) return null;

  const dismiss = () => {
    if (me) setMe({ ...me, notices: [] });
    void markNoticesSeen().catch(() => undefined);
  };
  return (
    <Banner
      status="info"
      title={notices.length === 1 ? 'Update on a question you flagged' : `Updates on ${notices.length} questions you flagged`}
      isDismissable
      onDismiss={dismiss}
      dismissLabel="Dismiss updates on flagged questions"
      collapsible={false}
    >
      <VStack gap={2}>
        <List>
          {notices.map((n) => (
            <ListItem
              key={n.questionId}
              label={<Text weight="semibold">{n.status === 'fixed' ? 'Fixed.' : 'Reviewed, kept as is.'}</Text>}
              description={
                <VStack gap={1}>
                  <Text>{n.question ? `“${n.question}”` : 'A question that has since been removed.'}</Text>
                  {n.reply && <Text type="supporting">{n.reply}</Text>}
                </VStack>
              }
            />
          ))}
        </List>
        <Text type="supporting">Thanks for helping make the questions better.</Text>
      </VStack>
    </Banner>
  );
}
