# 📋 API Forge 프로젝트 TODO List

## Phase 1: 프로젝트 초기 설정 (Day 1) ✅

### 1.1 기본 프로젝트 설정 ✅
- [x] `npm init -y` 실행으로 package.json 생성
- [x] TypeScript 및 기본 의존성 설치
  - [x] `npm install -D typescript @types/node ts-node tsx`
  - [x] `npm install @modelcontextprotocol/sdk zod`
  - [x] `npm install axios`
  - [x] `npm install -D jest @types/jest ts-jest`
- [x] tsconfig.json 설정 생성 (ES2022, strict mode)
- [x] .gitignore 파일 생성
- [x] .prettierrc 파일 생성 (선택적)
- [ ] ESLint 설정 (선택적)

### 1.2 프로젝트 구조 생성 ✅
- [x] src/ 디렉토리 생성
  - [x] src/mcp/ 디렉토리 생성
    - [ ] src/mcp/server.ts 파일 생성
    - [x] src/mcp/tools/ 디렉토리 생성
  - [x] src/core/ 디렉토리 생성
    - [x] src/core/services/ 디렉토리 생성
    - [x] src/core/models/ 디렉토리 생성
  - [x] src/http/ 디렉토리 생성
  - [x] src/types/ 디렉토리 생성
- [x] tests/ 디렉토리 생성
- [x] examples/ 디렉토리 생성
- [x] docs/ 디렉토리 생성

### 1.3 개발 스크립트 설정 ✅
- [x] package.json scripts 추가
  - [x] `"dev": "tsx src/mcp/server.ts"`
  - [x] `"build": "tsc"`
  - [x] `"test": "jest"`
  - [ ] `"lint": "eslint src/**/*.ts"` (선택적)
  - [x] `"format": "prettier --write src/**/*.ts"` (선택적)

## Phase 2: MVP MCP 서버 구현 (Day 2-3) ✅

### 2.1 기본 MCP 서버 구현 ✅
- [x] server.ts에 MCP 서버 클래스 구현
- [x] StdioServerTransport 설정
- [x] 서버 초기화 및 시작 로직
- [x] 기본 에러 핸들링
- [x] 로깅 설정

### 2.2 첫 번째 도구: test_http_endpoint ✅
- [x] ListToolsRequestSchema 핸들러 구현
- [x] CallToolRequestSchema 핸들러 구현
- [x] test_http_endpoint 도구 정의
  - [x] GET 요청 지원
  - [x] URL 파라미터 처리
  - [x] 응답 상태 및 본문 반환
- [x] 기본 에러 처리 구현
- [ ] 도구 테스트 코드 작성

### 2.3 Claude Desktop 연동 테스트 ✅
- [x] claude_desktop_config.json 예제 파일 생성
- [x] README에 설정 방법 문서화
- [ ] 로컬 MCP 서버 등록 테스트
- [ ] 기본 동작 확인 (GET 요청)
- [ ] 디버깅 가이드 작성

## Phase 3: HTTP 클라이언트 구현 (Day 4-5) ✅

### 3.1 HttpTestClient 클래스 ✅
- [x] src/http/HttpTestClient.ts 파일 생성
- [x] Axios 인스턴스 설정
- [x] HTTP 메소드 구현
  - [x] GET 메소드
  - [x] POST 메소드
  - [x] PUT 메소드
  - [x] DELETE 메소드
  - [x] PATCH 메소드
  - [x] HEAD 메소드 (추가)
  - [x] OPTIONS 메소드 (추가)
- [x] 요청/응답 인터셉터 구현
- [x] 응답 시간 측정 기능
- [x] 응답 크기 계산 기능
- [x] 에러 처리 및 재시도 로직

### 3.2 검증 엔진 기본 구현 ✅
- [x] src/core/services/ValidationService.ts 생성
- [x] Assertion 인터페이스 정의
- [x] 검증 타입 구현
  - [x] 상태 코드 검증
  - [x] 헤더 검증
  - [x] 응답 본문 검증
  - [x] 응답 시간 검증
  - [x] Content-Type 검증 (추가)
  - [x] Contains/NotContains 검증 (추가)
  - [x] Regex 매칭 검증 (추가)
- [x] JSONPath 지원 추가
- [x] 검증 결과 모델 정의
- [x] 테스트 코드 작성

