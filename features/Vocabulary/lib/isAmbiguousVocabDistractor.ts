import type { IVocabObj } from '@/entities/vocabulary';
import { normalizeMeaningAnswer } from '@/shared/utils/meanings';

/**
 * Returns true when `candidate` must not be offered as a wrong option for a
 * meaning question about `target`, because picking it would also be correct.
 *
 * That is the case for the word itself, for another spelling of the same
 * JMdict entry (あちら / あっち, コンピュータ / コンピューター), and for any word
 * that shares an English meaning with the target.
 */
export const isAmbiguousVocabDistractor = (
  target: IVocabObj,
  candidate: IVocabObj,
): boolean => {
  if (candidate.word === target.word) return true;

  if (target.jmdictSeq && target.jmdictSeq === candidate.jmdictSeq) {
    return true;
  }

  const targetMeanings = new Set(
    target.meanings.map(normalizeMeaningAnswer).filter(Boolean),
  );
  return candidate.meanings.some(meaning =>
    targetMeanings.has(normalizeMeaningAnswer(meaning)),
  );
};
