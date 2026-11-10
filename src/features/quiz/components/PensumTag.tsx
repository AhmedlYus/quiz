// Marks a question that comes from the reading list rather than the slides.
import { Icon } from '@astryxdesign/core/Icon';
import { Token } from '@astryxdesign/core/Token';
import { BookOpen } from 'lucide-react';

export function PensumTag() {
  return <Token label="Pensum only" size="sm" color="orange" icon={<Icon icon={BookOpen} />} description="From the reading list, not on the slides" />;
}
