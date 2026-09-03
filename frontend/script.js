let currentTarget = null
let currentCandidates = []

function renderCandidates() {
    const container = document.getElementById('candidates')
    container.innerHTML = ''  // leeren

    currentCandidates.forEach(word => {
        const element = document.createElement('p')
        element.textContent = word
        if (word === currentTarget) {
            element.classList.add('target-word')
        }
        container.appendChild(element)
    })
}

document.getElementById('play-btn').addEventListener('click', async () => {
    document.getElementById('start-screen').style.display = 'none'
    document.getElementById('game-screen').style.display = 'flex'

    // Neues Spiel starten
    const response = await fetch('http://localhost:8000/new_round')
    const data = await response.json()

    currentTarget = data.target
    currentCandidates = data.candidates

    currentTarget = data.target
    currentCandidates = data.candidates
    renderCandidates()
})

document.getElementById('submit').addEventListener('click', async () => {
    const input = document.getElementById('guess-input').value

    const response = await fetch('http://localhost:8000/guess', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({guess: input, target: currentTarget, candidates: currentCandidates})
    })
    const data = await response.json()

    currentCandidates = data.candidates
    currentTarget = data.newTarget

    renderCandidates()
    document.getElementById('guess-input').value = ''

    if (data.gameOver) {
        alert('Game Over!')
    }
})

document.getElementById('guess-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('submit').click()
    }
})