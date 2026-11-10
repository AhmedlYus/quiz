// How oral mode works: answering, hints, self-check, Copy for GPT, the exam and privacy.
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Page } from '@/shared/ui/Page';
import { useCourse } from '@/shared/session/SessionContext';
import { useOral } from '../hooks/useOral';

export default function OralHelpPage() {
  const course = useCourse();
  const oral = useOral();
  const minutes = Math.max(1, Math.round(oral.timerSeconds / 60));
  const sections: [string, string[]][] = [
    [
      'Answering',
      [
        `Each question is something an examiner could ask. Answer out loud: press the mic and your browser writes down what you say, or type if you prefer.${!oral.query ? '' : course.modes.query ? ` ${oral.query.language} questions are practised in writing under ${oral.query.title}.` : ` For ${oral.query.language} questions you write the statement in the code editor.`}`,
        `The timer is optional (switch it off at the top of any question). When on, a countdown of about ${minutes} min starts when you start speaking or typing. It only nudges you; nothing is cut off.`,
      ],
    ],
    ['Hints', ['Stuck? Hints come one at a time, each a little more specific. Hints used are noted with your rating.']],
    [
      'Checking yourself',
      [
        'Show the key points, tick the ones you really covered, then rate the answer: missed it, partly, or solid. "Sounds like you said this" is only a guess from the transcript, so trust your own judgement.',
        'Anything not rated solid lands in Needs work. Solid answers count towards your progress per lecture.',
      ],
    ],
    [
      'Copy for GPT',
      [
        'Copies a ready-made examiner prompt with the question, key points, model answer and your answer. Paste it into ChatGPT for a strict review and a follow-up question, and keep the conversation going there.',
      ],
    ],
    [
      'Exam simulation',
      [
        `${oral.exam.questions} questions from different lectures are drawn. You answer them one by one, with or without the timer, then check your answers against the key points and rate each one.`,
      ],
    ],
    [
      'Privacy',
      [
        'Only your ratings are saved on the server. What you say or type stays in this browser. Speech-to-text is done by your browser; in Chrome that means Google transcribes the audio.',
      ],
    ],
  ];

  return (
    <Page title="How oral mode works" back={{ href: '/oral', label: 'Oral' }} width="narrow">
      <Card padding={6}>
        <VStack gap={5}>
          {sections.map(([title, paragraphs]) => (
            <VStack key={title} gap={2}>
              <Heading level={2}>{title}</Heading>
              {paragraphs.map((p) => (
                <Text key={p} as="p">
                  {p}
                </Text>
              ))}
            </VStack>
          ))}
        </VStack>
      </Card>
    </Page>
  );
}
