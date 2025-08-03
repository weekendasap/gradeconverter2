document.addEventListener('DOMContentLoaded', () => {
    const schoolNameInput = document.getElementById('schoolName');
    const totalStudentsInput = document.getElementById('totalStudents');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultSchoolInfo = document.getElementById('resultSchoolInfo');
    const gradeResultsDiv = document.getElementById('gradeResults');
    const overallPercentageDiv = document.getElementById('overallPercentage');
    const aiAdviceDiv = document.getElementById('aiAdvice');
    const gradeChartCtx = document.getElementById('gradeChart').getContext('2d');
    const scoreRankChangeChartCtx = document.getElementById('scoreRankChangeChart').getContext('2d');
    const showScoreChartBtn = document.getElementById('showScoreChartBtn');
    const showRankChartBtn = document.getElementById('showRankChartBtn');


    let gradeChart; // 등급 막대 차트 객체
    let scoreRankChangeChart; // 점수/등수 변화 꺾은선 차트 객체
    let currentChartType = 'score'; // 기본은 점수 그래프

    // 주요 6과목 정보 (1학년 1학기 점수, 등수 입력)
    const majorSubjects = [
        { name: '국어', midScoreId1: 'koreanMidScore1', midRankId1: 'koreanMidRank1', finalScoreId1: 'koreanFinalScore1', finalRankId1: 'koreanFinalRank1' },
        { name: '영어', midScoreId1: 'englishMidScore1', midRankId1: 'englishMidRank1', finalScoreId1: 'englishFinalScore1', finalRankId1: 'englishFinalRank1' },
        { name: '수학', midScoreId1: 'mathMidScore1', midRankId1: 'mathMidRank1', finalScoreId1: 'mathFinalScore1', finalRankId1: 'mathFinalRank1' },
        { name: '과학', midScoreId1: 'scienceMidScore1', midRankId1: 'scienceMidRank1', finalScoreId1: 'scienceFinalScore1', finalRankId1: 'scienceFinalRank1' },
        { name: '한국사', midScoreId1: 'koreanHistoryMidScore1', midRankId1: 'koreanHistoryMidRank1', finalScoreId1: 'koreanHistoryFinalScore1', finalRankId1: 'koreanHistoryFinalRank1' },
        { name: '사회', midScoreId1: 'socialMidScore1', midRankId1: 'socialMidRank1', finalScoreId1: 'socialFinalScore1', finalRankId1: 'socialFinalRank1' }
    ];

    // 예체능 과목 (1학년 1학기 기말고사에만 1~5등급 선택)
    const artsSubjects = [
        { name: '음악', id1: 'musicGrade1' },
        { name: '체육', id1: 'peGrade1' },
        { name: '미술', id1: 'artGrade1' }
    ];

    // 백분위를 9등급제로 변환하는 함수
    function convertPercentileTo9Grade(percentile) {
        if (percentile <= 4) return 1;
        else if (percentile <= 11) return 2;
        else if (percentile <= 23) return 3;
        else if (percentile <= 40) return 4;
        else if (percentile <= 60) return 5;
        else if (percentile <= 77) return 6;
        else if (percentile <= 89) return 7;
        else if (percentile <= 96) return 8;
        else return 9;
    }

    // 5등급제 등급을 9등급제 등급으로 변환 (예체능 과목용)
    function convert5GradeTo9Grade(grade5) {
        switch (grade5) {
            case 1: return 1.5;
            case 2: return 3.5;
            case 3: return 5.5;
            case 4: return 7.5;
            case 5: return 9;
            default: return null;
        }
    }

    // 9등급제 등급을 5등급제로 변환하는 함수
    function convert9GradeTo5Grade(grade9) {
        if (grade9 <= 2) return 1;
        else if (grade9 <= 4) return 2;
        else if (grade9 <= 6) return 3;
        else if (grade9 <= 8) return 4;
        else return 5;
    }

    // 점수를 성취도로 변환하는 함수
    function convertScoreToAchievement(score) {
        if (score >= 90) return 'A';
        else if (score >= 80) return 'B';
        else if (score >= 70) return 'C';
        else if (score >= 60) return 'D';
        else return 'E';
    }

    // 등급 분포 막대 차트 그리기 함수
    function drawGradeChart(myGrade9_1, myGrade5_1) { // 1학기 데이터만 받음
        if (gradeChart) {
            gradeChart.destroy();
        }

        const labels = ['1등급', '2등급', '3등급', '4등급', '5등급', '6등급', '7등급', '8등급', '9등급'];
        const totalStudents = parseInt(totalStudentsInput.value);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: '9등급제 분포 (학교 인원 기준)',
                    data: [
                        totalStudents * 0.04, totalStudents * 0.07, totalStudents * 0.12, totalStudents * 0.17,
                        totalStudents * 0.20, totalStudents * 0.17, totalStudents * 0.12, totalStudents * 0.07, totalStudents * 0.04
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)', // 파란색
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    stack: 'grades'
                },
                {
                    label: '5등급제 분포 (참고용)',
                    data: [
                        totalStudents * (0.04 + 0.07), // 1+2등급 -> 1등급 (11%)
                        totalStudents * (0.12 + 0.17), // 3+4등급 -> 2등급 (29%)
                        totalStudents * (0.20 + 0.17), // 5+6등급 -> 3등급 (37%)
                        totalStudents * (0.12 + 0.07), // 7+8등급 -> 4등급 (19%)
                        totalStudents * 0.04  // 9등급 -> 5등급 (4%)
                    ].concat(Array(4).fill(0)), // 5등급제는 5개 등급만 있으므로 나머지 4개는 0
                    backgroundColor: 'rgba(75, 192, 192, 0.5)', // 녹색
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    stack: 'grades',
                    hidden: true // 기본적으로 숨김
                }
            ]
        };

        // 나의 1학기 9등급제 위치
        if (myGrade9_1 !== null) {
            data.datasets.push({
                label: '나의 1학기 위치 (9등급제)',
                data: Array(Math.round(myGrade9_1) - 1).fill(0).concat([totalStudents * 0.01]),
                backgroundColor: 'rgba(255, 99, 132, 1)', // 빨간색
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                stack: 'myGrade9',
                order: 0 // 항상 상위에 표시
            });
        }
         // 나의 1학기 5등급제 위치 (숨김)
        if (myGrade5_1 !== null) {
            data.datasets.push({
                label: '나의 1학기 위치 (5등급제)',
                data: Array(myGrade5_1 - 1).fill(0).concat([totalStudents * 0.01]).concat(Array(4).fill(0)), // 5등급제는 5개 등급만 있으므로 나머지 4개는 0
                backgroundColor: 'rgba(255, 159, 64, 1)', // 주황색
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
                stack: 'myGrade5',
                order: 0,
                hidden: true
            });
        }


        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: '등급'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '학생 수'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '명';
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `학교 내 등급별 분포 (나의 1학기 평균: 9등급제 ${myGrade9_1?.toFixed(1) || '-'}등급)`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (label.includes('나의')) {
                                    if (label.includes('1학기') && label.includes('9등급제')) label = `1학기 9등급제: ${myGrade9_1.toFixed(1)}등급`;
                                    else if (label.includes('1학기') && label.includes('5등급제')) label = `1학기 5등급제: ${myGrade5_1}등급`;
                                    else label = `값: ${context.parsed.y}`; // 기본 값
                                } else {
                                    label += context.parsed.y + '명';
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        };

        gradeChart = new Chart(gradeChartCtx, {
            type: 'bar',
            data: data,
            options: options
        });
    }

    // 과목별 점수/등수 꺾은선 그래프 그리기 함수 (이제 1학기 데이터만 사용)
    function drawScoreRankChangeChart(subjectData1, chartType) {
        if (scoreRankChangeChart) {
            scoreRankChangeChart.destroy();
        }

        const labels = majorSubjects.map(s => s.name);
        let dataValues, yAxisLabel, chartTitle;

        if (chartType === 'score') {
            dataValues = labels.map(name => subjectData1.find(s => s.name === name)?.avgScore || null);
            yAxisLabel = '평균 점수';
            chartTitle = '1학년 1학기 과목별 평균 점수';
        } else { // chartType === 'rank'
            dataValues = labels.map(name => subjectData1.find(s => s.name === name)?.avgRank || null);
            yAxisLabel = '평균 등수';
            chartTitle = '1학년 1학기 과목별 평균 등수';
        }

        const data = {
            labels: labels,
            datasets: [
                {
                    label: '1학기 평균',
                    data: dataValues,
                    borderColor: 'rgba(75, 192, 192, 1)', // 민트색
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '과목'
                    }
                },
                y: {
                    beginAtZero: chartType === 'score' ? true : false, // 등수는 0부터 시작 안해도 됨
                    max: chartType === 'score' ? 100 : parseInt(totalStudentsInput.value) * 1.1, // 점수는 100, 등수는 전체 학생 수 기반
                    reverse: chartType === 'rank' ? true : false, // 등수는 낮을수록 좋으므로 역순
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    ticks: {
                        callback: function(value) {
                            return value + (chartType === 'score' ? '점' : '등');
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: chartTitle
                }
            }
        };

        scoreRankChangeChart = new Chart(scoreRankChangeChartCtx, {
            type: 'line',
            data: data,
            options: options
        });
    }

    // AI 조언 생성 함수 (1학년 1학기 데이터만 사용)
    function generateAiAdvice(schoolName, myAvgGrade9_1, myPercentile1, majorSubjectGrades1) {
        let advice = `<p><strong>${schoolName || '학생'}님의 1학년 1학기 성적 분석 및 입시 방향:</strong></p>`;

        // 전체적인 성적 추이 분석 (현재는 1학기만 있으므로, 미래 학기 예상 조언)
        if (myAvgGrade9_1) {
            advice += `<p><strong>📈 1학년 1학기(${myAvgGrade9_1.toFixed(1)}등급) 성적:</strong> 고등학교 첫 학년, 첫 학기 성적입니다. 이 성적을 바탕으로 앞으로의 학습 방향을 설정하는 것이 중요합니다.</p>`;
        } else {
             advice += `<p>성적을 입력하시면 1학년 1학기 성적에 대한 분석을 제공해 드릴 수 있습니다.</p>`;
        }


        // 학기별 등급에 따른 일반 조언 (1학기 성적만 고려)
        const currentAvgGrade = myAvgGrade9_1;
        if (currentAvgGrade) {
            if (currentAvgGrade <= 2.0) {
                advice += `<p>매우 우수한 성적입니다! 현재 페이스를 잘 유지하면 인서울 상위권 대학 진학에 매우 유리합니다. 심화 학습과 함께 관심 분야의 탐구 활동을 적극적으로 이어나가세요.</p>`;
            } else if (currentAvgGrade <= 4.0) {
                advice += `<p>상위권에 속하는 좋은 성적입니다. 특정 과목에서 강점을 보완하고 약점을 개선하면 더욱 좋은 결과를 기대할 수 있습니다. 목표 대학의 입시 요강을 자세히 살펴보고 전략적인 과목별 학습 계획을 세우세요.</p>`;
            } else if (currentAvgGrade <= 6.0) {
                advice += `<p>중위권에 해당하는 성적입니다. 아직 충분히 성적을 올릴 기회가 많습니다. 주요 과목의 기초를 탄탄히 다지고, 학습 습관을 점검하여 효율성을 높이는 데 집중하세요. 비교과 활동도 함께 고민하여 강점을 어필할 수 있는 요소를 찾아보세요.</p>`;
            } else {
                advice += `<p>아직은 개선할 부분이 많은 성적입니다. 좌절하기보다는 긍정적인 마음으로 학습 방법을 전면적으로 재검토해야 합니다. 기본적인 개념 이해와 문제 풀이 능력을 향상시키는 데 집중하고, 학교 선생님이나 멘토에게 도움을 요청하는 것도 좋은 방법입니다. 내신 외의 다른 강점(예: 특정 분야 흥미, 잠재력)을 찾는 것도 중요합니다.</p>`;
            }
        }


        // 과목별 성취도/등급 분석 및 조언
        advice += `<p><strong>과목별 주요 특징:</strong></p><ul>`;
        majorSubjects.forEach(subjectInfo => {
            const subj1 = majorSubjectGrades1.find(s => s.name === subjectInfo.name);

            let subjectLine = `<li><strong>${subjectInfo.name}:</strong> `;

            if (subj1 && subj1.grade9 && subj1.achievement) {
                subjectLine += `1학기 ${subj1.grade9.toFixed(1)}등급 (${subj1.achievement}). `;
                if (subj1.grade9 <= 2.5) {
                    subjectLine += `매우 우수합니다. 심화 학습을 이어가세요.`;
                } else if (subj1.grade9 >= 6.0) {
                    subjectLine += `개선이 필요합니다. 기초 개념을 다시 다져보세요.`;
                } else {
                    subjectLine += `좋은 성적입니다. 꾸준히 관리하는 것이 중요합니다.`;
                }

            } else if (subj1 && subj1.achievement) { // 등수 데이터가 없어도 점수 기반 성취도는 있으면 표시
                subjectLine += `1학기 성취도 ${subj1.achievement}. (등수 입력 시 등급 분석 가능)`;
            } else {
                subjectLine += `성적 데이터 부족.`;
            }
            subjectLine += `</li>`;
            advice += subjectLine;
        });
        advice += `</ul>`;


        // 입시 방향 조언 (종합 등급을 고려)
        const overallAvgGrade = myAvgGrade9_1;

        if (overallAvgGrade) {
            advice += `<p><strong>입시 방향성 제안 (1학년 1학기 종합 등급: ${overallAvgGrade.toFixed(1)}등급):</strong></p><ul>`;
            if (overallAvgGrade <= 2.5) {
                advice += `<li><strong>학생부종합전형(학종):</strong> 현재 성적은 학종에 매우 유리합니다. 희망 전공과 관련된 교과/비교과 활동을 구체화하고, 학교생활기록부를 더욱 풍성하게 만드는 데 집중하세요.</li>`;
                advice += `<li><strong>학생부교과전형:</strong> 최저학력기준 충족 여부를 확인하며, 안정적인 내신 관리를 통해 교과 전형을 준비할 수 있습니다.</li>`;
            } else if (overallAvgGrade <= 4.5) {
                advice += `<li><strong>학생부종합전형(학종):</strong> 내신 성적을 계속 올리면서, 특정 전공에 대한 강한 관심과 노력(탐구 활동, 동아리, 독서)을 보여줄 수 있는 차별화된 학생부를 만드는 것이 중요합니다.</li>`;
                advice += `<li><strong>정시 (수능):</strong> 1학년 1학기 성적은 중요하지만, 아직 변화할 여지가 많습니다. 주요 과목의 수능 모의고사 성적도 함께 관리하며 정시 준비와 병행하는 것을 고려해볼 수 있습니다.</li>`;
            } else {
                advice += `<li><strong>정시 (수능):</strong> 현재 내신으로는 학생부 위주 전형에서 경쟁력이 낮을 수 있으므로, 과감하게 정시(수능) 준비에 집중하는 전략을 고려해볼 수 있습니다. 주요 과목 위주로 학습량을 늘리고 모의고사 성적을 꾸준히 관리하세요.</li>`;
                advice += `<li><strong>향후 내신 관리:</strong> 1학년 2학기, 2학년에서 성적을 크게 끌어올린다면 학생부 전형의 가능성도 다시 열릴 수 있습니다. 지금부터라도 학습 계획을 철저히 세워보세요.</li>`;
            }
            advice += `</ul>`;
        } else {
             advice += `<p>성적 데이터를 입력해야 입시 방향을 제시할 수 있습니다.</p>`;
        }


        advice += `<p style="font-size: 0.9em; color: #666;">* 이 조언은 입력된 데이터를 기반으로 한 일반적인 가이드이며, 실제 입시는 다양한 요소를 고려해야 합니다. 자세한 내용은 담임 선생님 또는 입시 전문가와 상담하세요.</p>`;
        return advice;
    }


    calculateBtn.addEventListener('click', () => {
        const schoolName = schoolNameInput.value.trim();
        const totalStudents = parseInt(totalStudentsInput.value);

        if (!schoolName) {
            alert('고등학교 이름을 입력해주세요.');
            return;
        }
        if (isNaN(totalStudents) || totalStudents <= 0) {
            alert('전체 1학년 학생 수를 올바르게 입력해주세요.');
            return;
        }

        resultSchoolInfo.textContent = `${schoolName} 1학년 (${totalStudents}명) 기준`;
        gradeResultsDiv.innerHTML = '';
        overallPercentageDiv.innerHTML = '';
        aiAdviceDiv.innerHTML = '';

        let sum9Grade1 = 0;
        let validSubjectCount1 = 0;
        let totalPercentileSum1 = 0;
        let percentileCalcSubjectCount1 = 0;
        const collectedMajorSubjectGrades1 = []; // AI 조언 및 꺾은선 그래프용 1학기 데이터


        // 1. 주요 6과목 (중간/기말 점수 및 등수) 계산 - 1학년 1학기
        majorSubjects.forEach(subject => {
            const midScore = parseInt(document.getElementById(subject.midScoreId1).value);
            const midRank = parseInt(document.getElementById(subject.midRankId1).value);
            const finalScore = parseInt(document.getElementById(subject.finalScoreId1).value);
            const finalRank = parseInt(document.getElementById(subject.finalRankId1).value);

            let subject9Grade = null;
            let subjectPercentile = null;
            let subjectAchievement = null;
            let avgSubjectScore = null;
            let avgSubjectRank = null;

            const validScores = [];
            if (!isNaN(midScore) && midScore >= 0 && midScore <= 100) validScores.push(midScore);
            if (!isNaN(finalScore) && finalScore >= 0 && finalScore <= 100) validScores.push(finalScore);
            if (validScores.length > 0) {
                avgSubjectScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
                subjectAchievement = convertScoreToAchievement(avgSubjectScore);
            }

            const validRanks = [];
            if (!isNaN(midRank) && midRank >= 1 && midRank <= totalStudents) validRanks.push(midRank);
            if (!isNaN(finalRank) && finalRank >= 1 && finalRank <= totalStudents) validRanks.push(finalRank);
            if (validRanks.length > 0) {
                avgSubjectRank = validRanks.reduce((a, b) => a + b, 0) / validRanks.length;
            }

            if (avgSubjectRank !== null) {
                subjectPercentile = ((avgSubjectRank / totalStudents) * 100).toFixed(2);
                subject9Grade = convertPercentileTo9Grade(parseFloat(subjectPercentile));

                sum9Grade1 += subject9Grade;
                totalPercentileSum1 += parseFloat(subjectPercentile);
                validSubjectCount1++;
                percentileCalcSubjectCount1++;
                collectedMajorSubjectGrades1.push({ name: subject.name, grade9: subject9Grade, achievement: subjectAchievement, avgScore: avgSubjectScore, avgRank: avgSubjectRank, percentile: subjectPercentile });

            } else if (avgSubjectScore !== null) {
                collectedMajorSubjectGrades1.push({ name: subject.name, achievement: subjectAchievement, avgScore: avgSubjectScore });
            } else {
                collectedMajorSubjectGrades1.push({ name: subject.name });
            }
        });


        // 2. 예체능 과목 (1학년 1학기 기말고사에만)
        artsSubjects.forEach(subject => {
            const selectedGrade1 = document.getElementById(subject.id1).value;

            let displayMessage1 = '<strong>1학기:</strong> ';
            let grade9Equivalent1 = null;
            if (selectedGrade1 === "" || selectedGrade1 === "선택") {
                displayMessage1 += `등급을 선택해주세요. (계산 제외)`;
            } else if (selectedGrade1 === "not-taken") {
                displayMessage1 += `수강 안 함 (계산 제외)`;
            } else {
                const grade5 = parseInt(selectedGrade1);
                grade9Equivalent1 = convert5GradeTo9Grade(grade5);
                displayMessage1 += `5등급제 ${grade5}등급, 9등급제 환산 ${grade9Equivalent1.toFixed(1)}등급`;
                sum9Grade1 += grade9Equivalent1;
                validSubjectCount1++;
            }

            gradeResultsDiv.innerHTML += `
                <div class="grade-result-item">
                    <strong>${subject.name}:</strong><br>
                    ${displayMessage1}<br>
                </div>
            `;
        });

        // 결과 HTML 구성 및 표시 (주요 6과목)
        majorSubjects.forEach(subject => {
            const subject1Data = collectedMajorSubjectGrades1.find(s => s.name === subject.name) || {};

            gradeResultsDiv.innerHTML += `
                <div class="grade-result-item">
                    <strong>${subject.name}:</strong>
                    <br>
                    <strong>1학기:</strong>
                    ${subject1Data.avgRank !== undefined && subject1Data.avgRank !== null ? `평균 등수 ${subject1Data.avgRank.toFixed(0)}등 (${totalStudents}명 중), ` : ''}
                    ${subject1Data.achievement ? `성취도 ${subject1Data.achievement}, ` : ''}
                    ${subject1Data.grade9 ? `9등급제 ${subject1Data.grade9}등급, ` : ''}
                    ${subject1Data.percentile ? `백분위 ${subject1Data.percentile}%` : ''}
                    ${Object.keys(subject1Data).length === 1 && subject1Data.name ? '데이터 부족' : ''}
                </div>
            `;
        });


        // 3. 전체 평균 등급 (9등급제, 5등급제) 및 전체 상위 퍼센트 계산 및 표시
        let finalAverage9Grade1 = null;
        let averagePercentile1 = null;
        let average5Grade1 = null;

        if (validSubjectCount1 > 0) {
            const rawAverage9Grade1 = sum9Grade1 / validSubjectCount1;
            finalAverage9Grade1 = rawAverage9Grade1; // 반올림 하지 않은 등급으로 AI 조언에 사용
            average5Grade1 = convert9GradeTo5Grade(rawAverage9Grade1);

            if (percentileCalcSubjectCount1 > 0) {
                 averagePercentile1 = (totalPercentileSum1 / percentileCalcSubjectCount1).toFixed(2);
            }
        }

        // 전체 상위 퍼센트 표시
        if (averagePercentile1) {
            let percentageHtml = `
                <p>입력된 주요 과목 등수들의 평균으로 추정할 때,</p>
                <p><strong>1학기:</strong> 전교 <span style="color: #007bff; font-size: 1.3em;">상위 ${averagePercentile1}%</span></p>
            `;
            overallPercentageDiv.innerHTML = percentageHtml;
        } else {
            overallPercentageDiv.innerHTML = `
                <p style="font-size: 0.9em; color: #888;">(등수 입력 과목이 없어 상위 백분위 계산이 어렵습니다.)</p>
            `;
        }

        // 4. 차트 그리기
        drawGradeChart(finalAverage9Grade1, average5Grade1);
        // 초기에는 점수 그래프 표시
        drawScoreRankChangeChart(collectedMajorSubjectGrades1, currentChartType);

        // 5. AI 조언 생성
        if (finalAverage9Grade1 !== null) {
            aiAdviceDiv.innerHTML = generateAiAdvice(
                schoolName,
                finalAverage9Grade1, averagePercentile1, collectedMajorSubjectGrades1
            );
        } else {
            aiAdviceDiv.innerHTML = `<p>성적 데이터를 입력해야 AI 조언을 받을 수 있습니다.</p>`;
        }
    });

    // 차트 보기 옵션 버튼 이벤트 리스너
    showScoreChartBtn.addEventListener('click', () => {
        currentChartType = 'score';
        showScoreChartBtn.classList.add('active');
        showRankChartBtn.classList.remove('active');
        calculateBtn.click(); // 다시 계산하여 그래프를 업데이트
    });

    showRankChartBtn.addEventListener('click', () => {
        currentChartType = 'rank';
        showRankChartBtn.classList.add('active');
        showScoreChartBtn.classList.remove('active');
        calculateBtn.click(); // 다시 계산하여 그래프를 업데이트
    });
});