### 3.3 향상된 MCP 도구 ✅
- [x] test_with_assertions 도구 추가
- [x] 검증 규칙 스키마 정의
- [x] 상세한 결과 포맷팅
- [x] 에러 메시지 개선
- [ ] 도구 문서화 (README 업데이트 필요)

## Phase 4: 핵심 기능 확장 (Day 6-8) ✅

### 4.1 인증 지원 ✅
- [x] AuthConfig 인터페이스 정의
- [x] Bearer Token 인증 구현
- [x] API Key 인증 구현
- [x] Basic Auth 인증 구현
- [x] OAuth 2.0 지원 (선택적)
- [x] 인증 설정 도구 추가 (set_auth_config, test_with_auth)
- [ ] 인증 테스트 예제 작성

### 4.2 배치 테스트 ✅
- [x] batch_test 도구 구현
- [x] 병렬 요청 처리 로직
- [x] 요청 제한 (rate limiting) 기능 (maxConcurrent, delayBetween)
- [x] 결과 집계 로직
- [x] 진행 상황 리포팅 (BatchTestReport)
- [ ] 배치 테스트 예제 작성

### 4.3 환경 설정 관리 ✅
- [x] ConfigManager 클래스 구현
- [x] 환경별 설정 파일 구조 정의 (JSON 형식)
- [x] 베이스 URL 관리 기능
- [x] 환경 변수 치환 기능 (${VAR} 문법)
- [x] 설정 파일 로드/저장 (load_config, set_environment)
- [x] 설정 검증 로직 (Zod 스키마 사용)

## Phase 5: OpenAPI 통합 및 테스트 자동화 (Week 2)

### 5.1 OpenAPI/Swagger 파서
- [ ] swagger-parser 의존성 설치
- [ ] OpenApiParser 클래스 구현
- [ ] 명세 파일 읽기 (URL/파일/JSON)
- [ ] OpenAPI 3.x 지원
- [ ] Swagger 2.0 지원
- [ ] 엔드포인트 추출 및 분석
- [ ] 파라미터 파싱 (path, query, body, header)
- [ ] 요청/응답 스키마 파싱
- [ ] 인증 요구사항 파싱
- [ ] 서버 URL 및 환경 정보 추출

### 5.2 AI 기반 테스트 시나리오 생성
- [ ] TestScenarioGenerator 클래스 구현
- [ ] 명세 분석 알고리즘
  - [ ] 엔드포인트 의존성 분석
  - [ ] 필수/선택 파라미터 식별
  - [ ] 데이터 타입 및 제약조건 파악
- [ ] 테스트 시나리오 자동 생성
  - [ ] Happy path 테스트
  - [ ] Error handling 테스트 (4xx, 5xx)
  - [ ] Boundary value 테스트
  - [ ] Invalid input 테스트
  - [ ] Security 테스트 (injection, overflow)
  - [ ] Performance 테스트 시나리오
- [ ] 테스트 데이터 생성 (faker.js 활용)
  - [ ] 스키마 기반 자동 생성
  - [ ] Edge case 데이터 생성
  - [ ] 관계형 데이터 세트 생성

### 5.3 MCP 도구 구현
- [ ] analyze_api_spec 도구
  - [ ] 명세 파일 로드 및 파싱
  - [ ] 엔드포인트 목록 반환
  - [ ] 스키마 정보 제공
- [ ] generate_test_scenarios 도구
  - [ ] AI 분석 기반 시나리오 생성
  - [ ] 우선순위 및 카테고리 분류
  - [ ] 의존성 순서 결정
- [ ] execute_test_scenarios 도구
  - [ ] 시나리오별 순차/병렬 실행
  - [ ] 기존 Phase 4 도구들 활용
  - [ ] 실시간 진행상황 리포팅
- [ ] recommend_test_cases 도구
  - [ ] AI 기반 추가 테스트 추천
  - [ ] 커버리지 갭 분석
  - [ ] 리스크 기반 우선순위

### 5.4 테스트 실행 엔진
- [ ] TestExecutor 클래스 구현
- [ ] 시나리오 기반 테스트 실행
- [ ] 의존성 관리 (인증 → API 호출)
- [ ] 병렬 실행 최적화
- [ ] 실패 시 재시도 로직
- [ ] 테스트 격리 및 정리

## Phase 6: 리포팅 및 모니터링 (Week 3)

