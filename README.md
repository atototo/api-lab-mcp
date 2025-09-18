# API Lab MCP 🧪

Claude Desktop과 통합되는 API 테스팅 실험실 - 강력한 MCP (Model Context Protocol) 서버입니다.

## 주요 기능

- 🚀 **HTTP 테스팅**: 모든 HTTP 메소드 지원 (GET, POST, PUT, DELETE, PATCH 등)
- 🔐 **인증**: Bearer 토큰, API 키, Basic 인증 지원
- ⏱️ **성능 메트릭**: 응답 시간 및 크기 추적
- 🛠️ **쉬운 통합**: Claude Desktop과 간단한 설정
- 📊 **상세한 응답**: 헤더, 본문, 메트릭을 포함한 포괄적인 테스트 결과

## 설치

1. 저장소 클론:
```bash
git clone https://github.com/atototo/api-lab-mcp.git
cd api-lab-mcp
```

2. 의존성 설치:
```bash
npm install
```

3. 프로젝트 빌드:
```bash
npm run build
```

## 빠른 시작

### 개발 모드

개발 모드로 MCP 서버 실행:
```bash
npm run dev
```

### 프로덕션 모드

빌드 후 컴파일된 버전 실행:
```bash
npm run build
node dist/mcp/server.js
```

## 로컬 설치 및 사용

### Claude Code에 추가

로컬에서 개발 중인 API Lab MCP를 Claude Code에 추가:

```bash
# 1. 먼저 프로젝트 빌드
cd /path/to/api-lab-mcp
npm run build

# 2. Claude Code 터미널에서 MCP 서버로 추가
claude mcp add api-lab-local node /absolute/path/to/api-lab-mcp/dist/mcp/server.js

# 예시 (실제 프로젝트 경로로 변경)
claude mcp add api-lab-local node ~/projects/api-lab-mcp/dist/mcp/server.js
```

### Claude Desktop 설정

Claude Desktop을 사용하는 경우 설정 JSON에 직접 추가:

