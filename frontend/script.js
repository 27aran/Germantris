let currentTarget = null
let currentCandidates = []
let score = 0
let hitCount = 0
let difficultyTimer = null
let isAnimating = false

const HIT_POINTS = [40, 30, 20, 10]  // top1, top2, top3, top4
const DIFFICULTY_START_HIT = 4
const DIFFICULTY_INTERVAL_MS = 2000
const MAX_CANDIDATES = 14

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function renderCandidates() {
    const container = document.getElementById('candidates')
    container.innerHTML = ''  // leeren

    currentCandidates.slice().reverse().forEach(word => {
        const element = document.createElement('p')
        element.textContent = word
        element.dataset.word = word
        if (word === currentTarget) {
            element.classList.add('target-word')
        }
        container.appendChild(element)
    })

    updateKillLine()
}

// Zeigt an, ab wo (die letzten 4 Wörter, nah an der Eingabe) ein Treffer zählt
function updateKillLine() {
    const line = document.getElementById('kill-line')
    const container = document.getElementById('candidates')
    const items = container.querySelectorAll('p')

    if (items.length < 4) {
        line.style.display = 'none'
        return
    }

    const boundaryEl = items[items.length - 4]
    const aboveEl = items[items.length - 5] || null
    const boundaryRect = boundaryEl.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const top = aboveEl
        ? (aboveEl.getBoundingClientRect().bottom + boundaryRect.top) / 2
        : boundaryRect.top - 6

    line.style.display = 'block'
    line.style.top = `${top}px`
    line.style.left = `${containerRect.left - 20}px`
    line.style.width = `${containerRect.width + 40}px`
}

function updateScoreDisplay() {
    const el = document.getElementById('score')
    el.textContent = score
    el.classList.remove('pop')
    void el.offsetWidth  // reflow erzwingen, damit die Animation neu startet
    el.classList.add('pop')
}

async function startNewRound() {
    stopDifficultyTimer()
    score = 0
    hitCount = 0
    updateScoreDisplay()

    const response = await fetch('http://localhost:8000/new_round')
    const data = await response.json()

    currentTarget = data.target
    currentCandidates = data.candidates

    renderCandidates()
}

function triggerGameOver() {
    stopDifficultyTimer()
    document.getElementById('game-screen').style.display = 'none'
    document.getElementById('final-score').textContent = score
    document.getElementById('gameover-screen').style.display = 'flex'
}

// Ab dem 4. Treffer wird alle 2 Sekunden ein neues Wort nachgelegt
function startDifficultyTimer() {
    if (difficultyTimer) return
    difficultyTimer = setInterval(async () => {
        if (isAnimating) return  // nicht mitten in eine laufende Animation reinfunken

        try {
            const response = await fetch('http://localhost:8000/add_word', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({candidates: currentCandidates})
            })
            const data = await response.json()

            currentCandidates.push(data.word)
            isAnimating = true
            await slideInNewWord(data.word)
            updateKillLine()
            isAnimating = false

            if (currentCandidates.length >= MAX_CANDIDATES) {
                triggerGameOver()
            }
        } catch (e) {
            console.error(e)
            isAnimating = false
        }
    }, DIFFICULTY_INTERVAL_MS)
}

// Das Backend kennt beim Wählen des neuen Targets nicht die aktuelle visuelle
// Reihenfolge (die entsteht erst hier im Frontend durch animateSort). Direkt nach
// einem Hit landen die nächstbesten Treffer (sorted_words[4..7]) in der Kill-Zone,
// weil neue Wörter oben einsteigen. Fällt das vom Backend gewählte Target dort hinein,
// wählen wir stattdessen selbst eines, das garantiert nicht schon in der Zone sitzt.
function resolveSafeTarget(data) {
    if (!data.hit) return data.newTarget

    const killZoneWords = data.sorted_words.slice(4, 8)
    if (!killZoneWords.includes(data.newTarget)) return data.newTarget

    const safePool = data.candidates.filter(w => !killZoneWords.includes(w))
    if (!safePool.length) return data.newTarget

    return safePool[Math.floor(Math.random() * safePool.length)]
}

function stopDifficultyTimer() {
    if (difficultyTimer) {
        clearInterval(difficultyTimer)
        difficultyTimer = null
    }
}

document.getElementById('play-btn').addEventListener('click', async () => {
    document.getElementById('start-screen').style.display = 'none'
    document.getElementById('game-screen').style.display = 'flex'
    await startNewRound()
})

document.getElementById('replay-btn').addEventListener('click', async () => {
    document.getElementById('gameover-screen').style.display = 'none'
    document.getElementById('game-screen').style.display = 'flex'
    await startNewRound()
})

document.getElementById('home').addEventListener('click', () => {
    stopDifficultyTimer()
    document.getElementById('game-screen').style.display = 'none'
    document.getElementById('gameover-screen').style.display = 'none'
    document.getElementById('start-screen').style.display = 'flex'
})

