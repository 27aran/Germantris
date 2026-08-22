import json
import os
from sklearn.model_selection import train_test_split

def load_and_split():
    base_path = os.path.dirname(os.path.dirname(__file__))
    path = os.path.join(base_path, 'data', 'training_pairs.json')
    with open(path) as data:
        training_pairs = json.load(data)

    train, temp = train_test_split(training_pairs, test_size=0.2, random_state=42)
    val, test = train_test_split(temp, test_size=0.5, random_state=42)

    return train, val, test
