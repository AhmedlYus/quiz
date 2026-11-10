// Sign in, or create a player when the nickname is new. Shown outside the app frame, so it
// centres itself. After success the session reloads and the app takes over.
import { useState, type FormEvent } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { ApiError, post } from '@/shared/api/client';
import { useSession } from '@/shared/session/SessionContext';

export default function LoginPage() {
  const { config, course, refreshMe } = useSession();
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ status: 'info' | 'error'; text: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setMessage(null);
    setIsBusy(true);
    try {
      await post(creating ? 'register' : 'login', { nickname, pin, joinCode });
      await refreshMe();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'no_player' && !creating) {
        setCreating(true);
        setMessage({
          status: 'info',
          text: `No player called "${nickname.trim()}" yet. Create it with this PIN? Remember the PIN; there is no reset.`,
        });
      } else {
        setMessage({ status: 'error', text: (e as Error).message });
      }
    } finally {
      setIsBusy(false);
    }
  }

  function backToLogin() {
    setCreating(false);
    setMessage(null);
  }

  return (
    <Center axis="both" padding={6} minHeight="100dvh">
      <VStack gap={5} hAlign="center" width="100%" maxWidth={420}>
        <VStack gap={1} hAlign="center">
          <Text type="supporting">
            {course.code} · {course.name}
          </Text>
          <Heading level={1}>{course.appName}</Heading>
        </VStack>
        <Card padding={8} width="100%">
          <form onSubmit={(ev) => void submit(ev)} noValidate>
            <VStack gap={4}>
              <VStack gap={1}>
                <Heading level={2}>{creating ? 'Create your player' : 'Log in'}</Heading>
                <Text color="secondary">{creating ? 'Choose a PIN you will remember.' : 'Pick a nickname and a PIN to join.'}</Text>
              </VStack>
              <TextInput
                label="Nickname"
                value={nickname}
                onChange={setNickname}
                autoComplete="username"
                hasAutoFocus
                hasAutoCorrect={false}
                autoCapitalize="off"
                isRequired
              />
              <TextInput
                label="PIN"
                description="4-8 digits. Do not reuse a real password or bank PIN."
                type="password"
                inputMode="numeric"
                autoComplete={creating ? 'new-password' : 'current-password'}
                value={pin}
                onChange={setPin}
                isRequired
              />
              {creating && config.joinCodeRequired && (
                <TextInput label="Join code" description="Ask whoever shared the link." value={joinCode} onChange={setJoinCode} autoComplete="off" isRequired />
              )}
              {message && <Banner status={message.status} title={message.text} collapsible={false} role={message.status === 'error' ? 'alert' : undefined} />}
              <VStack gap={2}>
                <Button label={creating ? 'Create player' : 'Play'} type="submit" variant="primary" size="lg" width="100%" isLoading={isBusy} />
                {creating && <Button label="Back to log in" variant="ghost" onClick={backToLogin} />}
              </VStack>
            </VStack>
          </form>
        </Card>
      </VStack>
    </Center>
  );
}