```json
{
  "mcpServers": {
    "api-lab-local": {
      "command": "node",
      "args": [
        "/absolute/path/to/api-lab-mcp/dist/mcp/server.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

경로를 실제 프로젝트 위치로 변경하세요.

## Claude Desktop 설정

1. Claude Desktop 설정 열기
2. MCP 서버 설정으로 이동
3. 다음 설정 추가:

```json
{
  "mcpServers": {
    "api-lab": {
      "command": "node",
      "args": [
        "/절대/경로/api-lab-mcp/dist/mcp/server.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

`/절대/경로/api-lab-mcp`를 실제 프로젝트 디렉토리 경로로 변경하세요.

## 사용 예제

Claude Desktop에 설정 후 다음과 같은 명령을 사용할 수 있습니다:

### 기본 GET 요청
```
test_http_endpoint 도구를 사용해서 GET https://api.github.com/users/github 테스트해줘
```

### 본문이 있는 POST 요청
```
test_http_endpoint로 https://httpbin.org/post에 {"name": "test", "value": 123} 본문으로 POST 요청 보내줘
```

### 인증이 필요한 요청
```
https://api.example.com/protected를 bearer 토큰 "your-token-here"로 테스트해줘
```

## 사용 가능한 도구

### 1. HTTP 테스팅 도구

#### test_http_endpoint
기본 HTTP 엔드포인트 테스트 도구입니다.

**매개변수:**
- `url` (필수): 테스트할 URL
- `method`: HTTP 메소드 (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- `headers`: 키-값 쌍의 사용자 정의 헤더
- `body`: POST/PUT/PATCH 요청의 요청 본문
- `timeout`: 요청 타임아웃 (밀리초, 기본값: 30000)
- `auth`: 인증 설정
  - `type`: 'bearer', 'apikey', 또는 'basic'
  - `token`: Bearer 토큰
  - `key`: API 키
  - `keyName`: API 키의 헤더 이름
  - `username`: Basic 인증 사용자명
  - `password`: Basic 인증 비밀번호

#### test_with_assertions
응답 검증을 위한 어서션이 포함된 고급 테스트 도구입니다.

**매개변수:**
- HTTP 엔드포인트 테스트의 모든 매개변수
- `assertions`: 응답 검증 규칙 배열
  - `type`: 검증 유형 (status, header, body, jsonPath, responseTime)
  - `expected`: 기대값
  - `path`: JSONPath 표현식 (jsonPath 유형용)
  - `comparison`: 비교 연산자 (equals, contains, greaterThan, lessThan)

#### test_with_auth
인증이 필요한 엔드포인트를 간편하게 테스트하는 도구입니다.

**매개변수:**
- 기본 HTTP 테스트 매개변수
- `authType`: bearer, apikey, basic, oauth2 중 선택
- 각 인증 타입별 필수 매개변수

#### batch_test
여러 엔드포인트를 동시에 테스트하는 배치 실행 도구입니다.

**매개변수:**
- `tests`: 테스트 배열 (각각 개별 테스트 설정 포함)
- `parallel`: 병렬 실행 여부 (true/false)
- `continueOnFailure`: 실패 시 계속 진행 여부

### 2. 설정 관리 도구

#### load_config
설정 파일을 로드하고 관리합니다.

**매개변수:**
- `path`: 설정 파일 경로
- `format`: json, yaml, env 중 선택

#### set_auth_config
전역 인증 설정을 구성합니다.

**매개변수:**
- `authType`: 인증 타입
- `config`: 인증 설정 객체

#### set_environment
환경 변수와 기본 URL을 설정합니다.

**매개변수:**
- `name`: 환경 이름 (dev, staging, production 등)
- `baseUrl`: 기본 API URL
- `variables`: 환경 변수 객체

### 3. API 명세 분석 도구

#### analyze_api_spec
OpenAPI/Swagger 명세를 분석하고 정보를 추출합니다.

**매개변수:**
- `specUrl` 또는 `specPath`: API 명세 위치
- `format`: openapi, swagger 중 선택

#### generate_test_scenarios
API 명세에서 자동으로 테스트 시나리오를 생성합니다.

**매개변수:**
- `spec`: API 명세 (URL 또는 객체)
- `options`: 생성 옵션
  - `includeAuth`: 인증 테스트 포함
  - `includeValidation`: 유효성 검사 포함
  - `includeErrorCases`: 오류 케이스 포함

### 4. MCP 프로토콜 도구

#### discover_mcp_server
MCP 서버를 탐색하고 사용 가능한 도구를 발견합니다.

**매개변수:**
- `serverUrl`: MCP 서버 URL
- `transport`: stdio, http 중 선택

#### test_mcp_endpoint
MCP 프로토콜 엔드포인트를 테스트합니다.

**매개변수:**
- `server`: MCP 서버 정보
- `method`: 호출할 메소드
- `params`: 메소드 매개변수

#### generate_mcp_tests
MCP 서버 명세에서 테스트를 자동 생성합니다.

**매개변수:**
- `server`: MCP 서버 정보
- `options`: 생성 옵션

## 개발

### 프로젝트 구조
```
api-lab-mcp/
├── src/
│   ├── mcp/              # MCP 서버 구현
│   │   ├── server.ts     # 메인 MCP 서버
│   │   ├── http-server.ts # HTTP 서버 모드
│   │   ├── tools/        # MCP 도구 구현
│   │   └── resources/    # MCP 리소스
│   ├── core/             # 핵심 비즈니스 로직
│   │   ├── services/     # 서비스 레이어
│   │   └── utils/        # 유틸리티 함수
│   ├── http/             # HTTP 클라이언트
│   └── types/            # TypeScript 타입 정의
├── tests/                # 테스트 파일
├── examples/             # 사용 예제
├── dist/                 # 빌드 출력
└── docs/                 # 문서
```

### 사용 가능한 스크립트

- `npm run dev`: MCP 개발 서버 시작 (stdio 모드)
- `npm run dev:http`: HTTP 서버 모드로 실행
- `npm run build`: TypeScript 파일 빌드
- `npm test`: 테스트 실행
- `npm run test:watch`: 감시 모드로 테스트 실행
- `npm run test:coverage`: 커버리지와 함께 테스트 실행
- `npm run format`: Prettier로 코드 포맷팅
- `npm run typecheck`: 빌드 없이 타입 체크

## 환경 변수

- `LOG_LEVEL`: 로깅 레벨 설정 (DEBUG, INFO, WARN, ERROR)
- `NODE_ENV`: 환경 설정 (development, production)
- `HTTP_PORT`: HTTP 서버 포트 (기본값: 3000, dev:http 모드용)
- `MCP_MODE`: MCP 서버 모드 (stdio, http)

## 문제 해결

### 서버가 시작되지 않음
- 모든 의존성이 설치되었는지 확인: `npm install`
- TypeScript가 성공적으로 빌드되는지 확인: `npm run build`
- Node.js 버전이 16 이상인지 확인: `node --version`

### Claude Desktop이 서버를 인식하지 못함
- 설정의 경로가 절대 경로이고 올바른지 확인
- `dist` 디렉토리에 빌드된 파일이 있는지 확인
- 설정 변경 후 Claude Desktop 재시작

### 요청 실패
- 네트워크 연결 확인
- 대상 API가 접근 가능한지 확인
- 오류 메시지를 위해 서버 로그 검토

## 고급 기능

### 1. 어서션 기반 테스팅
API 응답에 대한 복잡한 검증 규칙을 설정할 수 있습니다:
- 상태 코드 검증
- 헤더 검증
- 본문 내용 검증
- JSONPath를 사용한 중첩 데이터 검증
- 응답 시간 검증

### 2. 배치 테스팅
여러 API를 동시에 또는 순차적으로 테스트:
- 병렬 실행으로 시간 단축
- 실패 시 계속 진행 옵션
- 통합 결과 리포팅

### 3. OpenAPI 통합
- OpenAPI/Swagger 명세 자동 분석
- 명세 기반 테스트 시나리오 자동 생성
- 스키마 검증 및 유효성 검사

### 4. MCP 프로토콜 지원
- MCP 서버 자동 발견
- MCP 도구 및 리소스 테스팅
- MCP 명세 기반 테스트 생성

### 5. 환경 관리
- 다중 환경 설정 지원 (dev, staging, production)
- 환경별 변수 및 인증 설정
- 설정 파일 로드 및 관리

## HTTP 서버 모드

API Lab MCP는 HTTP 서버 모드로도 실행할 수 있습니다:

```bash
# HTTP 서버 시작 (포트 3000)
npm run dev:http
```

HTTP 엔드포인트:
- `POST /test` - API 테스트 실행
- `POST /batch` - 배치 테스트 실행
- `GET /health` - 서버 상태 확인

## 리소스

API Lab MCP는 다음 MCP 리소스를 제공합니다:
- `mcp://api-lab/protocol-guide` - MCP 프로토콜 가이드 및 참조 문서

## 라이선스

MIT

## 기여

기여를 환영합니다! Pull Request를 자유롭게 제출해주세요.

## 지원

문제나 질문이 있으시면 GitHub에 이슈를 열어주세요.