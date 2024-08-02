document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        questionElement: document.getElementById('question-text'),
        questionNumberElement: document.getElementById('question-number'),
        optionsContainer: document.getElementById('options-container'),
        quizPage: document.getElementById('quiz-page'),
        hrPage: document.getElementById('hr-page'),
        initialPage: document.getElementById('initial-page'),
        quizButton: document.getElementById('quiz-button'),
        hrButton: document.getElementById('hr-button'),
        prevButton: document.getElementById('prev-button'),
        nextButton: document.getElementById('next-button'),
        submitButton: document.getElementById('submit-button'),
        backToInitialButton: document.getElementById('back-to-initial-button'),
        backToInitialButtonHr: document.getElementById('back-to-initial-button-hr'),
        banner: document.createElement('div'),
        loadingScreen: document.getElementById('loading-screen'),
        fileInput: document.getElementById('file-input'),
        uploadButton: document.getElementById('upload-button'),
        searchButton: document.getElementById('search-button'),
        downloadButton: document.getElementById('download-button'),
        responseMessage: document.getElementById('response-message'),
        searchResults: document.getElementById('search-results'),
        resultsTableBody: document.querySelector('#results-table tbody'),
        usernameInput: document.getElementById('username-input')
    };

    let currentQuestionIndex = 0;
    let questions = [];
    let previousQuestion = null;
    let selectedOption = null;
    const answers = [];
    const username = 'Rk'; // Update as needed

    // Initialize Banner
    elements.banner.className = 'banner';
    elements.banner.style.display = 'none';
    document.body.appendChild(elements.banner);

    // Button Event Listeners
    elements.quizButton.addEventListener('click', () => {
        elements.initialPage.style.display = 'none';
        elements.quizPage.style.display = 'block';
        fetchQuestions();
    });

    elements.hrButton.addEventListener('click', () => {
        elements.initialPage.style.display = 'none';
        elements.hrPage.style.display = 'block';
    });

    elements.backToInitialButton.addEventListener('click', () => {
        elements.quizPage.style.display = 'none';
        elements.initialPage.style.display = 'block';
    });

    elements.backToInitialButtonHr.addEventListener('click', () => {
        elements.hrPage.style.display = 'none';
        elements.initialPage.style.display = 'block';
    });

    elements.prevButton.addEventListener('click', showPreviousQuestion);

    elements.nextButton.addEventListener('click', () => {
        if (selectedOption) {
            updateAnswers();
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                showQuestion(currentQuestionIndex);
            } else {
                elements.submitButton.style.display = 'inline-block';
                elements.nextButton.style.display = 'none';
            }
        }
    });

    elements.submitButton.addEventListener('click', submitAllAnswers);

    async function fetchQuestions() {
        const timeoutDuration = 10000; // 10 seconds timeout duration
        let timeoutHandle;

        elements.loadingScreen.style.display = 'flex'; // Show loading screen

        try {
            // Set up timeout
            timeoutHandle = setTimeout(() => {
                elements.loadingScreen.querySelector('.loading-message').textContent = 'Loading is taking longer than expected...';
            }, timeoutDuration);

            const response = await fetch('https://xs9124zmx4.execute-api.ap-south-1.amazonaws.com/Dev/update-qus?bucketName=my-upload-bucket-0075&key=survey-question.xlsx');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            questions = Object.values(data);
            showQuestion(currentQuestionIndex);
        } catch (error) {
            console.error('Error fetching questions:', error);
            showBanner('Failed to fetch questions. 😔', 'error');
        } finally {
            clearTimeout(timeoutHandle); // Clear the timeout
            elements.loadingScreen.style.display = 'none'; // Hide loading screen
        }
    }

    function showQuestion(index) {
        if (index < 0 || index >= questions.length) return;

        const questionData = questions[index];
        elements.questionNumberElement.textContent = `Question ${index + 1}:`;
        elements.questionElement.textContent = questionData.Question;
        elements.optionsContainer.innerHTML = '';

        Object.keys(questionData).forEach(key => {
            if (key.startsWith('Option-')) {
                const button = document.createElement('button');
                button.textContent = questionData[key];
                button.className = 'option-button';
                button.addEventListener('click', () => handleOptionSelect(button));
                elements.optionsContainer.appendChild(button);
            }
        });

        previousQuestion = questionData;
        selectedOption = answers.find(answer => answer.question === questionData.Question)?.answer || null;

        if (selectedOption) {
            const buttons = elements.optionsContainer.querySelectorAll('.option-button');
            buttons.forEach(button => {
                if (button.textContent === selectedOption) {
                    button.classList.add('selected');
                }
            });
        }

        elements.nextButton.disabled = !selectedOption;
        elements.prevButton.disabled = index === 0;
        elements.nextButton.style.display = index === questions.length - 1 ? 'none' : 'inline-block';
        elements.submitButton.style.display = index === questions.length - 1 ? 'inline-block' : 'none';
    }

    function handleOptionSelect(button) {
        if (selectedOption) {
            const previousSelected = elements.optionsContainer.querySelector('.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
        }

        selectedOption = button.textContent;
        button.classList.add('selected');
        elements.nextButton.disabled = false;
    }

    function showPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    }

    function updateAnswers() {
        const existingAnswerIndex = answers.findIndex(answer => answer.question === previousQuestion.Question);
        if (existingAnswerIndex !== -1) {
            answers[existingAnswerIndex] = { question: previousQuestion.Question, answer: selectedOption };
        } else {
            answers.push({ question: previousQuestion.Question, answer: selectedOption });
        }
    }

    async function submitAllAnswers() {
        try {
            const response = await fetch('https://xs9124zmx4.execute-api.ap-south-1.amazonaws.com/Dev/upload_answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    answers: answers
                })
            });

            if (!response.ok) throw new Error('Failed to submit answers.');
            showBanner('Your answers have been submitted successfully! 🎉', 'success');
        } catch (error) {
            console.error('Error submitting answers:', error);
            showBanner('Failed to submit your answers. 😔', 'error');
        }
    }

    function showBanner(message, type) {
        elements.banner.textContent = message;
        elements.banner.style.display = 'block';
        elements.banner.className = `banner ${type}`;

        setTimeout(() => {
            elements.banner.style.display = 'none';
        }, 5000);
    }

    // HR Page functionality
    elements.uploadButton.addEventListener('click', async () => {
        if (elements.fileInput.files.length === 0) {
            elements.responseMessage.textContent = 'Please select a file to upload.';
            elements.responseMessage.className = 'error';
            return;
        }

        const file = elements.fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async function (e) {
            const fileContent = e.target.result;
            const base64FileContent = btoa(fileContent);
            const payload = {
                bucketName: 'my-upload-bucket-0075',
                fileName: file.name,
                fileContent: base64FileContent
            };

            try {
                const response = await fetch('https://xs9124zmx4.execute-api.ap-south-1.amazonaws.com/Dev/hr-upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Failed to upload file.');
                elements.responseMessage.textContent = 'File uploaded successfully!';
                elements.responseMessage.className = 'success';
            } catch (error) {
                console.error('Error uploading file:', error);
                elements.responseMessage.textContent = 'Failed to upload file.';
                elements.responseMessage.className = 'error';
            }
        };

        reader.readAsBinaryString(file);
    });

    elements.searchButton.addEventListener('click', async () => {
        const username = elements.usernameInput.value.trim(); // Get username from input field

        elements.responseMessage.textContent = '';
        elements.loadingScreen.style.display = 'flex';
        elements.searchResults.style.display = 'none';
        elements.downloadButton.style.display = 'none';

        let url = 'https://xs9124zmx4.execute-api.ap-south-1.amazonaws.com/Dev/hr-upload';
        if (username) {
            url += `?username=${encodeURIComponent(username)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch search results.');
            const data = await response.json();
            displaySearchResults(data);
        } catch (error) {
            console.error('Error fetching search results:', error);
            elements.responseMessage.textContent = 'Failed to fetch search results.';
            elements.responseMessage.className = 'error';
        } finally {
            elements.loadingScreen.style.display = 'none';
        }
    });

    function displaySearchResults(data) {
        elements.resultsTableBody.innerHTML = '';

        // Transform and display the data
        const usersData = {};

        data.forEach(item => {
            const username = item.username.replace('AttributeValue(S=', '').replace(')', '');
            const question = item.question.replace('AttributeValue(S=', '').replace(')', '');
            const answer = item.answer.replace('AttributeValue(S=', '').replace(')', '');

            if (!usersData[username]) {
                usersData[username] = [];
            }

            usersData[username].push({ question, answer });
        });

        Object.keys(usersData).forEach(username => {
            usersData[username].forEach(({ question, answer }) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${username}</td>
                    <td>${question}</td>
                    <td>${answer}</td>
                `;
                elements.resultsTableBody.appendChild(row);
            });
        });

        elements.searchResults.style.display = 'block';
        elements.downloadButton.style.display = 'inline-block';
    }

    elements.downloadButton.addEventListener('click', () => {
        const ws = XLSX.utils.table_to_sheet(document.getElementById('results-table'));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
        XLSX.writeFile(wb, 'search-results.xlsx');
    });

    // Page Navigation
    document.getElementById('quiz-nav-button').addEventListener('click', () => {
        elements.quizPage.style.display = 'block';
        elements.hrPage.style.display = 'none';
        elements.initialPage.style.display = 'none';
    });

    document.getElementById('hr-nav-button').addEventListener('click', () => {
        elements.hrPage.style.display = 'block';
        elements.quizPage.style.display = 'none';
        elements.initialPage.style.display = 'none';
    });
});
