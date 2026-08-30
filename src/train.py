from sentence_transformers import (SentenceTransformer, SentenceTransformerTrainer)
from sentence_transformers.losses.cosine_similarity import CosineSimilarityLoss
from sentence_transformers import SentenceTransformerTrainingArguments
from dataset import load_and_split
from datasets import Dataset
import os

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
loss = CosineSimilarityLoss(model)
train, test, val = load_and_split()

base_path = os.path.dirname(os.path.dirname(__file__))
output_path1 = os.path.join(base_path, "model", "semantris-model")
output_path2 = os.path.join(base_path, "model", "finetuned-model")

# Dataset erstellen
train_dataset = Dataset.from_dict({
    "sentence1": [pair[0] for pair in train],
    "sentence2": [pair[1] for pair in train],
    "score": [float(pair[2]) for pair in train]
})

# Training Arguments
args = SentenceTransformerTrainingArguments(
    output_dir=output_path1,
    learning_rate=2e-5,
    num_train_epochs=50,
    per_device_train_batch_size=16,
    warmup_steps=100,
)

# Trainer
trainer = SentenceTransformerTrainer(
    model=model,
    args=args,
    train_dataset=train_dataset,
    loss=loss,
)

trainer.train()
model.save_pretrained(output_path2)