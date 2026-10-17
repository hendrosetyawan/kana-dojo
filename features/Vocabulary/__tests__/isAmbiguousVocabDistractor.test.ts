import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { IVocabObj } from '@/entities/vocabulary';
import { isAmbiguousVocabDistractor } from '@/features/Vocabulary/lib/isAmbiguousVocabDistractor';
import { toWordObj } from '@/features/Vocabulary/services/vocabDataService';

const loadLevel = (level: string): IVocabObj[] =>
  JSON.parse(
    readFileSync(
      resolve(process.cwd(), `public/data-vocab/${level}.json`),
      'utf8',
    ),
  ).map(toWordObj);

const findWord = (words: IVocabObj[], word: string) => {
  const found = words.find(obj => obj.word === word);
  if (!found) throw new Error(`missing test word ${word}`);
  return found;
};

describe('isAmbiguousVocabDistractor', () => {
  it('rejects the target word itself', () => {
    const word = { word: '秋', reading: 'あき', meanings: ['autumn'] };

    expect(isAmbiguousVocabDistractor(word, { ...word })).toBe(true);
  });

  it('rejects another spelling of the same JMdict entry even when glosses differ', () => {
    const acchi = {
      word: 'あっち',
      reading: 'あっち',
      meanings: ['over there'],
      jmdictSeq: '1483185',
    };
    const achira = {
      word: 'あちら',
      reading: 'あちら',
      meanings: ['there'],
      jmdictSeq: '1483185',
    };

    expect(isAmbiguousVocabDistractor(acchi, achira)).toBe(true);
    expect(isAmbiguousVocabDistractor(achira, acchi)).toBe(true);
  });

  it('rejects words that share a normalized meaning', () => {
    const aku = {
      word: '開く',
      reading: 'あく',
      meanings: ['to open', 'to become open'],
    };
    const akeru = { word: '開ける', reading: 'あける', meanings: ['open'] };

    expect(isAmbiguousVocabDistractor(aku, akeru)).toBe(true);
  });

  it('keeps unrelated words as distractors', () => {
    const acchi = {
      word: 'あっち',
      reading: 'あっち',
      meanings: ['over there'],
      jmdictSeq: '1483185',
    };
    const atatakai = {
      word: '暖かい',
      reading: 'あたたかい',
      meanings: ['warm'],
      jmdictSeq: '1586420',
    };

    expect(isAmbiguousVocabDistractor(acchi, atatakai)).toBe(false);
  });

  it('does not group words that both lack a JMdict id', () => {
    const south = { word: '南', reading: 'みなみ', meanings: ['south'] };
    const help = { word: '佐', reading: 'さ', meanings: ['help'] };

    expect(isAmbiguousVocabDistractor(south, help)).toBe(false);
  });

  describe('with the shipped vocabulary data', () => {
    const n5 = loadLevel('n5');
    const n1 = loadLevel('n1');

    it('keeps the JMdict id when loading words', () => {
      expect(findWord(n5, 'あちら').jmdictSeq).toBe('1483185');
      expect(findWord(n5, 'あっち').jmdictSeq).toBe('1483185');
    });

    it('never offers あちら as a wrong option for あっち (#32499)', () => {
      expect(
        isAmbiguousVocabDistractor(
          findWord(n5, 'あっち'),
          findWord(n5, 'あちら'),
        ),
      ).toBe(true);
    });

    it('omits the id for entries without one instead of storing an empty string', () => {
      const withoutId = n1.filter(obj => obj.jmdictSeq === undefined);

      expect(withoutId.length).toBeGreaterThan(0);
      expect(n1.some(obj => obj.jmdictSeq === '')).toBe(false);
    });
  });
});
