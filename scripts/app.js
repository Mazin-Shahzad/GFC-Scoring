document.addEventListener('DOMContentLoaded', function () {
    const showLoading = () => {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        document.body.appendChild(spinner);
    };

    const hideLoading = () => {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) {
            document.body.removeChild(spinner);
        }
    };

    // Handle initial form submission
    const initialForm = document.getElementById('initial-form');
    if (initialForm) {
        initialForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const fighter1 = document.getElementById('fighter1').value.trim();
            const fighter2 = document.getElementById('fighter2').value.trim();
            const rounds = parseInt(document.getElementById('rounds').value, 10);

            if (fighter1.length < 2 || fighter2.length < 2) {
                document.getElementById('form-feedback').innerText = 'Fighter names must be at least 2 characters long.';
                return;
            }

            localStorage.setItem('fighter1', fighter1);
            localStorage.setItem('fighter2', fighter2);
            localStorage.setItem('rounds', rounds);

            window.location.href = 'scoring.html';
        });
    }

    // Handle scoring form submission
    const scoringForm = document.getElementById('scoring-form');
    if (scoringForm) {
        const fighter1 = localStorage.getItem('fighter1');
        const fighter2 = localStorage.getItem('fighter2');
        const rounds = parseInt(localStorage.getItem('rounds'), 10);

        const tablesContainer = document.getElementById('fighter-tables');
        if (tablesContainer) {
            const createTable = (fighterName) => {
                const roundHeaders = Array.from({ length: rounds }, (_, i) => `<th>Round ${i + 1}</th>`).join('');
                
                const categories = ['Clean Punches Landed', 'Effective Aggression', 'Ring Generalship', 'Defense'];
                const rows = categories.map(category => `
                    <tr>
                        <td>${category}</td>
                        ${Array.from({ length: rounds }, () => `<td><input type="number" min="0" max="10" step="0.01" value="" class="score-input"></td>`).join('')}
                    </tr>
                `).join('');
                
                return `
                    <table>
                        <thead>
                            <tr>
                                <th>${fighterName}</th>
                                ${roundHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                            <tr>
                                <td>Average Score /10</td>
                                ${Array.from({ length: rounds }, () => `<td><input type="number" min="0" max="10" step="0.01" readonly></td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                `;
            };

            showLoading();
            tablesContainer.innerHTML = `
                ${createTable(fighter1)}
                ${createTable(fighter2)}
            `;
            hideLoading();

            const validateInput = (event) => {
                const input = event.target;
                let value = parseFloat(input.value);
                if (isNaN(value) || value < 0) {
                    input.value = '';
                } else if (value > 10) {
                    input.value = '10';
                } else {
                    input.value = value.toFixed(2);
                }
                updateAverages();
            };

            const updateAverages = () => {
                const tables = document.querySelectorAll('table');
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tbody tr');
                    const roundTotals = Array.from({ length: rounds }, () => 0);
                    let categoryCounts = 0;

                    rows.forEach(row => {
                        const inputs = row.querySelectorAll('input.score-input');
                        const scores = Array.from(inputs).map(input => parseFloat(input.value) || 0);
                        
                        if (scores.length) {
                            scores.forEach((score, idx) => {
                                if (idx < rounds) {
                                    roundTotals[idx] += score;
                                }
                            });
                            categoryCounts++;
                        }
                    });

                    const averageCells = table.querySelectorAll('tbody tr:last-child td');
                    averageCells.forEach((cell, idx) => {
                        if (idx > 0 && idx <= rounds) {
                            const avg = categoryCounts ? roundTotals[idx - 1] / categoryCounts : 0;
                            cell.querySelector('input').value = avg.toFixed(2);
                        }
                    });
                });
            };

            document.querySelectorAll('.score-input').forEach(input => {
                input.addEventListener('blur', validateInput);
                input.addEventListener('input', updateAverages);
            });

            scoringForm.addEventListener('submit', function (e) {
                e.preventDefault();

                const tables = document.querySelectorAll('table');
                let totalFighter1 = 0;
                let totalFighter2 = 0;

                const allRoundAverages1 = [];
                const allRoundAverages2 = [];

                tables.forEach((table, index) => {
                    const averageCells = table.querySelectorAll('tbody tr:last-child td');
                    let total = 0;

                    averageCells.forEach((cell, idx) => {
                        if (idx > 0) {
                            const avgScore = parseFloat(cell.querySelector('input').value) || 0;
                            total += avgScore;

                            if (index === 0) {
                                allRoundAverages1.push(avgScore);
                            } else {
                                allRoundAverages2.push(avgScore);
                            }
                        }
                    });

                    if (index === 0) {
                        totalFighter1 = total;
                    } else {
                        totalFighter2 = total;
                    }
                });

                localStorage.setItem('totalFighter1', totalFighter1);
                localStorage.setItem('totalFighter2', totalFighter2);
                localStorage.setItem('roundAverages1', JSON.stringify(allRoundAverages1));
                localStorage.setItem('roundAverages2', JSON.stringify(allRoundAverages2));

                window.location.href = 'results.html';
            });
        }
    }

    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        const fighter1 = localStorage.getItem('fighter1');
        const fighter2 = localStorage.getItem('fighter2');
        const rounds = parseInt(localStorage.getItem('rounds'), 10);
        const totalFighter1 = parseFloat(localStorage.getItem('totalFighter1')) || 0;
        const totalFighter2 = parseFloat(localStorage.getItem('totalFighter2')) || 0;
        const roundAverages1 = JSON.parse(localStorage.getItem('roundAverages1')) || [];
        const roundAverages2 = JSON.parse(localStorage.getItem('roundAverages2')) || [];

        const winner = totalFighter1 > totalFighter2 ? fighter1 : (totalFighter2 > totalFighter1 ? fighter2 : 'Draw');

        let roundsComparison = '';
        for (let i = 0; i < rounds; i++) {
            roundsComparison += `
                <tr>
                    <td>Round ${i + 1}</td>
                    <td>${roundAverages1[i].toFixed(2)}</td>
                    <td>${roundAverages2[i].toFixed(2)}</td>
                </tr>
            `;
        }

        resultsContainer.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Round</th>
                        <th>${fighter1}</th>
                        <th>${fighter2}</th>
                    </tr>
                </thead>
                <tbody>
                    ${roundsComparison}
                </tbody>
                <tfoot>
                    <tr>
                        <td>Total</td>
                        <td>${totalFighter1.toFixed(2)}</td>
                        <td>${totalFighter2.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3"><h2>Winner: ${winner}</h2></td>
                    </tr>
                </tfoot>
            </table>
        `;
    }
});
