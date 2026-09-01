from fastapi import FastAPI
from src.game import Germantris
from pydantic import BaseModel

app = FastAPI()
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
    gameOver: bool

@app.post("/guess")
def guess(request: GuessRequest):
    guess = request.guess
    candidates = request.candidates
    target = request.target
    gameOver = request.gameOver

    candidates_dict = {word: game.wordlist_emb[word] for word in candidates}
    is_hit, candidates_dict, target, gameOver = game.process_guess(guess, candidates_dict, target)

    return {"hit":is_hit, "candidates":list(candidates_dict.keys()), "newTarget":target, "gameOver":gameOver}

