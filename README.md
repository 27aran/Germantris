# Germantris 🧠

A German clone of Google's Semantris – a word association game powered by a fine-tuned Sentence Transformer model.

## Demo
> Start the backend and open `frontend/index.html` in your browser.

## How it works
1. Words appear on the game field
2. You enter an associated word
3. The model calculates semantic similarity between your word and all candidates
4. The most similar word is highlighted – if the target word lands in the Top 4, it gets removed and new words are added

## ML Approach

### Base Model
`paraphrase-multilingual-MiniLM-L12-v2` – a multilingual Sentence Transformer pre-trained on large text corpora, already capable of German semantic understanding.

### Fine-Tuning
The base model was fine-tuned on a curated dataset of ~700 German word pairs with manual similarity scores, using `CosineSimilarityLoss` to optimize semantic word-level similarity.

| Model | Spearman Correlation |
|---|---|
| Base Model | 0.09 |
| Fine-Tuned | 0.27 |

### Why Sentence Transformer over FastText?
FastText offers strong German word embeddings but lacks native fine-tuning support. Sentence Transformers allow domain-specific fine-tuning, enabling the model to be specialized for word association tasks.

## Tech Stack
- **ML:** Python, PyTorch, Sentence Transformers, scikit-learn, scipy
- **Backend:** FastAPI, uvicorn
- **Frontend:** HTML, CSS, JavaScript

## Installation

```bash
git clone https://github.com/27aran/Germantris
cd Germantris
pip install -r requirements.txt
python src/train.py
uvicorn backend.main:app --reload
```

## Quick Start with Docker
```bash
docker-compose up
```
Dann `frontend/index.html` im Browser öffnen.


Then open `frontend/index.html` in your browser.

## Model
The fine-tuned model is available on Hugging Face:
👉 https://huggingface.co/27aran/germantris-model

## Author
Built by [Aran Moradi](https://github.com/27aran)

## License
MIT