### 6.1 테스트 리포트 생성
- [ ] TestReporter 클래스 구현
- [ ] 리포트 포맷 지원
  - [ ] HTML 리포트 (인터랙티브 차트)
  - [ ] Markdown 리포트 (PR 코멘트용)
  - [ ] JSON 리포트 (CI/CD 통합용)
  - [ ] JUnit XML (CI 도구 호환)
- [ ] 리포트 컨텐츠
  - [ ] 테스트 요약 (성공률, 실행시간)
  - [ ] 엔드포인트별 커버리지
  - [ ] 상세 테스트 결과
  - [ ] 실패 원인 분석
  - [ ] 성능 메트릭 (응답시간 분포)
  - [ ] 보안 취약점 요약
- [ ] 차트/그래프 생성
  - [ ] 응답 시간 히스토그램
  - [ ] 성공/실패 파이 차트
  - [ ] 시계열 성능 그래프
- [ ] generate_test_report MCP 도구 추가

### 6.2 CI/CD 통합
- [ ] CI 통합 지원
  - [ ] Exit code 기반 성공/실패
  - [ ] 테스트 결과 아티팩트 저장
  - [ ] GitHub Actions 예제
  - [ ] GitLab CI 예제
- [ ] PR 자동 코멘트
  - [ ] 테스트 결과 요약
  - [ ] 커버리지 변화
  - [ ] 새로운 실패 하이라이트

### 6.3 실시간 모니터링 (선택적)
- [ ] 개발 중 API 변경 감지
- [ ] 파일 감시 모드
- [ ] 자동 재테스트
- [ ] 실시간 알림

## Phase 7: 품질 및 배포 (Week 4)

### 7.1 테스트 작성
- [ ] 단위 테스트 작성 (>80% 커버리지)
  - [ ] HttpTestClient 테스트
  - [ ] ValidationService 테스트
  - [ ] ConfigManager 테스트
- [ ] 통합 테스트 작성
  - [ ] MCP 서버 통합 테스트
  - [ ] 도구 통합 테스트
- [ ] E2E 테스트 작성
- [ ] 테스트 CI 파이프라인 설정

### 7.2 문서화
- [ ] README.md 작성
  - [ ] 프로젝트 소개
  - [ ] 설치 가이드
  - [ ] 사용 방법
  - [ ] Claude Desktop 설정
- [ ] API 문서 작성
- [ ] 도구별 사용 예제 작성
- [ ] 트러블슈팅 가이드 작성
- [ ] CONTRIBUTING.md 작성

### 7.3 배포 준비
- [ ] package.json 메타데이터 업데이트
- [ ] npm 패키지 설정
  - [ ] .npmignore 파일 생성
  - [ ] prepublish 스크립트 추가
- [ ] GitHub 저장소 설정
  - [ ] LICENSE 파일 추가
  - [ ] GitHub Actions CI/CD 설정
- [ ] 첫 버전 릴리즈 (v0.1.0)
- [ ] npm 퍼블리시

## 🎯 완료 기준

### MVP (Phase 1-3) ✅
- [x] 기본 HTTP 테스트 가능
- [x] Claude Desktop에서 동작 확인
- [x] 간단한 검증 기능 동작

### v0.5.0 (Phase 4-5)
- [x] 인증 지원 (Bearer, Basic, API Key, OAuth2)
- [x] 배치 테스트 가능
- [ ] OpenAPI 명세 분석 및 자동 테스트 생성
- [ ] AI 기반 테스트 시나리오 생성
- [ ] MCP 도구를 통한 테스트 자동화

### v1.0.0 (Phase 6-7)
- [ ] 완전한 리포팅 시스템
- [ ] CI/CD 통합
- [ ] 테스트 커버리지 80% 이상
- [ ] 완전한 문서화
- [ ] npm 패키지 배포

## 📝 Notes

### 프로젝트 목표
- **목적**: 범용 API 테스팅 플랫폼 (테스트 코드 작성 대체)
- **핵심 가치**: AI가 API 명세를 분석하고 MCP 도구로 자동 테스트
- **사용 시나리오**: 
  - 개발 중 API 테스트 자동화
  - CI/CD 파이프라인 통합
  - 테스트 코드 없이 완벽한 테스트 커버리지

### 개발 원칙
- 각 Phase는 독립적으로 테스트 가능해야 함
- Claude Desktop에서 지속적으로 테스트
- 사용자 피드백을 빠르게 반영
- 테스트 코드 생성이 아닌 MCP 도구 실행에 집중