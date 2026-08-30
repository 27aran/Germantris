from dataset import load_and_split
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from scipy import stats

def evaluate(model, pairs):
    model_sims = []
    actual_sims = []
    for pair in pairs:
        word1 = pair[0]
        word2 = pair[1]
        label = pair[2]

        actual_sims.append(label)
        emb1 = model.encode(word1)
        emb2 = model.encode(word2)
        sim = cosine_similarity([emb1], [emb2])[0][0]
        model_sims.append(sim)
    corr = stats.spearmanr(actual_sims, model_sims)
    return corr

train, test, val = load_and_split()
model = SentenceTransformer("D:/Aran/projects/Germantris/model/finetuned-model")
result = evaluate(model, test)
print(result)


