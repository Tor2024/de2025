// Структурированный учебный план для корейского языка по уровням
export type Topic = { title: string; description?: string };
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type CurriculumStage = {
  level: Level;
  grammar: Topic[];
  vocabulary: Topic[];
};

export const koreanCurriculum: CurriculumStage[] = [
  {
    level: 'A1',
    grammar: [
      { title: '인칭대명사와 동사 "이다"', description: '저, 너, 그/그녀, 우리, 너희, 그들; 입니다.' },
      { title: '동사의 현재형', description: '기본 동사 활용.' },
      { title: '명사의 단수와 복수', description: '~들.' },
      { title: '부정문', description: '아니요, ~지 않다.' },
      { title: '의문문', description: '~입니까?, 무엇, 누구, 어디.' },
      { title: '기본 조사', description: '은/는, 이/가, 을/를, 에, 에서.' },
      { title: '시간 표현', description: '오늘, 내일, 어제.' },
      { title: '수사', description: '하나, 둘, 셋...' },
      { title: '형용사의 기본', description: '크다, 작다, 좋다, 나쁘다.' },
      { title: '기본 표현', description: '있다, 없다, 할 수 있다.' },
    ],
    vocabulary: [
      { title: '인사와 자기소개', description: '안녕하세요, 안녕히 가세요, 제 이름은...' },
      { title: '가족', description: '어머니, 아버지, 형, 누나...' },
      { title: '숫자', description: '하나, 둘, 셋...' },
      { title: '직업', description: '선생님, 의사, 학생...' },
      { title: '음식과 음료', description: '밥, 물, 사과...' },
      { title: '날씨', description: '맑음, 비, 눈...' },
      { title: '날짜와 시간', description: '월요일, 달, 년...' },
      { title: '도시와 교통', description: '버스, 역, 길...' },
      { title: '집과 가구', description: '테이블, 의자, 방...' },
      { title: '쇼핑', description: '사다, 가격, 슈퍼마켓...' },
    ],
  },
  {
    level: 'A2',
    grammar: [
      { title: '비교와 최상급', description: '더, 가장.' },
      { title: '과거형', description: '~았다/었다.' },
      { title: '미래 표현', description: '~겠다, ~을 것이다.' },
      { title: '가산/불가산 명사', description: '몇, 많이.' },
      { title: '가능/의무 표현', description: '~할 수 있다, ~해야 한다.' },
      { title: '진행형', description: '~고 있다.' },
      { title: '빈도 부사', description: '항상, 자주, 가끔, 전혀.' },
      { title: '목적어 대명사', description: '저를, 너를, 그를 등.' },
      { title: '시간 조사', description: '~에, ~부터, ~까지.' },
      { title: '부가 의문문', description: '~지요?' },
    ],
    vocabulary: [
      { title: '여행', description: '기차, 표, 출발...' },
      { title: '축제', description: '생일, 설날...' },
      { title: '건강', description: '의사, 병, 약...' },
      { title: '옷과 색깔', description: '바지, 셔츠, 파랑, 빨강...' },
      { title: '직장과 직업', description: '사무실, 동료, 상사...' },
      { title: '편지와 이메일', description: '편지, 이메일...' },
      { title: '약속과 시간', description: '약속, 시간...' },
    ],
  },
  {
    level: 'B1',
    grammar: [
      { title: '과거 진행형', description: '~고 있었다.' },
      { title: '조건문', description: '만약 ~면, ~면.' },
      { title: '관계대명사', description: '~의, 누구, 무엇, 어디.' },
      { title: '간접화법', description: '~라고 말했다.' },
      { title: '동사 반복', description: '가보다, 말해보다.' },
      { title: '최근 완료', description: '방금 ~했다.' },
      { title: '재귀 동사', description: '자신...' },
      { title: '수동태', description: '~되다.' },
      { title: '의문 구조', description: '어떻게, 얼마, 왜...' },
      { title: '형용사 순서', description: '크고 예쁜 집.' },
    ],
    vocabulary: [
      { title: '직업과 경력', description: '직업, 지원, 상사...' },
      { title: '교육', description: '학교, 대학교...' },
      { title: '사회와 문화', description: '문화, 미디어...' },
      { title: '자연과 환경', description: '자연, 환경...' },
      { title: '이야기와 사건', description: '이야기, 사건...' },
      { title: '감정과 의견', description: '감정, 의견...' },
    ],
  },
  {
    level: 'B2',
    grammar: [
      { title: '과거 완료', description: '~았/었었다.' },
      { title: '가정법', description: '만약 ~였다면 좋았을 텐데.' },
      { title: '추측/가설', description: '~일지도 모른다, 아마.' },
      { title: '사역 구조', description: '~하게 하다.' },
      { title: '소망 표현', description: '~고 싶다, ~해 주었으면 한다.' },
      { title: '도치문', description: '결코 본 적이 없다...' },
      { title: '접속사', description: '하지만, 그러나, ~에도 불구하고.' },
      { title: '강조 구조', description: '~인 것은 ...이다.' },
      { title: '연어', description: '결정을 내리다, 숙제를 하다.' },
      { title: '동사+조사 결합', description: '나가다, 다니다...' },
    ],
    vocabulary: [
      { title: '비즈니스와 금융', description: '비즈니스, 돈, 은행...' },
      { title: '과학과 기술', description: '기술, 연구...' },
      { title: '여행과 문화', description: '여행, 관광...' },
      { title: '경제', description: '경제, 금융...' },
      { title: '건강과 스포츠', description: '건강, 영양, 운동...' },
      { title: '인간관계', description: '우정, 관계...' },
    ],
  },
  {
    level: 'C1',
    grammar: [
      { title: '고급 수동태', description: '~라고 불린다, ~라고 여겨진다.' },
      { title: '복잡한 문형', description: '여러 종속절.' },
      { title: '격식/비격식 표현', description: '상황에 맞는 스타일.' },
      { title: '관용구와 고정 표현', description: '식은 죽 먹기, 손에 땀을 쥐다.' },
      { title: '논증과 의견 표현', description: '찬성/반대의 다양한 표현.' },
      { title: '명사화', description: '동사/형용사를 명사로.' },
    ],
    vocabulary: [
      { title: '학술 어휘', description: '연구, 분석, 논문...' },
      { title: '비즈니스 커뮤니케이션', description: '협상, 발표...' },
      { title: '미디어', description: '신문, 방송, 미디어...' },
      { title: '정치와 사회', description: '정부, 사회, 선거...' },
      { title: '생태와 환경', description: '기후 변화, 환경 보호...' },
      { title: '문화와 예술', description: '문학, 연극, 예술...' },
    ],
  },
  {
    level: 'C2',
    grammar: [
      { title: '복잡한 구조의 숙달', description: '다층 구조, 고급 문형.' },
      { title: '스타일과 레지스터의 미묘한 차이', description: '격식, 비격식, 학술.' },
      { title: '모든 시제/태의 유연한 운용', description: '현재, 과거, 미래, 수동 등.' },
      { title: '고급 관용구/속담', description: '속담, 관용구.' },
      { title: '추상적 논증', description: '철학, 예술, 정치.' },
      { title: '텍스트 분석과 해석', description: '문학 비평, 에세이.' },
    ],
    vocabulary: [
      { title: '추상적/철학적 개념', description: '윤리, 미학, 정의...' },
      { title: '고급 전문 어휘', description: '법률, 의학, 기술...' },
      { title: '문학/예술 용어', description: '은유, 상징...' },
      { title: '문화 간 커뮤니케이션', description: '문화 간, 세계화...' },
      { title: '현대 트렌드', description: '디지털화, 혁신...' },
      { title: '토론/논쟁 표현', description: '의견을 말하다, 반대하다...' },
    ],
  },
]; 
