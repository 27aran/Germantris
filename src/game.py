from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import random
import os

class Germantris:
    def __init__(self):
        base_path = os.path.dirname(os.path.dirname(__file__))
        model_path = os.path.join(base_path, "model", "finetuned-model")

        self.model = SentenceTransformer(model_path)

        wordlist_path = os.path.join(base_path, "data", "wordlist.txt")
        with open(wordlist_path, 'r', encoding='utf-8') as wordlist:
            self.wordlist = [word.strip() for word in wordlist.readlines()]

        self.wordlist_emb = {word : self.model.encode(word) for word in self.wordlist }

    def get_closest(self, guess, candidates):
        guess_emb = self.model.encode(guess)
        similarities = {}

        for word, emb in candidates.items():
            sim = cosine_similarity(guess_emb, emb)[0][0]
            similarities[word] = sim

        sorted_words = sorted(similarities, key=similarities.get, reverse=True)
        return sorted_words, similarities

    def process_guess(self, guess, candidates, target):
            sorted_words, similarities = self.get_closest(guess, candidates)
            target_index = sorted_words.index(target)
            if target_index <= 3:
                # top 4 elemente entfernen
                for word in sorted_words[:4]:
                    candidates.pop(word)
                # add 3 new words
                new_words = (random.sample(self.wordlist, 3))
                for word in new_words:
                    candidates[word] = self.wordlist_emb[word]
                return True, candidates
            else:
                # add new word
                new_word = random.sample(self.wordlist, 1)[0]
                candidates[new_word] = self.wordlist_emb[new_word]
                return False, candidates

    def new_round(self):
        candidates = {word : self.wordlist_emb[word] for word in random.sample(self.wordlist, 10)}
        target = random.choice(list(candidates.keys()))
        return target, candidates