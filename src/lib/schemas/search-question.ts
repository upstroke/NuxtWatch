/** Transitional exports until production imports move to ./search. */
export {
  questionBindingSchema,
  mediaTypeQuestionSchema,
  textQuestionSchema,
  searchQuestionSchema,
} from './search';
export type { MediaTypeQuestion, SearchQuestion } from './search';
