export interface IVocabObj {
  word: string;
  reading: string;
  meanings: string[];
  /**
   * JMdict entry id. Different spellings of one word (e.g. あちら / あっち)
   * share it. Optional because older persisted selections predate it.
   */
  jmdictSeq?: string;
}

export type VocabLevel = 'n5' | 'n4' | 'n3' | 'n2' | 'n1';
