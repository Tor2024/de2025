
import { config } from 'dotenv';
config();

// This file is used by the Genkit development server (genkit start)
// to discover and register all AI flows.
// Add imports for any new AI flows here.

import '@/ai/flows/ai-learning-roadmap.ts';
import '@/ai/flows/adaptive-grammar-explanations.ts';
import '@/ai/flows/ai-powered-writing-assistance.ts';
import '@/ai/flows/generate-vocabulary-flow.ts';
import '@/ai/flows/generate-reading-material-flow.ts';
import '@/ai/flows/generate-listening-material-flow.ts';
import '@/ai/flows/generate-tutor-tip-flow.ts';

