import type { AgentRequest, ContextAgentResponse } from '@/types/agents';

/**
 * Find context matches (email, doc, calendar, slack).
 * Returns empty until real data sources are integrated.
 */
export function findContextMatches(_request: AgentRequest): ContextAgentResponse {
  return { matches: [] };
}
