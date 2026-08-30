import json
import os
from sklearn.model_selection import train_test_split

def rescale(score):
    return (score-0.5)*2

def load_and_split():
    base_path = os.path.dirname(os.path.dirname(__file__))
    path = os.path.join(base_path, 'data', 'training_pairs.json')
    with open(path) as data:
        training_pairs = json.load(data)

    training_pairs = [[pair[0], pair[1], rescale(pair[2])] for pair in training_pairs]

    train, temp = train_test_split(training_pairs, test_size=0.2, random_state=42)
    val, test = train_test_split(temp, test_size=0.5, random_state=42)

    return train, test, val
