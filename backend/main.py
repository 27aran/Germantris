from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.game import Germantris
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
game = Germantris()

@app.get("/")
def root():
    return {"message": "Willkommen zu Germantris"}

@app.get("/new_round")
def new_round():
    target, candidates = game.new_round()
    return {"target": target, "candidates":list(candidates.keys())}

class GuessRequest(BaseModel):
    guess: str
    candidates: list[str]
    target: str

@app.post("/guess")
def guess(request: GuessRequest):
    guess = request.guess
    candidates = request.candidates
    target = request.target

    candidates_dict = {word: game.wordlist_emb[word] for word in candidates}

    if guess.lower().startswith(target.lower()) or target.lower().startswith(guess.lower()):
        return {
        "hit": False,
        "candidates": list(candidates_dict.keys()),
        "sorted_words": [],
        "newTarget": target,
        "gameOver": False,
        "invalid": True}

    is_hit, candidates_dict, target, gameOver, sorted_words = game.process_guess(guess, candidates_dict, target)

    return {
    "hit":is_hit,
    "candidates":list(candidates_dict.keys()),
    "sorted_words": sorted_words,
    "newTarget":target,
    "gameOver":gameOver,
    "invalid": False}

class AddWordRequest(BaseModel):
    candidates: list[str]

@app.post("/add_word")
def add_word(request: AddWordRequest):
    new_word = game.add_word(request.candidates)
    return {"word": new_word}

