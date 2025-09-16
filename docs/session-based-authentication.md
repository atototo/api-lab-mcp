# 세션 기반 인증 구현 분석

## 현재 상황

API Forge는 현재 다음과 같은 인증 방식을 지원합니다:
- Bearer Token
- Basic Auth  
- API Key
- OAuth2 (client_credentials, refresh_token)

하지만 **세션 기반 인증**과 **SSO 인증**은 지원하지 않습니다.

## 실제 엔터프라이즈 환경의 세션 관리 패턴

### 1. 단순 세션 기반 인증
```
로그인 API 호출 → JSESSIONID 쿠키 받기 → 후속 요청에 쿠키 포함
```

### 2. 다단계 인증 플로우
```
SSO 로그인 → 메인 세션 생성 → 각 서비스별 세션 생성
예: Google 로그인 → Gmail 세션, Drive 세션 각각 생성
```

### 3. 커스텀 세션 토큰 패턴
```
로그인 API → 커스텀 헤더/토큰 반환
- X-Auth-Token: custom-session-id
- X-User-Context: encrypted-user-info
- X-Service-Session: service-specific-token
```

### 4. Spring Security 패턴
```
- JSESSIONID 쿠키
- CSRF 토큰 (X-CSRF-TOKEN)
- Remember-Me 토큰
- SecurityContext 정보
```

### 5. 복잡한 SSO 플로우
```
CAS: 서비스 접근 → CAS 리다이렉트 → 로그인 → ticket 검증 → 세션 생성
SAML: SP 접근 → IdP 리다이렉트 → 로그인 → SAML Response → 세션 생성
```

## 구현 방안 분석

### 방안 1: 직접 세션 입력 (가장 간단)

**사용 방법:**
```typescript
// 개발자 도구에서 복사한 쿠키 값 사용
await setSession({
  cookies: "JSESSIONID=9345535E679DD9DD4...; XSRF-TOKEN=abc123"
});
```

**장점:**
- 즉시 구현 가능
- 브라우저 의존성 없음
- 빠른 테스트 가능

**단점:**
- 수동 작업 필요
- 세션 만료 시 재입력 필요

### 방안 2: 로그인 API 호출 (일반적)

**사용 방법:**
```typescript
await loginAndExtract({
  loginUrl: "/api/auth/login",
  method: "POST",
  credentials: { username: "user", password: "pass" },
  extractSession: {
    cookies: ["JSESSIONID", "XSRF-TOKEN"],
    headers: ["X-Auth-Token"],
    body: {
      userToken: "$.data.token",
      sessionId: "$.session.id"
    }
  }
});
```

**장점:**
- 자동화 가능
- 실제 로그인 플로우 재현
- 세션 갱신 자동화

**단점:**
- 복잡한 설정 필요
- 로그인 API 구조 파악 필요

### 방안 3: 브라우저 자동화 (복잡한 SSO용)

**두 가지 접근:**

#### 3-1. Playwright MCP 연동
```typescript
// 다른 MCP 서버에 브라우저 작업 위임
await callMcpServer('playwright', {
  tool: 'browser_login_flow',
  params: { loginUrl, credentials, extractRules }
});
```

#### 3-2. API Forge 내장 브라우저
```typescript
// API Forge가 직접 브라우저 실행
const browser = await chromium.launch();
// 로그인 수행 후 세션 추출
```

**성능 비교:**
- 브라우저 시작: 1-3초
- 페이지 로드: 2-5초  
- 로그인 과정: 3-10초
- **총 소요시간: 6-18초**

**장점:**
- 복잡한 SSO 지원 (CAS, SAML, OAuth)
- JavaScript 실행 환경
- 실제 브라우저 플로우 완벽 재현

**단점:**
- 느린 성능
- 리소스 사용량 높음
- 추가 의존성 필요

## 권장 구현 전략

### 단계별 접근법

