/* eslint-disable antfu/no-top-level-await */
import { configure, getConsoleSink, getJsonLinesFormatter, getLogger } from '@logtape/logtape';
import { isServer } from '@/utils/Helpers';

// Remove all references to Better Stack and Env.BETTER_STACK_SOURCE_TOKEN
// Only keep console logging or other non-BetterStack sinks

await configure({
  sinks: {
    console: getConsoleSink({ formatter: getJsonLinesFormatter() }),
  },
  loggers: [
    { category: ['logtape', 'meta'], sinks: ['console'], lowestLevel: 'warning' },
    {
      category: ['app'],
      sinks: isServer() ? ['console'] : ['console'],
      lowestLevel: 'debug',
    },
  ],
});

export const logger = getLogger(['app']);
