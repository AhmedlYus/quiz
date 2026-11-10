// Overview frame shared by every mode: the dashboard takes three quarters, the syllabus a
// separate card in the last quarter. Below 64rem the syllabus moves under the dashboard.
import type { ReactNode } from 'react';
import { Grid } from '@astryxdesign/core/Grid';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import './dashboard.css';

export function DashboardLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <Grid columns={1} gap={6} align="start" className="dashboard">
      <VStack gap={5}>{children}</VStack>
      <Card padding={4} className="dashboard-aside">
        {aside}
      </Card>
    </Grid>
  );
}
