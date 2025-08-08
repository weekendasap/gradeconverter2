document.addEventListener('DOMContentLoaded', () => {
    const schoolNameInput = document.getElementById('schoolName');
    const totalStudentsInput = document.getElementById('totalStudents');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultSchoolInfo = document.getElementById('resultSchoolInfo');
    const gradeResultsDiv = document.getElementById('gradeResults');
    const overallPercentageDiv = document.getElementById('overallPercentage');
    const aiAdviceDiv = document.getElementById('aiAdvice');
    const summaryInsights = document.getElementById('summaryInsights');
    const gradeChartCtx = document.getElementById('gradeChart').getContext('2d');
    const scoreRankChangeChartCtx = document.getElementById('scoreRankChangeChart').getContext('2d');


    // Chart.js 글로벌 라이트 테마 + 애니메이션/인터랙션 기본값
    if (window.Chart) {
        Chart.defaults.color = '#1f2937';
        Chart.defaults.borderColor = 'rgba(0,0,0,0.08)';
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.animation.duration = 800;
        Chart.defaults.animation.easing = 'easeOutQuart';
        Chart.defaults.elements.point.radius = 4;
        Chart.defaults.elements.point.hoverRadius = 6;
        Chart.defaults.elements.line.tension = 0.35;
    }

    // 입력 라벨 간소화 + 숫자입력 속성 적용
    document.querySelectorAll('.grade-inputs label').forEach(l => {
        l.textContent = l.textContent
            .replace(' (중간 점수):', ' 중간:')
            .replace(' (기말 점수):', ' 기말:')
            .replace(' (중간 등수):', ' 중간 등수:')
            .replace(' (기말 등수):', ' 기말 등수:')
            .replace(/\s*\(1~5등급\):/, ':');
    });
    document.querySelectorAll('input[type="number"]').forEach(el => {
        el.step = '1';
        el.inputMode = 'numeric';
    });

    let gradeChart;
    let scoreRankChangeChart;

    // 주요 6과목 정보 (1학년 1학기/2학기 점수, 1학기 등수 입력)
    const majorSubjects = [
        { name: '국어', midScoreId1: 'koreanMidScore1', midRankId1: 'koreanMidRank1', finalScoreId1: 'koreanFinalScore1', finalRankId1: 'koreanFinalRank1', midScoreId2: 'koreanMidScore2', finalScoreId2: 'koreanFinalScore2' },
        { name: '영어', midScoreId1: 'englishMidScore1', midRankId1: 'englishMidRank1', finalScoreId1: 'englishFinalScore1', finalRankId1: 'englishFinalRank1', midScoreId2: 'englishMidScore2', finalScoreId2: 'englishFinalScore2' },
        { name: '수학', midScoreId1: 'mathMidScore1', midRankId1: 'mathMidRank1', finalScoreId1: 'mathFinalScore1', finalRankId1: 'mathFinalRank1', midScoreId2: 'mathMidScore2', finalScoreId2: 'mathFinalScore2' },
        { name: '과학', midScoreId1: 'scienceMidScore1', midRankId1: 'scienceMidRank1', finalScoreId1: 'scienceFinalScore1', finalRankId1: 'scienceFinalRank1', midScoreId2: 'scienceMidScore2', finalScoreId2: 'scienceFinalScore2' },
        { name: '한국사', midScoreId1: 'koreanHistoryMidScore1', midRankId1: 'koreanHistoryMidRank1', finalScoreId1: 'koreanHistoryFinalScore1', finalRankId1: 'koreanHistoryFinalRank1', midScoreId2: 'koreanHistoryMidScore2', finalScoreId2: 'koreanHistoryFinalScore2' },
        { name: '사회', midScoreId1: 'socialMidScore1', midRankId1: 'socialMidRank1', finalScoreId1: 'socialFinalScore1', finalRankId1: 'socialFinalRank1', midScoreId2: 'socialMidScore2', finalScoreId2: 'socialFinalScore2' }
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
                    stack: 'grades',
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 48
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
                    hidden: true, // 기본적으로 숨김
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 48
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
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 12, right: 8, bottom: 4, left: 8 } },
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: '등급', color: '#6b7280' },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: { color: '#6b7280' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: '학생 수', color: '#6b7280' },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: {
                        color: '#6b7280',
                        callback: function (value) { return value + '명'; }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `학교 내 등급별 분포 (나의 1학기 평균: 9등급제 ${myGrade9_1?.toFixed(1) || '-'}등급)`,
                    color: '#111827'
                },
                legend: { labels: { color: '#374151' } },
                tooltip: {
                    backgroundColor: '#ffffff',
                    titleColor: '#111827',
                    bodyColor: '#111827',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                if (label.includes('나의')) {
                                    if (label.includes('1학기') && label.includes('9등급제')) label = `1학기 9등급제: ${myGrade9_1.toFixed(1)}등급`;
                                    else if (label.includes('1학기') && label.includes('5등급제')) label = `1학기 5등급제: ${myGrade5_1}등급`;
                                    else label = `값: ${context.parsed.y}`;
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

    // 과목별 점수 비교 꺾은선 그래프 (1학기 vs 2학기)
    function drawScoreCompareChart(subjectData1, subjectData2) {
        if (scoreRankChangeChart) scoreRankChangeChart.destroy();

        const labels = majorSubjects.map(s => s.name);
        const dataValues1 = labels.map(name => subjectData1.find(s => s.name === name)?.avgScore || null);
        const dataValues2 = labels.map(name => subjectData2.find(s => s.name === name)?.avgScore || null);

        // 라인 그라디언트(fill) 생성
        const h = scoreRankChangeChartCtx.canvas.clientHeight || 400;
        const grad1 = scoreRankChangeChartCtx.createLinearGradient(0, 0, 0, h);
        grad1.addColorStop(0, 'rgba(59,130,246,0.28)');
        grad1.addColorStop(1, 'rgba(59,130,246,0.03)');
        const grad2 = scoreRankChangeChartCtx.createLinearGradient(0, 0, 0, h);
        grad2.addColorStop(0, 'rgba(236,72,153,0.24)');
        grad2.addColorStop(1, 'rgba(236,72,153,0.03)');

        const data = {
            labels,
            datasets: [
                {
                    label: '1학기 평균 점수',
                    data: dataValues1,
                    borderColor: 'rgba(59,130,246,1)',
                    backgroundColor: grad1,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: '2학기 평균 점수',
                    data: dataValues2,
                    borderColor: 'rgba(236,72,153,1)',
                    backgroundColor: grad2,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 12, right: 8, bottom: 4, left: 8 } },
            scales: {
                x: {
                    title: { display: true, text: '과목', color: '#6b7280' },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: { color: '#6b7280' }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: '평균 점수', color: '#6b7280' },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: { color: '#6b7280', callback: v => v + '점' }
                }
            },
            plugins: {
                title: { display: true, text: '1학년 1학기 vs 2학기 과목별 평균 점수', color: '#111827' },
                legend: { labels: { color: '#374151' } },
                tooltip: {
                    backgroundColor: '#ffffff',
                    titleColor: '#111827',
                    bodyColor: '#111827',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10
                }
            }
        };

        scoreRankChangeChart = new Chart(scoreRankChangeChartCtx, { type: 'line', data, options });
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


    // 디바운스 유틸
    const debounce = (fn, wait = 400) => {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    };

    // 전체 입력 요소
    const allInputs = Array.from(document.querySelectorAll('input, select'));

    // LocalStorage 키 접두사
    const LS_PREFIX = 'gradeconvert2:';

    // 값 저장
    const saveState = () => {
        allInputs.forEach(el => {
            const key = LS_PREFIX + el.id;
            if (!el.id) return;
            localStorage.setItem(key, el.value);
        });
    };

    // 값 복원
    const restoreState = () => {
        allInputs.forEach(el => {
            const key = LS_PREFIX + el.id;
            if (!el.id) return;
            const v = localStorage.getItem(key);
            if (v !== null) el.value = v;
        });
    };

    // 등수 입력 요소 수집
    const rankInputIds = [];
    // 주요 과목 정의는 아래 majorSubjects 선언을 사용
    majorSubjects.forEach(s => {
        rankInputIds.push(s.midRankId1, s.finalRankId1);
    });

    // 전체 학생 수 -> 등수 입력 max/placeholder 동기화
    const syncRankInputsWithTotal = () => {
        const total = parseInt(totalStudentsInput.value);
        const ph = isNaN(total) || total <= 0 ? '등수' : `등수 (1~${total})`;
        rankInputIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.placeholder = ph;
            if (!isNaN(total) && total > 0) el.max = String(total);
            else el.removeAttribute('max');
        });
    };

    // 입력 변경 시 자동 저장 + 자동 계산
    const tryAutoCalc = debounce(() => {
        const hasMeta = schoolNameInput.value.trim().length > 0 && !!parseInt(totalStudentsInput.value);
        if (hasMeta) calculateBtn.click();
    }, 450);

    allInputs.forEach(el => {
        el.addEventListener('input', () => {
            saveState();
            if (el === totalStudentsInput) syncRankInputsWithTotal();
            tryAutoCalc();
        });
        el.addEventListener('change', () => {
            saveState();
            tryAutoCalc();
        });
    });

    // 최초 복원 및 동기화
    restoreState();
    syncRankInputsWithTotal();

    // 초기화
    resetBtn.addEventListener('click', () => {
        allInputs.forEach(el => {
            if (el.tagName === 'SELECT') el.value = '';
            else el.value = '';
            localStorage.removeItem(LS_PREFIX + el.id);
        });
        // 결과/차트/요약 초기화
        resultSchoolInfo.textContent = '';
        gradeResultsDiv.innerHTML = '';
        overallPercentageDiv.innerHTML = '';
        aiAdviceDiv.innerHTML = '';
        if (summaryInsights) summaryInsights.innerHTML = '';
        try { if (window.gradeChart) gradeChart.destroy(); } catch {}
        try { if (window.scoreRankChangeChart) scoreRankChangeChart.destroy(); } catch {}
        syncRankInputsWithTotal();
        schoolNameInput.focus();
    });

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

        // 계산 변수/수집 컨테이너
        let sum9Grade1 = 0;
        let validSubjectCount1 = 0;
        let totalPercentileSum1 = 0;
        let percentileCalcSubjectCount1 = 0;
        const collectedMajorSubjectGrades1 = []; // 1학기
        const collectedMajorSubjectScores2 = []; // 2학기


        // 1. 주요 6과목 (중간/기말 점수 및 등수) 계산 - 1학년 1학기
        majorSubjects.forEach(subject => {
            const midScore1 = parseInt(document.getElementById(subject.midScoreId1).value);
            const midRank1 = parseInt(document.getElementById(subject.midRankId1).value);
            const finalScore1 = parseInt(document.getElementById(subject.finalScoreId1).value);
            const finalRank1 = parseInt(document.getElementById(subject.finalRankId1).value);

            const midScore2 = parseInt(document.getElementById(subject.midScoreId2).value);
            const finalScore2 = parseInt(document.getElementById(subject.finalScoreId2).value);

            let subject9Grade = null;
            let subjectPercentile = null;
            let subjectAchievement = null;
            let avgSubjectScore1 = null;
            let avgSubjectRank1 = null;
            let avgSubjectScore2 = null;

            // 1학기 점수/성취도
            const validScores1 = [];
            if (!isNaN(midScore1) && midScore1 >= 0 && midScore1 <= 100) validScores1.push(midScore1);
            if (!isNaN(finalScore1) && finalScore1 >= 0 && finalScore1 <= 100) validScores1.push(finalScore1);
            if (validScores1.length > 0) {
                avgSubjectScore1 = validScores1.reduce((a, b) => a + b, 0) / validScores1.length;
                subjectAchievement = convertScoreToAchievement(avgSubjectScore1);
            }

            // 1학기 등수
            const validRanks1 = [];
            if (!isNaN(midRank1) && midRank1 >= 1 && midRank1 <= totalStudents) validRanks1.push(midRank1);
            if (!isNaN(finalRank1) && finalRank1 >= 1 && finalRank1 <= totalStudents) validRanks1.push(finalRank1);
            if (validRanks1.length > 0) {
                avgSubjectRank1 = validRanks1.reduce((a, b) => a + b, 0) / validRanks1.length;
            }

            if (avgSubjectRank1 !== null) {
                subjectPercentile = ((avgSubjectRank1 / totalStudents) * 100).toFixed(2);
                subject9Grade = convertPercentileTo9Grade(parseFloat(subjectPercentile));

                sum9Grade1 += subject9Grade;
                totalPercentileSum1 += parseFloat(subjectPercentile);
                validSubjectCount1++;
                percentileCalcSubjectCount1++;
                collectedMajorSubjectGrades1.push({
                    name: subject.name,
                    grade9: subject9Grade,
                    achievement: subjectAchievement,
                    avgScore: avgSubjectScore1,
                    avgRank: avgSubjectRank1,
                    percentile: subjectPercentile
                });
            } else if (avgSubjectScore1 !== null) {
                collectedMajorSubjectGrades1.push({ name: subject.name, achievement: subjectAchievement, avgScore: avgSubjectScore1 });
            } else {
                collectedMajorSubjectGrades1.push({ name: subject.name });
            }

            // 2학기 점수만 평균
            const validScores2 = [];
            if (!isNaN(midScore2) && midScore2 >= 0 && midScore2 <= 100) validScores2.push(midScore2);
            if (!isNaN(finalScore2) && finalScore2 >= 0 && finalScore2 <= 100) validScores2.push(finalScore2);
            if (validScores2.length > 0) {
                avgSubjectScore2 = validScores2.reduce((a, b) => a + b, 0) / validScores2.length;
                collectedMajorSubjectScores2.push({ name: subject.name, avgScore: avgSubjectScore2 });
            } else {
                collectedMajorSubjectScores2.push({ name: subject.name, avgScore: null });
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
				<p><strong>1학기:</strong> 전교 <span style="color: #2563eb; font-size: 1.3em;">상위 ${averagePercentile1}%</span></p>
			`;
			overallPercentageDiv.innerHTML = percentageHtml;
		} else {
			overallPercentageDiv.innerHTML = `
				<p style="font-size: 0.9em; color: #888;">(등수 입력 과목이 없어 상위 백분위 계산이 어렵습니다.)</p>
			`;
		}

        // 4. 차트 그리기
        drawGradeChart(finalAverage9Grade1, average5Grade1);
        drawScoreCompareChart(
            collectedMajorSubjectGrades1,   // 1학기 평균 점수 포함
            collectedMajorSubjectScores2    // 2학기 평균 점수
        );

        // 5. AI 조언 생성 - 기존 로직 유지 (1학기 기반)
        if (finalAverage9Grade1 !== null) {
            aiAdviceDiv.innerHTML = generateAiAdvice(
                schoolName,
                finalAverage9Grade1, averagePercentile1, collectedMajorSubjectGrades1
            );
        } else {
            aiAdviceDiv.innerHTML = `<p>성적 데이터를 입력해야 AI 조언을 받을 수 있습니다.</p>`;
        }

        // 요약 지표 생성
        const subjectNames = majorSubjects.map(s => s.name);
        const avg1BySubject = new Map();
        const avg2BySubject = new Map();
        collectedMajorSubjectGrades1.forEach(s => avg1BySubject.set(s.name, s.avgScore ?? null));
        collectedMajorSubjectScores2.forEach(s => avg2BySubject.set(s.name, s.avgScore ?? null));

        // 전체 평균
        const v1 = subjectNames.map(n => avg1BySubject.get(n)).filter(v => typeof v === 'number');
        const v2 = subjectNames.map(n => avg2BySubject.get(n)).filter(v => typeof v === 'number');
        const mean = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : null;
        const overall1 = mean(v1);
        const overall2 = mean(v2);
        const overallDelta = (overall1 !== null && overall2 !== null) ? (overall2 - overall1) : null;

        // 과목별 상승/하락 탐색
        const diffs = subjectNames.map(n => {
            const a = avg1BySubject.get(n);
            const b = avg2BySubject.get(n);
            return (typeof a === 'number' && typeof b === 'number') ? { name: n, delta: (b - a), a, b } : null;
        }).filter(Boolean);

        let bestUp = null, worstDown = null, upCnt = 0, downCnt = 0;
        diffs.forEach(d => {
            if (d.delta > 0) { upCnt++; if (!bestUp || d.delta > bestUp.delta) bestUp = d; }
            else if (d.delta < 0) { downCnt++; if (!worstDown || d.delta < worstDown.delta) worstDown = d; }
        });

        // 요약 HTML
        if (summaryInsights) {
            let html = '';
            if (overall1 !== null || overall2 !== null) {
                html += `<p>전체 평균 점수: `
                    + `${overall1 !== null ? `1학기 ${overall1.toFixed(1)}점` : '-'} → `
                    + `${overall2 !== null ? `2학기 ${overall2.toFixed(1)}점` : '-'}`;
                if (overallDelta !== null) {
                    const cls = overallDelta >= 0 ? 'delta-up' : 'delta-down';
                    html += ` (<span class="${cls}">${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(1)}점</span>)`;
                }
                html += `</p>`;
            } else {
                html += `<p>학기별 점수 데이터가 부족합니다.</p>`;
            }

            if (bestUp) {
                html += `<p>최대 상승 과목: <strong>${bestUp.name}</strong> (+${bestUp.delta.toFixed(1)}점)</p>`;
            }
            if (worstDown) {
                html += `<p>최대 하락 과목: <strong>${worstDown.name}</strong> (${worstDown.delta.toFixed(1)}점)</p>`;
            }
            if (diffs.length > 0) {
                html += `<p>과목별 변화: 상승 ${upCnt}개 · 하락 ${downCnt}개</p>`;
            }

            summaryInsights.innerHTML = html;
        }
    });

    // 점수/등수 토글 버튼 관련 코드 삭제
});