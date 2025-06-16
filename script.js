// (重要) GASのウェブアプリのURLをここに貼り付けてください！
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxRxdF0wdY0jtKj29lZLmxSlctKsj1m_cb6itEFcj4P8LYUikmcT4nBng4RV_L3klsdtg/exec";

let questions = [];
let hints = {};
let currentQuestionIndex = 0;
let studentId = '';
let studentName = '';
let questionResults = []; // 各問題の回答結果を保存
let isFirstAttempt = true; // 2回目以降の回答を区別するためのフラグ

const appContent = document.getElementById('app-content');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('startButton');
const studentIdInput = document.getElementById('studentId');
const studentNameInput = document.getElementById('studentName');

// 初期化関数
async function initApp() {
    try {
        const [questionsResponse, hintsResponse] = await Promise.all([
            fetch('questions.json'),
            fetch('hints.json')
        ]);

        if (!questionsResponse.ok) throw new Error('questions.jsonの読み込みに失敗しました。');
        if (!hintsResponse.ok) throw new Error('hints.jsonの読み込みに失敗しました。');

        questions = await questionsResponse.json();
        const hintsArray = await hintsResponse.json();

        hints = hintsArray.reduce((acc, hint) => {
            acc[hint.hintId] = hint.hintText;
            return acc;
        }, {});

        console.log('データ読み込み完了:', { questions, hints });

        showStartScreen();

    } catch (error) {
        console.error('アプリの初期化中にエラーが発生しました:', error);
        appContent.innerHTML = `<p class="error">エラー: アプリデータの読み込みに失敗しました。<br>ブラウザのコンソールを確認してください。</p>`;
    }
}

function showStartScreen() {
    startScreen.style.display = 'block';
    appContent.innerHTML = '';
    appContent.appendChild(startScreen);
    appContent.style.display = 'block';
}

startButton.addEventListener('click', () => {
    studentId = studentIdInput.value.trim();
    studentName = studentNameInput.value.trim();

    if (studentId === '' || studentName === '') {
        alert('学籍番号と氏名を入力してください。');
        return;
    }

    isFirstAttempt = true; 
    currentQuestionIndex = 0;
    questionResults = []; 

    startScreen.style.display = 'none';
    displayQuestion();
});

// 問題を表示する関数
function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        displayResults();
        return;
    }

    const question = questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;

    let choicesHtml = '';
    if (question.type === 'MC') {
        question.choices.forEach(choice => {
            choicesHtml += `<button data-choice="${choice}">${choice}</button>`;
        });
    } else if (question.type === 'TF') {
        choicesHtml += `<button data-choice="TRUE">True</button>`;
        choicesHtml += `<button data-choice="FALSE">False</button>`;
    }

    appContent.innerHTML = `
        <div class="question-screen screen">
            <h2>問題 ${questionNumber} / ${questions.length}</h2>
            <p class="instruction">
                ${question.type === 'MC' ? '正しい選択肢を選んでください。' : 'TrueまたはFalseを選んでください。'}
            </p>
            <div class="question-area">
                <p class="question-text">${question.questionText}</p>
                <div class="choices">
                    ${choicesHtml}
                </div>
            </div>
            <div id="feedback-area"></div>
            <button id="submitAnswerButton" style="display: none;">回答する</button>
            <button id="nextQuestionButton" style="display: none;">次の問題へ</button>
            <div class="footer-info">
                © 2025 文法テストアプリ
            </div>
        </div>
    `;

    const choiceButtons = appContent.querySelectorAll('.choices button');
    const submitAnswerButton = document.getElementById('submitAnswerButton');
    const nextQuestionButton = document.getElementById('nextQuestionButton');
    const feedbackArea = document.getElementById('feedback-area');

    let selectedChoice = null;

    // ★追加または修正するロジック開始★
    // もし既に回答済みの問題であれば、以前の選択とフィードバックを表示する
    const previousResult = questionResults.find(r => r.questionId === question.id);
    if (previousResult) {
        selectedChoice = previousResult.userAnswer; // 以前の選択肢を取得
        
        // 選択肢をハイライト
        choiceButtons.forEach(button => {
            if (button.dataset.choice === selectedChoice) {
                button.classList.add('selected');
            }
            button.disabled = true; // 選択済みの問題では選択肢を無効化
        });

        // フィードバックとヒントを再表示
        const isCorrect = (selectedChoice === question.answer);
        const feedbackText = isCorrect ? question.feedback_correct : question.feedback_wrong;
        const hintText = (!isCorrect && question.hintId && hints[question.hintId]) ? hints[question.hintId] : '';

        feedbackArea.innerHTML = `
            <div class="feedback ${isCorrect ? 'correct' : 'wrong'}">
                ${isCorrect ? '✅ 正解！' : '❌ 不正解！'} ${feedbackText}
            </div>
            ${hintText ? `<div class="hint">${hintText}</div>` : ''}
        `;
        feedbackArea.style.display = 'block';

        submitAnswerButton.style.display = 'none'; // 回答ボタンは不要
        nextQuestionButton.style.display = 'block'; // 次へボタンを表示

    } else {
        // 新しい問題の場合のイベントリスナー
        choiceButtons.forEach(button => {
            button.addEventListener('click', () => {
                choiceButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedChoice = button.dataset.choice;
                submitAnswerButton.style.display = 'block';
            });
        });

        submitAnswerButton.addEventListener('click', () => {
            if (selectedChoice === null) {
                alert('選択肢を選んでください。');
                return;
            }

            const isCorrect = (selectedChoice === question.answer); 
            const feedbackText = isCorrect ? question.feedback_correct : question.feedback_wrong;
            const hintText = (!isCorrect && question.hintId && hints[question.hintId]) ? hints[question.hintId] : '';

            feedbackArea.innerHTML = `
                <div class="feedback ${isCorrect ? 'correct' : 'wrong'}">
                    ${isCorrect ? '✅ 正解！' : '❌ 不正解！'} ${feedbackText}
                </div>
                ${hintText ? `<div class="hint">${hintText}</div>` : ''}
            `;
            feedbackArea.style.display = 'block';

            questionResults.push({
                questionId: question.id,
                questionText: question.questionText,
                userAnswer: selectedChoice,
                correctAnswer: question.answer,
                isCorrect: isCorrect,
                attemptTime: new Date().toISOString()
            });

            submitAnswerButton.style.display = 'none';
            choiceButtons.forEach(btn => btn.disabled = true);
            nextQuestionButton.style.display = 'block';
        });
    }
    // ★追加または修正するロジック終了★

    nextQuestionButton.addEventListener('click', () => {
        currentQuestionIndex++;
        displayQuestion();
    });
}