// 1. Wörter sortieren sich nach dem Guess (FLIP-Animation: alte Position merken,
//    neu anordnen, dann von alter zu neuer Position animieren)
function animateSort(sortedWords, target) {
    const container = document.getElementById('candidates')
    const oldRects = new Map()
    container.querySelectorAll('p').forEach(el => {
        oldRects.set(el.dataset.word, el.getBoundingClientRect())
    })

    container.innerHTML = ''
    // sortedWords[0] = beste Übereinstimmung. Der Container ist unten (bottom: 80px)
    // verankert, das zuletzt angehängte Element landet also visuell UNTEN, nah an der
    // Eingabe. Die "Top 4" (beste Treffer, die bei einem Hit entfernt werden) müssen
    // deshalb als LETZTE Elemente angehängt werden, nicht als erste.
    sortedWords.slice().reverse().forEach((word, reversedIndex) => {
        const originalIndex = sortedWords.length - 1 - reversedIndex
        const el = document.createElement('p')
        el.textContent = word
        el.dataset.word = word
        if (word === target) el.classList.add('target-word')
        if (originalIndex < 4) el.classList.add('top-word')
        container.appendChild(el)
    })

    container.querySelectorAll('p').forEach(el => {
        const oldRect = oldRects.get(el.dataset.word)
        if (!oldRect) return
        const newRect = el.getBoundingClientRect()
        const dy = oldRect.top - newRect.top
        if (dy) {
            el.style.transition = 'none'
            el.style.transform = `translateY(${dy}px)`
        }
    })

    void container.offsetHeight  // reflow erzwingen

    container.querySelectorAll('p').forEach(el => {
        el.style.transition = 'transform 0.45s ease'
        el.style.transform = ''
    })
}

// 2. Top 4 leuchten auf (nur bei einem tatsächlichen Hit)
function setTopGlow(on) {
    document.querySelectorAll('#candidates p.top-word').forEach(el => {
        el.classList.toggle('glow', on)
    })
}

// Kein Hit: statt alle 4 leuchten zu lassen, pulsiert nur das Zielwort selbst in Amber
async function nearMissFeedback(rank) {
    const targetEl = document.querySelector('#candidates p.target-word')
    if (!targetEl || rank < 0) return

    targetEl.classList.add('near-pulse')
    await wait(800)
    targetEl.classList.remove('near-pulse')
}

// ... und faden aus, wenn Hit
async function fadeOutTop() {
    const topEls = document.querySelectorAll('#candidates p.top-word')
    topEls.forEach(el => el.classList.add('fade-out'))
    await wait(380)
    topEls.forEach(el => el.remove())
}

// 3. Neue Wörter faden oben rein (bei Hit)
async function fadeInNewWords(words) {
    if (!words.length) return
    const container = document.getElementById('candidates')
    const frag = document.createDocumentFragment()
    const els = []
    words.forEach(word => {
        const el = document.createElement('p')
        el.textContent = word
        el.dataset.word = word
        el.style.opacity = '0'
        frag.appendChild(el)
        els.push(el)
    })
    container.prepend(frag)

    void container.offsetHeight  // reflow erzwingen

    els.forEach((el, i) => {
        el.style.transitionDelay = `${i * 90}ms`
        el.style.opacity = '1'
    })
    await wait(350 + (words.length - 1) * 90)
    els.forEach(el => { el.style.transitionDelay = '' })
}

// 4. Bei keinem Hit fährt ein neues Wort oben rein
async function slideInNewWord(word) {
    const container = document.getElementById('candidates')
    const el = document.createElement('p')
    el.textContent = word
    el.dataset.word = word
    el.style.opacity = '0'
    el.style.transform = 'translateY(-30px)'
    container.prepend(el)

    void container.offsetHeight  // reflow erzwingen

    el.style.transition = 'transform 0.4s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
    await wait(400)
    el.style.transition = ''
    el.style.transform = ''
}

document.getElementById('submit').addEventListener('click', async () => {
    if (isAnimating) return

    const input = document.getElementById('guess-input').value
    if (!input) return

    isAnimating = true
    try {
        const response = await fetch('http://localhost:8000/guess', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({guess: input, target: currentTarget, candidates: currentCandidates})
        })
        const data = await response.json()
        document.getElementById('guess-input').value = ''

        if (data.invalid) {
            currentCandidates = data.candidates
            currentTarget = data.newTarget
            const targetElement = document.querySelector('.target-word')
            if (targetElement) {
                targetElement.classList.add('invalid-word')
                setTimeout(() => targetElement.classList.remove('invalid-word'), 500)
            }
            return
        }

        // 1. Sortieren
        animateSort(data.sorted_words, currentTarget)
        await wait(450)

        // Inline-Styles der FLIP-Animation zurücksetzen, damit die
        // CSS-Transitions für Glow/Fade wieder greifen
        document.querySelectorAll('#candidates p').forEach(el => {
            el.style.transition = ''
            el.style.transform = ''
        })
        updateKillLine()

        const newWords = data.candidates.filter(w => !data.sorted_words.includes(w))
        const rank = data.sorted_words.indexOf(currentTarget)

        if (data.hit) {
            // 2. Top 4 leuchten auf (nur weil das Target tatsächlich dort gelandet ist)
            setTopGlow(true)
            await wait(400)

            hitCount++

            // Punkte je nach Position des Targets in der sortierten Liste
            if (rank >= 0 && rank < HIT_POINTS.length) {
                score += HIT_POINTS[rank]
                updateScoreDisplay()
            }

            // ... und faden aus
            await fadeOutTop()
            // 3. Neue Wörter faden oben rein
            await fadeInNewWords(newWords)

            if (hitCount === DIFFICULTY_START_HIT) {
                startDifficultyTimer()
            }
        } else {
            // Kein Hit: Zielwort pulsiert und zeigt die Distanz zur Zone
            await nearMissFeedback(rank)
            // 4. Neues Wort fährt oben rein
            if (newWords.length) {
                await slideInNewWord(newWords[0])
            }
        }

        // Zielwort final markieren (kann sich bei einem Hit geändert haben)
        const safeTarget = resolveSafeTarget(data)
        document.querySelectorAll('#candidates p').forEach(el => {
            el.classList.toggle('target-word', el.dataset.word === safeTarget)
        })

        currentCandidates = data.candidates
        currentTarget = safeTarget
        updateKillLine()

        if (data.gameOver) {
            await wait(300)
            triggerGameOver()
        }
    } finally {
        isAnimating = false
    }
})

document.getElementById('guess-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('submit').click()
    }
})
