// Root component: theme, link handling and session, then either the login page or the app.
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Center } from '@astryxdesign/core/Center';
import { themes, defaultThemeSlug } from '../astryx-themes';
import { ColorModeProvider } from '@/shared/session/colorMode';
import { SessionProvider, useSession } from '@/shared/session/SessionContext';
import { ErrorState, LoadingState } from '@/shared/ui/States';
import LoginPage from '@/features/auth/LoginPage';
import { AppFrame } from './AppFrame';
import { RouteOutlet } from './RouteOutlet';
import { RouterLink } from './router';

function Gate() {
  const { me } = useSession();
  if (!me) return <LoginPage />;
  return (
    <AppFrame>
      <RouteOutlet />
    </AppFrame>
  );
}

export function App() {
  return (
    <ColorModeProvider>
      {(mode) => (
        <Theme theme={themes[defaultThemeSlug as keyof typeof themes]} mode={mode}>
          <LinkProvider component={RouterLink}>
            <SessionProvider
              loading={<LoadingState />}
              failed={(error, retry) => (
                <Center>
                  <ErrorState error={error} onRetry={retry} />
                </Center>
              )}
            >
              <Gate />
            </SessionProvider>
          </LinkProvider>
        </Theme>
      )}
    </ColorModeProvider>
  );
}