// 結果表示とデータ送信 (この部分は前回の修正と同じ)
async function displayResults() {
    const totalQuestions = questions.length;
    const totalCorrect = questionResults.filter(q => q.isCorrect).length;
    const averageScore = ((totalCorrect / totalQuestions) * 100).toFixed(2);

    appContent.innerHTML = `
        <div class="results-screen screen">
            <h2>テスト終了！</h2>
            <p><strong>学籍番号:</strong> ${studentId}</p>
            <p><strong>氏名:</strong> ${studentName}</p>
            <p>正解数: ${totalCorrect} / ${totalQuestions}</p>
            <p>平均点: ${averageScore}%</p>

            <p>このテストの結果を送信しますか？</p>
            <button id="sendResultsButton">結果を送信する</button>
            <button id="restartTestButton">もう一度テストを始める</button>
            <div id="submissionMessage" style="margin-top: 15px; font-weight: bold;"></div>
            <div class="footer-info">
                © 2025 文法テストアプリ
            </div>
        </div>
    `;

    const sendResultsButton = document.getElementById('sendResultsButton');
    const restartTestButton = document.getElementById('restartTestButton');
    const submissionMessageElement = document.getElementById('submissionMessage');

    sendResultsButton.addEventListener('click', async () => {
        if (!isFirstAttempt) {
            submissionMessageElement.textContent = '⚠ 2回目以降の回答は送信されません。';
            submissionMessageElement.style.color = 'orange';
            sendResultsButton.disabled = true;
            return;
        }

        sendResultsButton.disabled = true;
        submissionMessageElement.textContent = '送信中...';
        submissionMessageElement.style.color = 'blue';

        const dataToSend = {
            studentId: studentId,
            studentName: studentName,
            totalCorrect: totalCorrect,
            totalQuestions: totalQuestions,
            averageScore: parseFloat(averageScore),
            submissionTime: new Date().toISOString(),
            questionResults: questionResults
        };

        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                submissionMessageElement.textContent = '✅ 結果が正常に送信されました！';
                submissionMessageElement.style.color = 'green';
                isFirstAttempt = false;
            } else {
                console.error('GASからのエラー応答:', result.message || '不明なエラー');
                submissionMessageElement.textContent = `❌ データの送信に失敗しました: ${result.message || 'サーバーエラー'}`;
                submissionMessageElement.style.color = 'red';
                sendResultsButton.disabled = false;
            }

        } catch (error) {
            console.error('データの送信中にエラーが発生しました:', error);
            submissionMessageElement.textContent = '❌ データの送信に失敗しました。ネットワーク接続を確認してください。';
            submissionMessageElement.style.color = 'red';
            sendResultsButton.disabled = false;
        }
    });

    restartTestButton.addEventListener('click', () => {
        studentIdInput.value = '';
        studentNameInput.value = '';
        showStartScreen();
    });
}

initApp();