#### 1단계: 기본 세션 지원 (필수)
```typescript
// 새로운 인증 타입 추가
type SessionAuthConfig = {
  type: 'session';
  cookies: string;  // "JSESSIONID=9345535E679DD9DD4..."
  headers?: Record<string, string>;
};

type LoginFlowConfig = {
  type: 'login-flow';
  loginUrl: string;
  credentials: { username: string; password: string };
  extractSession: {
    cookies: string[];
    headers?: string[];
    body?: Record<string, string>;
  };
};
```

#### 2단계: 새로운 MCP 도구
- **set_session**: 수동 세션 설정
- **login_and_extract**: 로그인 API 호출 후 세션 추출  
- **test_with_session**: 세션 기반 API 테스트

#### 3단계: 브라우저 자동화 (선택적)
- Playwright 통합 (조건부 의존성)
- 복잡한 SSO 플로우 지원

### 구현 우선순위

1. **직접 세션 입력** (90% 케이스 커버, 즉시 구현)
2. **로그인 API 호출** (자동화, 일주일 개발)
3. **브라우저 자동화** (특수 케이스, 추후 구현)

## 실제 사용 시나리오

### 시나리오 1: Spring Boot 애플리케이션
```bash
# 1. 수동 세션 설정
set_session cookies="JSESSIONID=ABC123; XSRF-TOKEN=xyz789"

# 2. API 테스트
test_http_endpoint url="/api/user/profile" method="GET"
```

### 시나리오 2: 커스텀 인증 시스템
```bash
# 1. 로그인 플로우
login_and_extract \
  loginUrl="/auth/signin" \
  credentials='{"email":"user@test.com","password":"pass"}' \
  extractSession='{"cookies":["SESSION_ID"],"headers":["X-Auth-Token"]}'

# 2. 서비스별 세션 생성 (필요시)
test_http_endpoint url="/service/init" method="POST"

# 3. 보호된 API 테스트
test_http_endpoint url="/api/protected/data" method="GET"
```

### 시나리오 3: 복잡한 SSO (향후)
```bash
# 브라우저 자동화 필요
browser_login_flow \
  loginUrl="https://cas.company.com/login" \
  selectors='{"username":"#user","password":"#pass"}' \
  waitForRedirect="https://app.company.com/dashboard"
```

## 기술적 구현 세부사항

### 핵심 서비스

#### SessionManager
```typescript
class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  
  store(sessionId: string, data: SessionData): void
  get(sessionId: string): SessionData | null
  clear(sessionId?: string): void
  isExpired(sessionId: string): boolean
}
```

#### LoginFlowService  
```typescript
class LoginFlowService {
  async executeLoginFlow(config: LoginFlowConfig): Promise<SessionData>
  private extractSessionFromResponse(response: any, rules: ExtractionRules): SessionData
  private parseCookies(setCookieHeader: string): Cookie[]
}
```

### 쿠키 관리
```typescript
interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
}

class CookieJar {
  addCookie(cookie: Cookie): void
  getCookiesForUrl(url: string): Cookie[]
  toCookieString(): string  // "name1=value1; name2=value2"
}
```

### 세션 추출 규칙
```typescript
interface ExtractionRules {
  cookies?: string[];           // 추출할 쿠키 이름들
  headers?: string[];          // 추출할 헤더 이름들  
  body?: {                     // JSONPath로 본문에서 추출
    [key: string]: string;     // "token": "$.data.accessToken"
  };
  localStorage?: string[];     // 브라우저 자동화시만
}
```

## 결론

세션 기반 인증 지원을 통해 API Forge는 다음과 같은 이점을 얻을 수 있습니다:

1. **실용성 향상**: 실제 엔터프라이즈 환경의 90% 케이스 지원
2. **개발 효율성**: 브라우저에서 복사-붙여넣기만으로 즉시 테스트 가능
3. **자동화 지원**: 로그인 플로우 자동화로 반복 작업 제거
4. **확장성**: 향후 복잡한 SSO 지원 기반 마련

가장 효율적인 접근법은 **직접 세션 입력**부터 시작하여 단계적으로 **로그인 API 자동화**와 **브라우저 자동화**를 추가하는 것입니다.